import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.section != null) data.section = String(body.section)
  if (body.itemName != null) data.itemName = String(body.itemName)
  if (body.amount != null) data.amount = Number(body.amount) || 0
  if (body.asOfYear != null) data.asOfYear = Number(body.asOfYear) || 2026
  if (body.asOfMonth != null) data.asOfMonth = Number(body.asOfMonth) || 3
  return NextResponse.json({ item: await db.erpBalanceSheetItem.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  await db.erpBalanceSheetItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
