import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'shifts')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.start != null) data.start = String(body.start)
  if (body.end != null) data.end = String(body.end)
  if (body.type != null) data.type = String(body.type)
  const updated = await db.erpShift.update({ where: { id }, data })
  return NextResponse.json({ shift: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'shifts')
  if (error) return error
  const { id } = await params
  await db.erpShift.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
