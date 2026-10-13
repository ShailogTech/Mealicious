import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.entryDate != null) data.entryDate = new Date(body.entryDate)
  if (body.voucherNo != null) data.voucherNo = String(body.voucherNo)
  if (body.description != null) data.description = String(body.description)
  if (body.debitAccount != null) data.debitAccount = String(body.debitAccount)
  if (body.creditAccount != null) data.creditAccount = String(body.creditAccount)
  if (body.amount != null) data.amount = Number(body.amount) || 0
  if (body.reference != null) data.reference = body.reference ? String(body.reference) : null
  if (body.createdBy != null) data.createdBy = body.createdBy ? String(body.createdBy) : null
  return NextResponse.json({ journalEntry: await db.erpJournalEntry.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const { id } = await params
  await db.erpJournalEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
