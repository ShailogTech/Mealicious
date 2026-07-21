import { db } from './db'
import { computeInvoice, type InvoiceLineInput } from '@/lib/administrator/invoice-math'

/**
 * Store ↔ ERP synchronization helpers.
 *
 * 1. createErpInvoiceFromOrder: converts a paid store Order into an ErpInvoice
 *    (idempotent — skips if the order already has erpInvoiceNumber).
 * 2. syncProductStockToErp: when a linked product's stock changes, propagate
 *    to the ErpInventoryItem.
 */

/**
 * Map payment method vocabularies: store (cod/prepaid/upi) → ERP (Cash/UPI/Card/Bank Transfer).
 */
function mapPaymentMethod(storeMethod: string | null): string {
  if (!storeMethod) return 'Cash'
  const m = storeMethod.toLowerCase()
  if (m === 'cod') return 'Cash'
  if (m === 'upi') return 'UPI'
  if (m === 'prepaid' || m === 'online') return 'Bank Transfer'
  return 'Cash'
}

/**
 * Create an ErpInvoice from a store Order. Idempotent: if the order already
 * has erpInvoiceNumber, returns immediately. Uses the customer's phone as the
 * join key (ErpCustomer.mobile upsert). Returns the invoice number or null
 * if skipped/failed.
 */
export async function createErpInvoiceFromOrder(orderId: string): Promise<string | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  })
  if (!order) return null
  if (order.erpInvoiceNumber) return order.erpInvoiceNumber // already synced

  // Resolve customer name + phone.
  const customerName = order.user?.name || 'Walk-in Customer'
  let mobile: string | null = order.user?.phone ?? null
  let address: string | null = null
  try {
    const ship = JSON.parse(order.shippingAddr)
    if (!mobile && ship.phone) mobile = ship.phone
    address = ship.address ?? null
  } catch {}

  // Build ERP line items from order items. Store prices are GST-INCLUSIVE;
  // convert to pre-tax for computeInvoice (which adds GST on top).
  const lineInputs: InvoiceLineInput[] = order.items.map((item) => {
    const inclusiveUnit = item.price
    // Fetch gstPct from the product if available; default 0.
    return {
      name: item.name + (item.variant ? ` (${item.variant})` : ''),
      qty: item.quantity,
      price: inclusiveUnit, // passed inclusive; we adjust below
      disc: 0,
      gstPct: 0, // set per-line below after DB lookup (sync context)
    }
  })

  // Look up gstPct per product for accurate breakdown.
  const productIds = order.items.map((i) => i.productId)
  const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, gstPct: true } })
  const gstMap = new Map(products.map((p) => [p.id, p.gstPct ?? 0]))
  order.items.forEach((item, idx) => {
    const gstPct = gstMap.get(item.productId) ?? 0
    if (gstPct > 0) {
      // Convert inclusive price → pre-tax price for computeInvoice.
      lineInputs[idx].price = inclusiveToPreTax(item.price, gstPct)
      lineInputs[idx].gstPct = gstPct
    }
  })

  const totals = computeInvoice(lineInputs)

  const result = await db.$transaction(async (tx) => {
    const config = await tx.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
    if (!config) throw new Error('ERP config missing')
    const company = config.company as { invoicePrefix?: string }
    const next = config.invoiceCounter + 1
    const invoiceNumber = `${company.invoicePrefix ?? 'INV'}-${String(next)}`
    await tx.erpSystemConfig.update({ where: { id: 'singleton' }, data: { invoiceCounter: next } })

    // Customer upsert by mobile.
    let customerId: string | null = null
    if (mobile) {
      const existing = await tx.erpCustomer.findUnique({ where: { mobile } })
      if (existing) {
        const updated = await tx.erpCustomer.update({
          where: { id: existing.id },
          data: {
            name: customerName,
            address: address ?? existing.address,
            totalOrders: { increment: 1 },
            lifetimeValue: { increment: totals.grandTotal },
          },
        })
        customerId = updated.id
      } else {
        const created = await tx.erpCustomer.create({
          data: {
            name: customerName, mobile, whatsapp: mobile, address,
            totalOrders: 1, lifetimeValue: totals.grandTotal,
          },
        })
        customerId = created.id
      }
    }

    await tx.erpInvoice.create({
      data: {
        invoiceNumber,
        date: order.createdAt,
        customerName,
        mobile,
        address,
        items: JSON.parse(JSON.stringify(totals.lines)),
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        gstTotal: totals.gstTotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        grandTotal: totals.grandTotal,
        paymentMode: mapPaymentMethod(order.paymentMethod),
        customerId,
      },
    })

    // Auto-create an Income transaction.
    await tx.erpTransaction.create({
      data: {
        date: order.createdAt,
        type: 'Income',
        category: `Order ${order.orderNumber} → ${invoiceNumber}`,
        amount: totals.grandTotal,
        account: 'Axis Bank - Current',
        note: customerName,
      },
    })

    // Mark the order as synced (idempotency guard).
    await tx.order.update({ where: { id: orderId }, data: { erpInvoiceNumber: invoiceNumber } })

    return invoiceNumber
  })

  return result
}

/** Convert a GST-inclusive price to its pre-tax (taxable) base. */
function inclusiveToPreTax(inclusive: number, gstPct: number): number {
  return inclusive / (1 + gstPct / 100)
}

/**
 * Propagate a store Product's stock to its linked ErpInventoryItem.
 * No-op if the product isn't linked (erpInventoryItemId is null).
 */
export async function syncProductStockToErp(productId: string): Promise<void> {
  const product = await db.product.findUnique({ where: { id: productId }, select: { stock: true, erpInventoryItemId: true } })
  if (!product || !product.erpInventoryItemId) return
  await db.erpInventoryItem.update({
    where: { id: product.erpInventoryItemId },
    data: { stock: product.stock },
  })
}

/**
 * Propagate an ErpInventoryItem's stock to its linked store Product.
 * No-op if no product links to this ERP item.
 */
export async function syncErpStockToProduct(erpInventoryItemId: string): Promise<void> {
  const product = await db.product.findUnique({ where: { erpInventoryItemId: erpInventoryItemId }, select: { id: true } })
  if (!product) return
  const erpItem = await db.erpInventoryItem.findUnique({ where: { id: erpInventoryItemId }, select: { stock: true } })
  if (!erpItem) return
  await db.product.update({ where: { id: product.id }, data: { stock: erpItem.stock } })
}
