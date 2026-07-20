import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'
import { computeInvoice, type InvoiceLineInput } from '@/lib/administrator/invoice-math'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'invoices')
  if (error) return error
  const invoices = await db.erpInvoice.findMany({
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
      grandTotal: i.grandTotal,
      paymentMode: i.paymentMode,
    })),
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'billing')
  if (error) return error
  const body = await req.json()

  const customerName = String(body.customerName || '').trim()
  const mobile = body.mobile ? String(body.mobile).trim() : null
  if (!customerName) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })

  const lineInputs: InvoiceLineInput[] = Array.isArray(body.items) ? body.items.map((it: Record<string, unknown>) => ({
    name: String(it.name || ''),
    qty: Number(it.qty) || 0,
    price: Number(it.price) || 0,
    disc: Number(it.disc) || 0,
    gstPct: Number(it.gstPct) || 0,
  })) : []
  if (lineInputs.length === 0) return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })

  const totals = computeInvoice(lineInputs)
  const paymentMode = body.paymentMode ? String(body.paymentMode) : 'Cash'
  const invoiceDate = body.date ? new Date(body.date) : new Date()

  // Atomic: increment the invoice counter and build the number in the same
  // transaction so concurrent creates can't collide.
  const created = await db.$transaction(async (tx) => {
    const config = await tx.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
    if (!config) throw new Error('ERP system config missing')
    const company = config.company as { invoicePrefix?: string }
    const next = config.invoiceCounter + 1
    const invoiceNumber = `${company.invoicePrefix ?? 'INV'}-${String(next)}`
    await tx.erpSystemConfig.update({ where: { id: 'singleton' }, data: { invoiceCounter: next } })

    // Customer upsert by mobile (mirrors ERP). If no mobile, skip the customer link.
    let customerId: string | null = null
    if (mobile) {
      const existing = await tx.erpCustomer.findUnique({ where: { mobile } })
      if (existing) {
        const updated = await tx.erpCustomer.update({
          where: { id: existing.id },
          data: {
            name: customerName,
            address: body.address ? String(body.address) : existing.address,
            gst: body.customerGst ? String(body.customerGst) : existing.gst,
            totalOrders: { increment: 1 },
            lifetimeValue: { increment: totals.grandTotal },
          },
        })
        customerId = updated.id
      } else {
        const created = await tx.erpCustomer.create({
          data: {
            name: customerName,
            mobile,
            whatsapp: mobile,
            address: body.address ? String(body.address) : null,
            gst: body.customerGst ? String(body.customerGst) : null,
            totalOrders: 1,
            lifetimeValue: totals.grandTotal,
          },
        })
        customerId = created.id
      }
    }

    const invoice = await tx.erpInvoice.create({
      data: {
        invoiceNumber,
        date: invoiceDate,
        customerName,
        mobile,
        address: body.address ? String(body.address) : null,
        customerGst: body.customerGst ? String(body.customerGst) : null,
        items: JSON.parse(JSON.stringify(totals.lines)),
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        gstTotal: totals.gstTotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        grandTotal: totals.grandTotal,
        paymentMode,
        customerId,
      },
    })

    // Auto-create an Income transaction for this invoice.
    await tx.erpTransaction.create({
      data: {
        date: invoiceDate,
        type: 'Income',
        category: `Invoice ${invoiceNumber}`,
        amount: totals.grandTotal,
        account: 'Axis Bank - Current',
        note: customerName,
      },
    })

    return invoice
  })

  return NextResponse.json({ invoice: created })
}
