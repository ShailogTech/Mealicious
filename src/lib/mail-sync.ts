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
    let fetched = 0
    let error: string | undefined
    const client = new ImapFlow({
      host: process.env.IMAP_HOST || 'mail.mealicious.store',
      port: Number(process.env.IMAP_PORT || 993),
      secure: true,
      auth: { user: mb.email, pass: mb.password },
      logger: false,
    })

    try {
      await client.connect()
      const lock = await client.getMailboxLock('INBOX')
      try {
        // Fetch unseen messages, newest first.
        const messages: FetchedMail[] = []
        for await (const msg of client.fetch({ seen: false }, { envelope: true, bodyStructure: true, uid: true })) {
          const env = msg.envelope
          const to = env?.to?.[0]?.address || mb.email
          const from = env?.from?.[0]?.address || ''
          const fromName = env?.from?.[0]?.name || from
          const bodyRaw = await client.download(msg.uid, undefined, { uid: true })
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
          await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen'], { uid: true })
        }

        // Dedup + insert.
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
      } finally {
        lock.release()
      }
      await client.logout()
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }

    results.push({ mailbox: mb.email, fetched, error })
  }

  return results
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
