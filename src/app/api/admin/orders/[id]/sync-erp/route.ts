import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-server'
import { createErpInvoiceFromOrder } from '@/lib/erp-sync'

/**
 * Manually sync a store order into an ERP invoice. Admin-gated.
 * Idempotent: if the order already has erpInvoiceNumber, returns it without
 * creating a duplicate.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  try {
    const invoiceNumber = await createErpInvoiceFromOrder(id)
    if (!invoiceNumber) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, erpInvoiceNumber: invoiceNumber })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
