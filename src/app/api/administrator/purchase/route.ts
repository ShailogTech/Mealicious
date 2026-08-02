import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'purchase')
  if (error) return error
  const rows = await db.erpPurchaseOrder.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json({ purchaseOrders: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'purchase')
  if (error) return error
  const body = await req.json()
  const vendor = String(body.vendor || '').trim()
  if (!vendor) return NextResponse.json({ error: 'Vendor is required' }, { status: 400 })
  const created = await db.erpPurchaseOrder.create({
    data: {
      vendor,
      date: body.date ? new Date(body.date) : new Date(),
      amount: Number(body.amount) || 0,
      status: body.status || 'Pending Approval',
    },
  })

  // Auto-create a matching Expense entry (mirrors the invoice→income pattern).
  const poAmount = Number(body.amount) || 0
  if (poAmount > 0) {
    await db.erpTransaction.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        type: 'Expense',
        category: `Purchase Order: ${vendor}`,
        amount: poAmount,
        account: 'Axis Bank - Current',
        note: `PO auto-entry`,
      },
    })
  }

  return NextResponse.json({ purchaseOrder: created })
}
