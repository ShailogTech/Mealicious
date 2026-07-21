import { db } from './db'

/**
 * Pricing engine.
 *
 * Two responsibilities:
 *  1. Resolve cart line items from the DB (priceCartFromDb).
 *  2. Compute totals including coupon + prepaid discounts and the GST
 *     breakdown (computeTotals).
 *
 * Discounts are admin-managed (Discount table). The COUPON_CODES map below is
 * a FALLBACK used only if the DB read fails (e.g. during the very first
 * deploy before seed runs) — never the source of truth once seeded.
 *
 * GST: product prices are GST-INCLUSIVE. The breakdown (taxable / CGST / SGST)
 * is derived from the inclusive unit price + the product's gstPct slab at
 * display time; the customer pays the inclusive price regardless.
 */

// --- Fallback coupon definitions (mirror the seed; used only on DB failure) ---
export interface FallbackCouponDef {
  discount: number
  type: 'percent' | 'flat'
  minOrder: number
  maxDiscount?: number
}
export const COUPON_CODES: Record<string, FallbackCouponDef> = {
  MEAL10: { discount: 10, type: 'percent', minOrder: 499 },
  SNACK20: { discount: 20, type: 'percent', minOrder: 999 },
  FLAT50: { discount: 50, type: 'flat', minOrder: 599 },
  WELCOME: { discount: 15, type: 'percent', minOrder: 399 },
  IBUU50: { discount: 49, type: 'flat', minOrder: 0 },
}
const FALLBACK_PREPAID_PERCENT = 10
const FREE_SHIPPING_THRESHOLD = 499
const SHIPPING_FEE = 49

export interface PricingItemInput {
  productId: string
  quantity: number
  variant?: string | null
}

export interface PricedItem {
  productId: string
  name: string
  image: string
  price: number
  salePrice: number | null
  unitPrice: number // inclusive of GST
  quantity: number
  variant: string | null
  lineSubtotal: number // inclusive of GST
  gstPct: number
  // GST breakdown for this line (derived from inclusive price). All zero when
  // gstPct is 0.
  taxable: number
  gstAmount: number
  cgst: number
  sgst: number
}

export interface Totals {
  items: PricedItem[]
  subtotal: number // inclusive of GST
  discount: number
  appliedCoupon: string | null
  couponError: string | null
  shipping: number
  codFee: number
  // GST breakdown (sum of per-line). Inclusive — not added on top of subtotal.
  gstTotal: number
  cgst: number
  sgst: number
  taxableTotal: number
  total: number
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Compute the GST breakdown for an inclusive unit price. Returns 0s if gstPct <= 0. */
function inclusiveGstBreakdown(inclusiveUnit: number, gstPct: number, qty: number) {
  if (!gstPct || gstPct <= 0) {
    return { taxable: round2(inclusiveUnit * qty), gstAmount: 0, cgst: 0, sgst: 0 }
  }
  const lineInclusive = inclusiveUnit * qty
  const divisor = 1 + gstPct / 100
  const taxable = round2(lineInclusive / divisor)
  const gstAmount = round2(lineInclusive - taxable)
  return { taxable, gstAmount, cgst: round2(gstAmount / 2), sgst: round2(gstAmount / 2) }
}

export async function priceCartFromDb(input: PricingItemInput[]): Promise<PricedItem[]> {
  if (!Array.isArray(input) || input.length === 0) return []
  const ids = [...new Set(input.map((i) => String(i.productId)).filter(Boolean))]
  if (ids.length === 0) throw new Error('items: missing productId')
  const rows = await db.product.findMany({
    where: { id: { in: ids }, isActive: true },
  })
  const byId = new Map(rows.map((r) => [r.id, r]))
  const out: PricedItem[] = []
  for (const it of input) {
    const p = byId.get(String(it.productId))
    if (!p) throw new Error(`Unknown or inactive productId: ${it.productId}`)
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 0))
    if (qty < 1) throw new Error(`Invalid quantity for ${p.name}`)
    const unit = p.salePrice ?? p.price
    let firstImage = ''
    try {
      const parsed = JSON.parse(p.images)
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') firstImage = parsed[0]
    } catch {}
    const gst = p.gstPct ?? 0
    const breakdown = inclusiveGstBreakdown(unit, gst, qty)
    out.push({
      productId: p.id,
      name: p.name,
      image: firstImage,
      price: p.price,
      salePrice: p.salePrice,
      unitPrice: unit,
      quantity: qty,
      variant: it.variant ?? null,
      lineSubtotal: unit * qty,
      gstPct: gst,
      ...breakdown,
    })
  }
  return out
}

