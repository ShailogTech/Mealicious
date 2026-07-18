import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'groups')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.description != null) data.description = body.description ? String(body.description) : null
  if (body.ownerName != null) data.ownerName = body.ownerName ? String(body.ownerName) : null
  if (body.memberIds !== undefined) data.memberIds = Array.isArray(body.memberIds) ? body.memberIds : []
  const updated = await db.erpGroup.update({ where: { id }, data })
  return NextResponse.json({ group: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'groups')
  if (error) return error
  const { id } = await params
  await db.erpGroup.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
