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

/**
 * Wholesale (B2B) invoice totals — inter-state, so a single IGST line replaces
 * the CGST/SGST split. Supports an overall discount percentage applied to the
 * taxable base in addition to the per-line discounts. GST is recomputed on the
 * post-overall-discount base (per-line GST scaled proportionally), per standard
 * GST practice where invoice-level discounts reduce the taxable value.
 *
 * Stored on ErpInvoice with cgst=sgst=0 and gstTotal=igst so the existing model
 * carries the wholesale figures without a schema change.
 */
export interface WholesaleTotals {
  lines: InvoiceLine[]
  subtotal: number // sum of (qty*price) before any discount
  lineDiscountTotal: number // sum of per-line discount amounts
  overallDiscountAmount: number // overall discount amount
  discountTotal: number // line discounts + overall discount
  gstTotal: number // IGST (single line)
  igst: number // alias of gstTotal for clarity
  cgst: number // always 0 (inter-state)
  sgst: number // always 0 (inter-state)
  grandTotal: number
}

export function computeWholesaleInvoice(
  input: InvoiceLineInput[],
  overallDiscountPct = 0,
): WholesaleTotals {
  const lines: InvoiceLine[] = input.map((li, i) => {
    const gross = Number(li.qty) * Number(li.price)
    const discountAmount = gross * (Number(li.disc) || 0) / 100
    const taxable = round2(gross - discountAmount)
    const total = round2(taxable + taxable * (Number(li.gstPct) || 0) / 100)
    return { ...li, sno: i + 1, taxable, total }
  })
  const subtotal = round2(lines.reduce((s, l) => s + Number(l.qty) * Number(l.price), 0))
  const lineTaxable = round2(lines.reduce((s, l) => s + l.taxable, 0))
  const lineDiscountTotal = round2(subtotal - lineTaxable)
  const overallDiscountAmount = round2(lineTaxable * (Number(overallDiscountPct) || 0) / 100)
  const taxableAfterDiscount = round2(lineTaxable - overallDiscountAmount)
  // IGST on the discounted base: scale the raw per-line GST by the discount ratio.
  const rawGst = lines.reduce((s, l) => s + l.taxable * (Number(l.gstPct) || 0) / 100, 0)
  const scale = lineTaxable > 0 ? taxableAfterDiscount / lineTaxable : 0
  const igst = round2(rawGst * scale)
  return {
    lines,
    subtotal,
    lineDiscountTotal,
    overallDiscountAmount,
    discountTotal: round2(lineDiscountTotal + overallDiscountAmount),
    gstTotal: igst,
    igst,
    cgst: 0,
    sgst: 0,
    grandTotal: round2(taxableAfterDiscount + igst),
  }
}
