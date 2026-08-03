import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.description != null) data.description = body.description ? String(body.description) : null
  if (body.criteria != null) data.criteria = body.criteria
  if (body.customerCount != null) data.customerCount = Number(body.customerCount) || 0
  return NextResponse.json({ customerSegment: await db.erpCustomerSegment.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  await db.erpCustomerSegment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
