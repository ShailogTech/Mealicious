import { db } from '@/lib/db'

/**
 * Mail receiving — polls the company IMAP server (mail.mealicious.store)
 * for unseen messages and inserts them into the ERP Mail Inbox.
 *
 * Environment variables:
 *   IMAP_HOST  — default: mail.mealicious.store
 *   IMAP_PORT  — default: 993 (TLS)
 *   ERP_MAILBOXES — JSON array of mailboxes to poll:
 *     [{"email":"support@mealicious.store","password":"..."},
 *      {"email":"contact@mealicious.store","password":"..."},
 *      {"email":"feedback@mealicious.store","password":"..."}]
 *
 * Dedup: a message is skipped if an ErpMailInbox row already exists with
 * the same toEmail + subject + fromEmail + createdAt-day.
 */

interface MailboxCred {
  email: string
  password: string
}

export function getMailboxes(): MailboxCred[] {
  try {
    const raw = process.env.ERP_MAILBOXES || '[]'
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((m) => m.email && m.password) : []
  } catch {
    return []
  }
}

export function isMailSyncConfigured() {
  return getMailboxes().length > 0
}

// ── Background sync state (module-level; survives across requests in the
// same server process). The IMAP poll can outlive Cloudflare's 100s HTTP
// limit, so the sync route kicks it off unawaited and the admin checks
// status instead of holding the request open. ──
type SyncStatus = {
  running: boolean
  startedAt: string | null
  finishedAt: string | null
  results: { mailbox: string; fetched: number; error?: string }[]
}

const syncState: SyncStatus = {
  running: false,
  startedAt: null,
  finishedAt: null,
  results: [],
}

export function getSyncStatus(): SyncStatus {
  return { ...syncState, results: [...syncState.results] }
}

/** Start a background poll. No-op if one is already running. */
export function startPoll(): void {
  if (syncState.running) return
  syncState.running = true
  syncState.startedAt = new Date().toISOString()
  syncState.finishedAt = null
  syncState.results = []

  pollMailboxes()
    .then((results) => {
      syncState.results = results
    })
    .catch((e) => {
      syncState.results = [{ mailbox: '(poll)', fetched: 0, error: e instanceof Error ? e.message : String(e) }]
    })
    .finally(() => {
      syncState.running = false
      syncState.finishedAt = new Date().toISOString()
    })
}

interface FetchedMail {
  toEmail: string
  fromEmail: string
  fromName: string
  subject: string
  body: string
  date: Date
}

