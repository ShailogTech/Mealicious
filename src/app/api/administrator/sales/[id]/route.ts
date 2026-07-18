import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'sales')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.customer != null) data.customer = String(body.customer)
  if (body.product != null) data.product = String(body.product)
  if (body.qty != null) data.qty = Number(body.qty) || 0
  if (body.amount != null) data.amount = Number(body.amount) || 0
  if (body.channel != null) data.channel = String(body.channel)
  if (body.status != null) data.status = String(body.status)
  const updated = await db.erpSalesOrder.update({ where: { id }, data })
  return NextResponse.json({ sale: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'sales')
  if (error) return error
  const { id } = await params
  await db.erpSalesOrder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
