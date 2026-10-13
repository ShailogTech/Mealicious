import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Inbound email webhook — receives incoming mail for the company mailboxes
 * (support@ / contact@ / feedback@mealicious.store) and stores it in the
 * ERP Mail Inbox.
 *
 * Setup (requires domain access — cannot be done from the app):
 *   1. Point the company mailboxes at an inbound provider, e.g.
 *      • Resend Inbound: add mealicious.store, set catch-all forwarding
 *        webhook to this endpoint, or
 *      • Cloudflare Email Routing: catch-all → worker → POST here.
 *   2. Set INBOUND_WEBHOOK_SECRET in the environment; the provider must
 *      send it as the `x-inbound-secret` header.
 *   3. Emails sent to any @mealicious.store address will then appear in
 *      /administrator/mail-inbox.
 *
 * Accepted payload (generic JSON — map your provider if it differs):
 *   { to, from, fromName?, subject, text, headers? }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INBOUND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Inbound mail not configured (set INBOUND_WEBHOOK_SECRET)' }, { status: 503 })
  }
  if (req.headers.get('x-inbound-secret') !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  // Resolve the receiving mailbox. Providers vary: `to` may be a string or
  // an array of {address} objects (Resend style).
  const rawTo = Array.isArray(body.to) ? body.to[0] : body.to
  const toEmail = String(
    typeof rawTo === 'object' && rawTo !== null ? (rawTo.address ?? rawTo.email ?? '') : rawTo ?? '',
  )
    .toLowerCase()
    .trim()
  const fromEmail = String(
    typeof body.from === 'object' && body.from !== null ? (body.from.address ?? body.from.email ?? '') : body.from ?? '',
  ).trim()
  const fromName = String(
    typeof body.from === 'object' && body.from !== null ? (body.from.name ?? fromEmail) : fromEmail,
  )
  const subject = String(body.subject || '(no subject)').trim()
  const text = String(body.text || body.body || body.html || '').trim()

  // Only accept mail addressed to our company domain.
  if (!toEmail.endsWith('@mealicious.store')) {
    return NextResponse.json({ error: 'Not addressed to a company mailbox' }, { status: 400 })
  }

  // Categorise by mailbox.
  let category = 'General'
  if (toEmail.startsWith('support')) category = 'Support'
  else if (toEmail.startsWith('contact')) category = 'General'
  else if (toEmail.startsWith('feedback')) category = 'Feedback'

  const created = await db.erpMailInbox.create({
    data: {
      toEmail,
      fromEmail,
      fromName,
      subject,
      body: text,
      category,
      isRead: false,
    },
  })
  return NextResponse.json({ ok: true, id: created.id })
}
