import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'
import { computeWholesaleInvoice, type InvoiceLineInput } from '@/lib/administrator/invoice-math'

/**
 * Wholesale (B2B) invoices. Distinct from retail billing in three ways:
 *  1. Invoice number prefix "MVPL-WHOLESALE" (vs retail's company.invoicePrefix,
 *     default "MVPL-RETAIL-IN") — inter-state B2B bills use a different series.
 *  2. IGST (single line) instead of CGST/SGST split, with cgst=sgst=0.
 *  3. paymentMode stored as "Wholesale" so the finance views can segment them.
 *
 * Reuses the same ErpInvoice model + ErpSystemConfig.invoiceCounter pattern as
 * the retail invoices route. The wholesale-specific buyer fields (business name,
 * GSTIN, address, contact, delivery/payment terms) are persisted on the invoice
 * row (customerName/mobile/address/customerGst) and on the linked ErpCustomer.
 */

const WHOLESALE_PREFIX = 'MVPL-WHOLESALE'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'wholesale')
  if (error) return error
  const invoices = await db.erpInvoice.findMany({
    where: { paymentMode: 'Wholesale' },
    orderBy: { date: 'desc' },
    include: { customer: { select: { mobile: true } } },
  })
  return NextResponse.json({
    invoices: invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      date: i.date.toISOString().slice(0, 10),
      customerName: i.customerName,
      mobile: i.mobile ?? '',
      customerGst: i.customerGst ?? '',
      grandTotal: i.grandTotal,
      paymentMode: i.paymentMode,
    })),
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'wholesale')
  if (error) return error
  const body = await req.json()

  const buyerBusinessName = String(body.buyerBusinessName || body.customerName || '').trim()
  const mobile = body.buyerContact || body.mobile ? String(body.buyerContact || body.mobile).trim() : null
  const buyerGst = body.buyerGst || body.customerGst ? String(body.buyerGst || body.customerGst).trim() : null
  if (!buyerBusinessName) return NextResponse.json({ error: 'Buyer business name is required' }, { status: 400 })

  const lineInputs: InvoiceLineInput[] = Array.isArray(body.items) ? body.items.map((it: Record<string, unknown>) => ({
    name: String(it.name || ''),
    qty: Number(it.qty) || 0,
    price: Number(it.price) || 0,
    disc: Number(it.disc) || 0,
    gstPct: Number(it.gstPct) || 0,
  })) : []
  if (lineInputs.length === 0) return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })

  const overallDiscountPct = Number(body.overallDiscountPct) || 0
  const totals = computeWholesaleInvoice(lineInputs, overallDiscountPct)
  const invoiceDate = body.date ? new Date(body.date) : new Date()

  // Buyer address: prefer explicit wholesale field, fall back to generic address.
  const address = body.buyerAddress || body.address ? String(body.buyerAddress || body.address) : null

  // Payment terms (Credit / Due / Advance) — recorded in the address/notes for
  // the customer record, since ErpInvoice has no dedicated column. paymentMode
  // is fixed to "Wholesale" for finance segmentation + list filtering.
  const paymentTerms = body.paymentTerms ? String(body.paymentTerms) : null
  const deliveryTerms = body.deliveryTerms ? String(body.deliveryTerms) : null

  // Atomic: increment the invoice counter and build the wholesale number in the
  // same transaction so concurrent creates can't collide.
  const created = await db.$transaction(async (tx) => {
    const config = await tx.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
    if (!config) throw new Error('ERP system config missing')
    const next = config.invoiceCounter + 1
    const invoiceNumber = `${WHOLESALE_PREFIX}-${String(next)}`
    await tx.erpSystemConfig.update({ where: { id: 'singleton' }, data: { invoiceCounter: next } })

    // Customer upsert by mobile (mirrors retail). Segment the wholesale buyer.
    let customerId: string | null = null
    if (mobile) {
      const existing = await tx.erpCustomer.findUnique({ where: { mobile } })
      if (existing) {
        const updated = await tx.erpCustomer.update({
          where: { id: existing.id },
          data: {
            name: buyerBusinessName,
            address: address ?? existing.address,
            gst: buyerGst ?? existing.gst,
            segment: 'Wholesale',
            totalOrders: { increment: 1 },
            lifetimeValue: { increment: totals.grandTotal },
          },
        })
        customerId = updated.id
      } else {
        const created = await tx.erpCustomer.create({
          data: {
            name: buyerBusinessName,
            mobile,
            whatsapp: mobile,
            address: address ?? null,
            gst: buyerGst ?? null,
            segment: 'Wholesale',
            totalOrders: 1,
            lifetimeValue: totals.grandTotal,
          },
        })
        customerId = created.id
      }
    }

    // Encode delivery/payment terms into the address line so they survive on the
    // stored invoice (no dedicated column). The PDF + WhatsApp already carry
    // them from the form; this is the audit trail.
    const fullAddress = [
      address,
      deliveryTerms ? `Delivery: ${deliveryTerms}` : null,
      paymentTerms ? `Payment: ${paymentTerms}` : null,
    ].filter(Boolean).join('\n')

    const invoice = await tx.erpInvoice.create({
      data: {
        invoiceNumber,
        date: invoiceDate,
        customerName: buyerBusinessName,
        mobile,
        address: fullAddress || null,
        customerGst: buyerGst,
        items: JSON.parse(JSON.stringify(totals.lines)),
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        gstTotal: totals.gstTotal,
        cgst: totals.cgst, // 0 — inter-state IGST
        sgst: totals.sgst, // 0 — inter-state IGST
        grandTotal: totals.grandTotal,
        paymentMode: 'Wholesale',
        customerId,
      },
    })

    // Auto-create an Income transaction for this wholesale invoice.
    await tx.erpTransaction.create({
      data: {
        date: invoiceDate,
        type: 'Income',
        category: `Wholesale Invoice ${invoiceNumber}`,
        amount: totals.grandTotal,
        account: 'Axis Bank - Current',
        note: `${buyerBusinessName}${buyerGst ? ` · GSTIN ${buyerGst}` : ''}${paymentTerms ? ` · ${paymentTerms}` : ''}`,
      },
    })

    return invoice
  })

  return NextResponse.json({ invoice: created })
}
