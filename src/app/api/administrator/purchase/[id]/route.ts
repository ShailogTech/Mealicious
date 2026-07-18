import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'purchase')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.vendor != null) data.vendor = String(body.vendor)
  if (body.amount != null) data.amount = Number(body.amount) || 0
  if (body.status != null) data.status = String(body.status)
  if (body.date) data.date = new Date(body.date)
  const updated = await db.erpPurchaseOrder.update({ where: { id }, data })
  return NextResponse.json({ purchaseOrder: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'purchase')
  if (error) return error
  const { id } = await params
  await db.erpPurchaseOrder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
