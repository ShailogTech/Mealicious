import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  return NextResponse.json({ accountEntries: await db.erpAccountEntry.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const body = await req.json()
  const type = String(body.type || '').trim()
  const partyName = String(body.partyName || '').trim()
  if (!type) return NextResponse.json({ error: 'Type is required' }, { status: 400 })
  if (!partyName) return NextResponse.json({ error: 'Party name is required' }, { status: 400 })
  const created = await db.erpAccountEntry.create({
    data: {
      type,
      partyName,
      invoiceRef: body.invoiceRef ? String(body.invoiceRef) : null,
      amount: Number(body.amount) || 0,
      paidAmount: Number(body.paidAmount) || 0,
      balance: Number(body.balance) || 0,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status || 'Open',
      notes: body.notes ? String(body.notes) : null,
    },
  })
  return NextResponse.json({ accountEntry: created })
}
