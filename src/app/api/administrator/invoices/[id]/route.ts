import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'
import { computeInvoice, type InvoiceLineInput } from '@/lib/administrator/invoice-math'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'invoices')
  if (error) return error
  const { id } = await params
  const invoice = await db.erpInvoice.findUnique({ where: { id } })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ invoice })
}

/**
 * Edit an invoice. Restricted to Super Admin or Finance (Admin) on top of the
 * module RBAC check. Before applying the update, the CURRENT invoice state is
 * snapshotted into ErpInvoiceRevision for the audit history.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireErpRole(req, 'invoices')
  if (error) return error
  if (user!.role !== 'SUPER_ADMIN' && user!.role !== 'FINANCE') {
    return NextResponse.json({ error: 'Only Super Admin or Finance can edit invoices' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()

  const existing = await db.erpInvoice.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.customerName != null && !String(body.customerName).trim()) {
    return NextResponse.json({ error: 'Customer name cannot be empty' }, { status: 400 })
  }

  // Snapshot the current state (dates ISO-normalized; Prisma Json rejects Date).
  await db.erpInvoiceRevision.create({
    data: {
      invoiceId: existing.id,
      invoiceNumber: existing.invoiceNumber,
      snapshot: JSON.parse(JSON.stringify({
        date: existing.date.toISOString(),
        customerName: existing.customerName,
        mobile: existing.mobile,
        address: existing.address,
        customerGst: existing.customerGst,
        items: existing.items,
        subtotal: existing.subtotal,
        discountTotal: existing.discountTotal,
        gstTotal: existing.gstTotal,
        cgst: existing.cgst,
        sgst: existing.sgst,
        grandTotal: existing.grandTotal,
        paymentMode: existing.paymentMode,
      })),
      editedBy: user!.displayName,
      editReason: body.editReason ? String(body.editReason) : null,
    },
  })

  // Apply only the fields present in the request body.
  const data: Record<string, unknown> = {}
  if (body.customerName != null) data.customerName = String(body.customerName).trim()
  if (body.mobile != null) data.mobile = body.mobile ? String(body.mobile).trim() : null
  if (body.address != null) data.address = body.address ? String(body.address) : null
  if (body.customerGst != null) data.customerGst = body.customerGst ? String(body.customerGst) : null
  if (body.paymentMode != null) data.paymentMode = String(body.paymentMode)
  if (body.date != null) data.date = new Date(body.date)
  if (Array.isArray(body.items) && body.items.length > 0) {
    const lineInputs: InvoiceLineInput[] = body.items.map((it: Record<string, unknown>) => ({
      name: String(it.name || ''),
      qty: Number(it.qty) || 0,
      price: Number(it.price) || 0,
      disc: Number(it.disc) || 0,
      gstPct: Number(it.gstPct) || 0,
    }))
    const totals = computeInvoice(lineInputs)
    data.items = JSON.parse(JSON.stringify(totals.lines))
    data.subtotal = totals.subtotal
    data.discountTotal = totals.discountTotal
    data.gstTotal = totals.gstTotal
    data.cgst = totals.cgst
    data.sgst = totals.sgst
    data.grandTotal = totals.grandTotal
  }

  const invoice = await db.erpInvoice.update({ where: { id }, data })
  return NextResponse.json({ invoice })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'invoices')
  if (error) return error
  const { id } = await params
  await db.erpInvoice.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
