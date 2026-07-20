export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { redirect } from 'next/navigation'
import { MessagesClient } from './MessagesClient'

async function getData(userId: string, role: string) {
  const [allMessages, announcements, users] = await Promise.all([
    db.erpMessage.findMany({ orderBy: { createdAt: 'desc' } }),
    db.erpAnnouncement.findMany({ orderBy: { createdAt: 'desc' } }),
    db.adminUser.findMany({ where: { isActive: true }, select: { id: true, displayName: true, role: true } }),
  ])

  function canSee(m: { fromUserId: string; toUserId: string | null }) {
    if (m.fromUserId === userId) return true
    if (m.toUserId === userId) return true
    if (m.toUserId === null && (role === 'HR' || role === 'SUPER_ADMIN')) return true
    return false
  }
  const visible = allMessages.filter(canSee)
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

  return {
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
    users: users.map((u) => ({ id: u.id, displayName: u.displayName })),
    canBroadcast: role === 'HR' || role === 'SUPER_ADMIN',
  }
}

export default async function MessagesPage() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  const data = await getData(user.id, user.role)
  return <MessagesClient {...data} />
}
