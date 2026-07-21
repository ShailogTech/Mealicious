import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.code != null) data.code = String(body.code).trim().toUpperCase()
  if (body.type != null) data.type = String(body.type)
  if (body.value != null) data.value = Number(body.value) || 0
  if (body.minOrder != null) data.minOrder = Number(body.minOrder) || 0
  if (body.maxDiscount !== undefined) data.maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : null
  if (body.isActive != null) data.isActive = !!body.isActive
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null
  const updated = await db.discount.update({ where: { id }, data })
  return NextResponse.json({ discount: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  await db.discount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
