export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { redirect } from 'next/navigation'
import { TicketsClient } from './TicketsClient'

async function getData(userId: string) {
  const tickets = await db.erpTicket.findMany({ orderBy: { createdAt: 'desc' } })
  const mine = tickets.filter((t) => t.fromUserId === userId)
  const others = tickets.filter((t) => t.fromUserId !== userId)
  const mapTicket = (t: typeof tickets[number]) => ({
    id: t.id,
    subject: t.subject,
    body: t.body,
    category: t.category,
    priority: t.priority,
    status: t.status,
    fromName: t.fromName,
    fromDept: t.fromDept ?? '',
    assignedDept: t.assignedDept ?? '',
    comments: t.comments as { fromName: string; body: string; date: string }[],
    date: t.createdAt.toISOString(),
  })
  return { mine: mine.map(mapTicket), others: others.map(mapTicket) }
}

export default async function TicketsPage() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  const { mine, others } = await getData(user.id)
  return <TicketsClient mine={mine} others={others} />
}
