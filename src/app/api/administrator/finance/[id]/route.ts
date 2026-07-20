import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'finance')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.type) data.type = String(body.type)
  if (body.category != null) data.category = String(body.category)
  if (body.amount != null) data.amount = Number(body.amount)
  if (body.account != null) data.account = String(body.account)
  if (body.note != null) data.note = body.note ? String(body.note) : null
  if (body.date) data.date = new Date(body.date)
  const updated = await db.erpTransaction.update({ where: { id }, data })
  return NextResponse.json({ transaction: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'finance')
  if (error) return error
  const { id } = await params
  await db.erpTransaction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
