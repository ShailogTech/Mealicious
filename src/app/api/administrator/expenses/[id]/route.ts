import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'expenses')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.category != null) data.category = String(body.category)
  if (body.description != null) data.description = String(body.description)
  if (body.amount != null) data.amount = Number(body.amount)
  if (body.vendor != null) data.vendor = body.vendor ? String(body.vendor) : null
  if (body.paymentMode != null) data.paymentMode = String(body.paymentMode)
  if (body.status != null) data.status = String(body.status)
  if (body.date !== undefined) data.date = body.date ? new Date(body.date) : new Date()
  return NextResponse.json({ expense: await db.erpExpense.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'expenses')
  if (error) return error
  const { id } = await params
  await db.erpExpense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
