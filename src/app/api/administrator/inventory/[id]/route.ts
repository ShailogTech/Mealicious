import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'inventory')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.category != null) data.category = String(body.category)
  if (body.hsn != null) data.hsn = body.hsn ? String(body.hsn) : null
  if (body.sku != null) data.sku = body.sku ? String(body.sku) : null
  if (body.stock != null) data.stock = Number(body.stock) || 0
  if (body.reorderLevel != null) data.reorderLevel = Number(body.reorderLevel) || 0
  if (body.price != null) data.price = Number(body.price) || 0
  if (body.gstPct != null) data.gstPct = Number(body.gstPct) || 0
  const updated = await db.erpInventoryItem.update({ where: { id }, data })
  return NextResponse.json({ item: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'inventory')
  if (error) return error
  const { id } = await params
  await db.erpInventoryItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
