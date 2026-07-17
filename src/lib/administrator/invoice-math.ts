/**
 * Invoice/GST math — shared by the billing form (client) and the invoice
 * create route (server). Both sides must agree, so the pure computation lives
 * here and is imported by both.
 *
 * Ported from the static ERP's billing totals logic. Each line item:
 *   taxable = qty * price - (qty * price * disc/100)
 *   gst     = taxable * gstPct/100
 *   total   = taxable + gst
 * CGST/SGST split the GST equally.
 */

export interface InvoiceLineInput {
  name: string
  qty: number
  price: number
  disc: number // percent
  gstPct: number
}

export interface InvoiceLine extends InvoiceLineInput {
  sno: number
  taxable: number
  total: number
}

export interface InvoiceTotals {
  lines: InvoiceLine[]
  subtotal: number // sum of (qty*price) before discount
  discountTotal: number // sum of discount amounts
  gstTotal: number
  cgst: number
  sgst: number
  grandTotal: number
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function computeInvoice(input: InvoiceLineInput[]): InvoiceTotals {
  const lines: InvoiceLine[] = input.map((li, i) => {
    const gross = Number(li.qty) * Number(li.price)
    const discountAmount = gross * (Number(li.disc) || 0) / 100
    const taxable = round2(gross - discountAmount)
    const total = round2(taxable + taxable * (Number(li.gstPct) || 0) / 100)
    return { ...li, sno: i + 1, taxable, total }
  })
  const subtotal = round2(lines.reduce((s, l) => s + Number(l.qty) * Number(l.price), 0))
  const lineGross = lines.reduce((s, l) => s + Number(l.qty) * Number(l.price), 0)
  const lineTaxable = lines.reduce((s, l) => s + l.taxable, 0)
  const discountTotal = round2(lineGross - lineTaxable)
  const gstTotal = round2(lines.reduce((s, l) => s + l.taxable * (Number(l.gstPct) || 0) / 100, 0))
  return {
    lines,
    subtotal,
    discountTotal,
    gstTotal,
    cgst: round2(gstTotal / 2),
    sgst: round2(gstTotal / 2),
    grandTotal: round2(lineTaxable + gstTotal),
  }
}
