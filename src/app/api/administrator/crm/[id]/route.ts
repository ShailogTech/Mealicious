import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'crm')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.company != null) data.company = String(body.company)
  if (body.stage != null) data.stage = String(body.stage)
  if (body.value != null) data.value = Number(body.value) || 0
  if (body.owner != null) data.owner = String(body.owner)
  const updated = await db.erpLead.update({ where: { id }, data })
  return NextResponse.json({ lead: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'crm')
  if (error) return error
  const { id } = await params
  await db.erpLead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
