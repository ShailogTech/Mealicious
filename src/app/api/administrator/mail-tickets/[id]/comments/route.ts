import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireErpRole(req, 'mailtickets')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const text = String(body.body || '').trim()
  if (!text) return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })

  const ticket = await db.erpTicket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const comments = Array.isArray(ticket.comments) ? ticket.comments : []
  comments.push({ fromName: user!.displayName, body: text, date: new Date().toISOString() })
  const updated = await db.erpTicket.update({ where: { id }, data: { comments } })
  return NextResponse.json({ ticket: updated })
}
