import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.type != null) data.type = String(body.type)
  if (body.partyName != null) data.partyName = String(body.partyName)
  if (body.invoiceRef != null) data.invoiceRef = body.invoiceRef ? String(body.invoiceRef) : null
  if (body.amount != null) data.amount = Number(body.amount) || 0
  if (body.paidAmount != null) data.paidAmount = Number(body.paidAmount) || 0
  if (body.balance != null) data.balance = Number(body.balance) || 0
  if (body.dueDate != null) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.status != null) data.status = String(body.status)
  if (body.notes != null) data.notes = body.notes ? String(body.notes) : null
  return NextResponse.json({ accountEntry: await db.erpAccountEntry.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  await db.erpAccountEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
