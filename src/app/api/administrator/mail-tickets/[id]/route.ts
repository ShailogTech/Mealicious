import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

const VALID_STATUS = ['Open', 'In Progress', 'Resolved', 'Closed']
const VALID_PRIORITY = ['Low', 'Normal', 'High', 'Critical']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireErpRole(req, 'mailtickets')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.status != null) {
    if (!VALID_STATUS.includes(String(body.status))) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = String(body.status)
  }
  if (body.priority != null) {
    if (!VALID_PRIORITY.includes(String(body.priority))) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }
    data.priority = String(body.priority)
    // Escalation to Critical adds a comment (matches ERP behavior).
    if (String(body.priority) === 'Critical') {
      const ticket = await db.erpTicket.findUnique({ where: { id } })
      const comments = Array.isArray(ticket?.comments) ? ticket!.comments : []
      comments.push({ fromName: user!.displayName, body: 'This ticket has been escalated and marked Critical priority.', date: new Date().toISOString() })
      data.comments = comments
    }
  }
  if (body.assignedDept != null) data.assignedDept = body.assignedDept ? String(body.assignedDept) : null

  const updated = await db.erpTicket.update({ where: { id }, data })
  return NextResponse.json({ ticket: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'mailtickets')
  if (error) return error
  const { id } = await params
  await db.erpTicket.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
