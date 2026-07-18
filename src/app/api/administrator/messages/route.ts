import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

/** A message is visible to the session user if they're the sender, the
 *  recipient, OR it's an HR_TEAM broadcast (toUserId null) and the user is
 *  HR/SuperAdmin. Ported from the ERP's canSeeMessage(). */
function canSeeMessage(userId: string, role: string, msg: { fromUserId: string; toUserId: string | null }) {
  if (msg.fromUserId === userId) return true
  if (msg.toUserId === userId) return true
  if (msg.toUserId === null && (role === 'HR' || role === 'SUPER_ADMIN')) return true
  return false
}

export async function GET(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'messages')
  if (error) return error
  const userId = user!.id
  const role = user!.role

  const [allMessages, announcements] = await Promise.all([
    db.erpMessage.findMany({ orderBy: { createdAt: 'desc' } }),
    db.erpAnnouncement.findMany({ orderBy: { createdAt: 'desc' } }),
  ])

  const visible = allMessages.filter((m) => canSeeMessage(userId, role, m))
  const inbox = visible.filter((m) => m.fromUserId !== userId)
  const sent = visible.filter((m) => m.fromUserId === userId)

  const mapMsg = (m: typeof allMessages[number]) => ({
    id: m.id,
    fromName: m.fromName,
    toName: m.toName,
    subject: m.subject,
    body: m.body,
    status: m.status,
    replies: m.replies as { fromName: string; body: string; date: string }[],
    date: m.createdAt.toISOString(),
  })

  return NextResponse.json({
    inbox: inbox.map(mapMsg),
    sent: sent.map(mapMsg),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      audience: a.audience,
      fromName: a.fromName,
      date: a.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'messages')
  if (error) return error
  const body = await req.json()
  const subject = String(body.subject || '').trim()
  const messageBody = String(body.body || '').trim()
  if (!subject || !messageBody) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }
  const toUserId = body.toUserId ? String(body.toUserId) : null
  const toUser = toUserId ? await db.adminUser.findUnique({ where: { id: toUserId } }) : null
  const created = await db.erpMessage.create({
    data: {
      fromUserId: user!.id,
      fromName: user!.displayName,
      toUserId,
      toName: toUser?.displayName ?? 'HR Team',
      subject,
      body: messageBody,
    },
  })
  return NextResponse.json({ message: created })
}

// Mark all inbox messages for the session user as read.
export async function PATCH(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'messages')
  if (error) return error
  await db.erpMessage.updateMany({
    where: { toUserId: user!.id, status: 'Unread' },
    data: { status: 'Read' },
  })
  return NextResponse.json({ ok: true })
}
