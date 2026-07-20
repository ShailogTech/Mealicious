import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'teams')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.dept != null) data.dept = String(body.dept)
  if (body.teamLeadId !== undefined) data.teamLeadId = body.teamLeadId || null
  if (body.managerId !== undefined) data.managerId = body.managerId || null
  const updated = await db.erpTeam.update({ where: { id }, data })
  return NextResponse.json({ team: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'teams')
  if (error) return error
  const { id } = await params
  await db.erpTeam.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
