import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'supplychain')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.from != null) data.fromLocation = String(body.from)
  if (body.to != null) data.toLocation = String(body.to)
  if (body.vehicle != null) data.vehicle = String(body.vehicle)
  if (body.status != null) data.status = String(body.status)
  if (body.eta !== undefined) data.eta = body.eta ? new Date(body.eta) : null
  const updated = await db.erpShipment.update({ where: { id }, data })
  return NextResponse.json({ shipment: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'supplychain')
  if (error) return error
  const { id } = await params
  await db.erpShipment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
