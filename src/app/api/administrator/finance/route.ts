import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'finance')
  if (error) return error
  const rows = await db.erpTransaction.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json({ transactions: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'finance')
  if (error) return error
  const body = await req.json()
  const type = String(body.type || '')
  const category = String(body.category || '').trim()
  const amount = Number(body.amount)
  const account = String(body.account || '')
  if (!['Income', 'Expense'].includes(type) || !category || !Number.isFinite(amount) || amount <= 0 || !account) {
    return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
  }
  const created = await db.erpTransaction.create({
    data: {
      type,
      category,
      amount,
      account,
      note: body.note ? String(body.note) : null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  })
  return NextResponse.json({ transaction: created })
}
