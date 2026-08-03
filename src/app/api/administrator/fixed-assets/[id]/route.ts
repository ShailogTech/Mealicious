import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.category != null) data.category = String(body.category)
  if (body.purchaseDate != null) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null
  if (body.purchaseValue != null) data.purchaseValue = Number(body.purchaseValue) || 0
  if (body.currentValue != null) data.currentValue = Number(body.currentValue) || 0
  if (body.depreciationRate != null) data.depreciationRate = Number(body.depreciationRate) || 0
  if (body.location != null) data.location = body.location ? String(body.location) : null
  if (body.status != null) data.status = String(body.status)
  return NextResponse.json({ fixedAsset: await db.erpFixedAsset.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  await db.erpFixedAsset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