/** Load active discounts from DB; fall back to in-memory map on failure. */
async function loadDiscounts() {
  try {
    const rows = await db.discount.findMany({ where: { isActive: true } })
    return {
      coupons: rows.filter((d) => d.type === 'percent' || d.type === 'flat'),
      prepaid: rows.find((d) => d.type === 'prepaid'),
    }
  } catch {
    // Fallback: synthesize from COUPON_CODES + hardcoded prepaid.
    return {
      coupons: Object.entries(COUPON_CODES).map(([code, c]) => ({
        code, type: c.type, value: c.discount, minOrder: c.minOrder, maxDiscount: c.maxDiscount ?? null,
      })),
      prepaid: { code: 'PREPAID10', type: 'prepaid' as const, value: FALLBACK_PREPAID_PERCENT, minOrder: 0, maxDiscount: null },
    }
  }
}

export function computeTotals(
  items: PricedItem[],
  opts: { couponCode?: string | null; paymentMethod?: 'cod' | 'online' | string | null } = {},
): Totals {
  const subtotal = items.reduce((s, it) => s + it.lineSubtotal, 0)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (subtotal > 0 ? SHIPPING_FEE : 0)
  const codFee = 0

  // Note: coupon + prepaid are computed synchronously from the already-loaded
  // fallback values here; the DB-driven path is handled by computeTotalsAsync
  // below for callers that need the live discount table.
  let discount = 0
  let appliedCoupon: string | null = null
  let couponError: string | null = null
  const rawCode = opts.couponCode?.trim().toUpperCase() ?? ''
  if (rawCode) {
    const coupon = COUPON_CODES[rawCode]
    if (!coupon) {
      couponError = 'Invalid coupon code'
    } else if (subtotal < coupon.minOrder) {
      couponError = `Minimum order of ₹${coupon.minOrder} required`
    } else {
      let d = coupon.type === 'percent'
        ? Math.round((subtotal * coupon.discount) / 100)
        : coupon.discount
      if (coupon.maxDiscount != null) d = Math.min(d, coupon.maxDiscount)
      d = Math.min(d, subtotal)
      discount = d
      appliedCoupon = rawCode
    }
  }

  // Apply prepaid discount on online orders (fallback value).
  const prepaidDiscount = opts.paymentMethod === 'online' ? Math.round((subtotal - discount) * (FALLBACK_PREPAID_PERCENT / 100)) : 0
  discount += prepaidDiscount

  const afterDiscount = subtotal - discount
  // GST breakdown (sum of per-line inclusive breakdown).
  const gstTotal = items.reduce((s, it) => s + it.gstAmount, 0)
  const cgst = items.reduce((s, it) => s + it.cgst, 0)
  const sgst = items.reduce((s, it) => s + it.sgst, 0)
  const taxableTotal = items.reduce((s, it) => s + it.taxable, 0)
  const total = afterDiscount + shipping + codFee // gst is inclusive, not added

  return { items, subtotal, discount, appliedCoupon, couponError, shipping, codFee, gstTotal, cgst, sgst, taxableTotal, total }
}

/**
 * Async totals using the live Discount table (admin-managed). Preferred for
 * server-side pricing (checkout, order creation). Falls back to computeTotals
 * semantics if the DB is unavailable.
 */
export async function computeTotalsAsync(
  items: PricedItem[],
  opts: { couponCode?: string | null; paymentMethod?: 'cod' | 'online' | string | null } = {},
): Promise<Totals> {
  const subtotal = items.reduce((s, it) => s + it.lineSubtotal, 0)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (subtotal > 0 ? SHIPPING_FEE : 0)
  const codFee = 0

  const { coupons, prepaid } = await loadDiscounts()

  let discount = 0
  let appliedCoupon: string | null = null
  let couponError: string | null = null
  const rawCode = opts.couponCode?.trim().toUpperCase() ?? ''
  if (rawCode) {
    const coupon = coupons.find((c) => c.code.toUpperCase() === rawCode)
    if (!coupon) {
      couponError = 'Invalid coupon code'
    } else if (subtotal < coupon.minOrder) {
      couponError = `Minimum order of ₹${coupon.minOrder} required`
    } else {
      let d = coupon.type === 'percent'
        ? Math.round((subtotal * coupon.value) / 100)
        : coupon.value
      if (coupon.maxDiscount != null) d = Math.min(d, coupon.maxDiscount)
      d = Math.min(d, subtotal)
      discount = d
      appliedCoupon = rawCode
    }
  }

  // Prepaid discount (admin-managed percent on online payments).
  const prepaidPercent = prepaid?.value ?? 0
  const prepaidDiscount = opts.paymentMethod === 'online' && prepaidPercent > 0
    ? Math.round((subtotal - discount) * (prepaidPercent / 100))
    : 0
  discount += prepaidDiscount

  const afterDiscount = subtotal - discount
  const gstTotal = items.reduce((s, it) => s + it.gstAmount, 0)
  const cgst = items.reduce((s, it) => s + it.cgst, 0)
  const sgst = items.reduce((s, it) => s + it.sgst, 0)
  const taxableTotal = items.reduce((s, it) => s + it.taxable, 0)
  const total = afterDiscount + shipping + codFee

  return { items, subtotal, discount, appliedCoupon, couponError, shipping, codFee, gstTotal, cgst, sgst, taxableTotal, total }
}
