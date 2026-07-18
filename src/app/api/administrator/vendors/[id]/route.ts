import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'vendors')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.type != null) data.type = String(body.type)
  if (body.city != null) data.city = String(body.city)
  if (body.rating != null) data.rating = Number(body.rating) || 0
  if (body.status != null) data.status = String(body.status)
  if (body.outstanding != null) data.outstanding = Number(body.outstanding) || 0
  const updated = await db.erpVendor.update({ where: { id }, data })
  return NextResponse.json({ vendor: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'vendors')
  if (error) return error
  const { id } = await params
  await db.erpVendor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
