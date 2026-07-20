import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'manufacturing')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.product != null) data.product = String(body.product)
  if (body.qty != null) data.qty = Number(body.qty) || 0
  if (body.machine != null) data.machine = String(body.machine)
  if (body.status != null) data.status = String(body.status)
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
  const updated = await db.erpProductionOrder.update({ where: { id }, data })
  return NextResponse.json({ productionOrder: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'manufacturing')
  if (error) return error
  const { id } = await params
  await db.erpProductionOrder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
