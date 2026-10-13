import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  return NextResponse.json({ journalEntries: await db.erpJournalEntry.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const body = await req.json()
  const voucherNo = String(body.voucherNo || '').trim()
  const description = String(body.description || '').trim()
  if (!voucherNo) return NextResponse.json({ error: 'Voucher number is required' }, { status: 400 })
  if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  const created = await db.erpJournalEntry.create({
    data: {
      voucherNo,
      description,
      debitAccount: String(body.debitAccount || ''),
      creditAccount: String(body.creditAccount || ''),
      amount: Number(body.amount) || 0,
      entryDate: body.entryDate ? new Date(body.entryDate) : undefined,
      reference: body.reference ? String(body.reference) : null,
      createdBy: body.createdBy ? String(body.createdBy) : null,
    },
  })
  return NextResponse.json({ journalEntry: created })
}
