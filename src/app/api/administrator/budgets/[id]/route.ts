import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.department != null) data.department = String(body.department)
  if (body.category != null) data.category = String(body.category)
  if (body.allocated != null) data.allocated = Number(body.allocated) || 0
  if (body.spent != null) data.spent = Number(body.spent) || 0
  if (body.financialYear != null) data.financialYear = String(body.financialYear)
  return NextResponse.json({ budget: await db.erpBudget.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  await db.erpBudget.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
