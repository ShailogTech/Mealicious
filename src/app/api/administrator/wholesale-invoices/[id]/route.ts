import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

/**
 * Single wholesale-invoice fetch + delete. Mirrors the retail invoices [id]
 * route but is gated by the 'wholesale' module key and scoped to wholesale
 * invoices (paymentMode = "Wholesale") so a mis-typed id can't reach across
 * into retail billing data.
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'wholesale')
  if (error) return error
  const { id } = await params
  const invoice = await db.erpInvoice.findUnique({ where: { id } })
  if (!invoice || invoice.paymentMode !== 'Wholesale') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ invoice })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'wholesale')
  if (error) return error
  const { id } = await params
  const invoice = await db.erpInvoice.findUnique({ where: { id } })
  if (!invoice || invoice.paymentMode !== 'Wholesale') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await db.erpInvoice.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