/** Extract text body from an IMAP message body structure. */
function extractText(body: unknown): string {
  if (typeof body === 'string') return body
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    if (typeof b.text === 'string') return b.text
    if (b.textBody && typeof b.textBody === 'object') {
      const parts = b.textBody as { text?: string }[]
      const joined = parts.map((p) => p.text ?? '').join('\n')
      if (joined) return joined
    }
    if (typeof b.html === 'string') return b.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

/** Reject after `ms` so a wedged IMAP connection can never hang the poll forever. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    p.then((v) => { clearTimeout(t); resolve(v) }, (e) => { clearTimeout(t); reject(e) })
  })
}

/**
 * Poll all configured mailboxes via IMAP and import unseen messages.
 * Returns per-mailbox results for the admin UI.
 */
export async function pollMailboxes(): Promise<{ mailbox: string; fetched: number; error?: string }[]> {
  const mailboxes = getMailboxes()
  if (mailboxes.length === 0) {
    return [{ mailbox: '(none)', fetched: 0, error: 'ERP_MAILBOXES not configured' }]
  }

  const { ImapFlow } = await import('imapflow')
  const results: { mailbox: string; fetched: number; error?: string }[] = []

  for (const mb of mailboxes) {
    // Hard per-mailbox ceiling — covers connect, fetch, download and DB writes.
    const outcome = await withTimeout(pollOneMailbox(ImapFlow, mb), 120_000, `poll ${mb.email}`)
      .then(
        (r) => r,
        (e) => ({ fetched: 0, error: e instanceof Error ? e.message : String(e) }),
      )
    results.push({ mailbox: mb.email, ...outcome })
  }

  return results
}

async function pollOneMailbox(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ImapFlowCtor: any,
  mb: MailboxCred,
): Promise<{ fetched: number; error?: string }> {
  const client = new ImapFlowCtor({
    host: process.env.IMAP_HOST || 'mail.mealicious.store',
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    tls: { rejectUnauthorized: false }, // tolerate mail server cert until certbot provisions a proper one
    auth: { user: mb.email, pass: mb.password },
    greetingTimeout: 15000,
    socketTimeout: 30000,
  })

  try {
    await client.connect()
    console.log(`[mail-sync] ${mb.email}: connected`)
    const lock = await client.getMailboxLock('INBOX')
    try {
      // Pass 1 — collect unseen messages from the cursor WITHOUT issuing any
      // other command. ImapFlow must not run download()/messageFlagsAdd()
      // while a fetch cursor is open: the extra command queues behind the
      // cursor and deadlocks the poll.
      const pending: { uid: string; env: Record<string, unknown> | null }[] = []
      for await (const msg of client.fetch({ seen: false }, { envelope: true, uid: true })) {
        pending.push({ uid: String(msg.uid), env: (msg.envelope ?? null) as Record<string, unknown> | null })
      }
      console.log(`[mail-sync] ${mb.email}: ${pending.length} unseen message(s)`)

      // Pass 2 — cursor is closed; now download bodies + mark seen.
      const messages: FetchedMail[] = []
      for (const item of pending) {
        const env = item.env as
          | { to?: { address?: string }[]; from?: { address?: string; name?: string }[]; subject?: string; date?: string }
          | null
        const to = env?.to?.[0]?.address || mb.email
        const from = env?.from?.[0]?.address || ''
        const fromName = env?.from?.[0]?.name || from
        const bodyRaw = await client.download(item.uid, undefined, { uid: true })
        let text = ''
        if (bodyRaw && bodyRaw.content) {
          text = (await Buffer.concat(await collectChunks(bodyRaw.content)).toString('utf8'))
          text = extractText(text)
        }
        messages.push({
          toEmail: to.toLowerCase(),
          fromEmail: from,
          fromName,
          subject: env?.subject || '(no subject)',
          body: text,
          date: env?.date ? new Date(env.date) : new Date(),
        })
        // Mark as seen so it isn't re-imported.
        await client.messageFlagsAdd({ uid: item.uid }, ['\\Seen'], { uid: true })
      }

      // Dedup + insert.
      let fetched = 0
      for (const m of messages) {
        const dayStart = new Date(m.date)
        dayStart.setHours(0, 0, 0, 0)
        const dupe = await db.erpMailInbox.findFirst({
          where: {
            toEmail: m.toEmail,
            fromEmail: m.fromEmail,
            subject: m.subject,
            createdAt: { gte: dayStart },
          },
        })
        if (dupe) continue
        await db.erpMailInbox.create({
          data: {
            toEmail: m.toEmail,
            fromEmail: m.fromEmail,
            fromName: m.fromName,
            subject: m.subject,
            body: m.body,
            category: categorise(m.toEmail),
            isRead: false,
          },
        })
        fetched++
      }
      console.log(`[mail-sync] ${mb.email}: imported ${fetched} message(s)`)
      return { fetched }
    } finally {
      lock.release()
    }
  } finally {
    // Never leak the socket — a half-open connection would block the next poll.
    try { await client.logout() } catch { try { client.close() } catch { /* already gone */ } }
  }
}

async function collectChunks(stream: NodeJS.ReadableStream): Promise<Buffer[]> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  return chunks
}

function categorise(toEmail: string): string {
  if (toEmail.startsWith('support')) return 'Support'
  if (toEmail.startsWith('feedback')) return 'Feedback'
  return 'General'
}
