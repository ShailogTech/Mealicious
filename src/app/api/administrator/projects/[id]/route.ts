import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'projects')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.owner != null) data.owner = String(body.owner)
  if (body.dept != null) data.dept = String(body.dept)
  if (body.progress != null) data.progress = Math.max(0, Math.min(100, Number(body.progress) || 0))
  if (body.status != null) data.status = String(body.status)
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  const updated = await db.erpProject.update({ where: { id }, data })
  return NextResponse.json({ project: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'projects')
  if (error) return error
  const { id } = await params
  await db.erpProject.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
