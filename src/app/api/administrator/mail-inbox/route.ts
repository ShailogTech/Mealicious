import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

const CATEGORIES = ['General', 'Support', 'Feedback', 'Sales']

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'mailinbox')
  if (error) return error
  const { searchParams } = new URL(req.url)
  const toEmail = searchParams.get('toEmail')
  const mails = await db.erpMailInbox.findMany({
    where: toEmail ? { toEmail } : undefined,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ mails })
}

/**
 * Compose/send: records an outbound message. In this ERP build the company
 * SMTP relay is not wired, so the message is stored against the sender's
 * mailbox (toEmail) exactly as delivered — it shows in Sent-style history
 * until a real transport is connected.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpRole(req, 'mailinbox')
  if (error) return error
  const body = await req.json()
  const toEmail = String(body.toEmail || '').trim()
  const subject = String(body.subject || '').trim()
  const bodyText = String(body.body || '').trim()
  const category = String(body.category || 'General')
  if (!toEmail) return NextResponse.json({ error: 'To address is required' }, { status: 400 })
  if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  if (!bodyText) return NextResponse.json({ error: 'Message body is required' }, { status: 400 })

  const created = await db.erpMailInbox.create({
    data: {
      toEmail,
      fromEmail: user?.email ?? 'erp@mealicious.store',
      fromName: user?.displayName ?? 'ERP User',
      subject,
      body: bodyText,
      category: CATEGORIES.includes(category) ? category : 'General',
      isRead: true,
    },
  })
  return NextResponse.json({ mail: created })
}
