import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'mailtickets')
  if (error) return error
  const tickets = await db.erpTicket.findMany({ orderBy: { createdAt: 'desc' } })
  // "Mine" = opened by this user; "For my dept" = others' tickets this user can handle.
  const mine = tickets.filter((t) => t.fromUserId === user!.id)
  const others = tickets.filter((t) => t.fromUserId !== user!.id)
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
  return NextResponse.json({ mine: mine.map(mapTicket), others: others.map(mapTicket) })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'mailtickets')
  if (error) return error
  const body = await req.json()
  const subject = String(body.subject || '').trim()
  const ticketBody = String(body.body || '').trim()
  const category = String(body.category || 'General').trim()
  if (!subject || !ticketBody) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }
  const linkedEmployee = await db.erpEmployee.findUnique({ where: { adminUserId: user!.id } })
  const created = await db.erpTicket.create({
    data: {
      subject,
      body: ticketBody,
      category,
      priority: body.priority ? String(body.priority) : 'Normal',
      fromUserId: user!.id,
      fromName: user!.displayName,
      fromDept: linkedEmployee?.dept ?? null,
      assignedDept: body.assignedDept ? String(body.assignedDept) : null,
    },
  })
  return NextResponse.json({ ticket: created })
}
