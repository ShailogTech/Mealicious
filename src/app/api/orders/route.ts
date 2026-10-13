import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { priceCartFromDb, computeTotals, type PricingItemInput } from '@/lib/pricing'
import { notifyOrderConfirmed } from '@/lib/whatsapp'
import { sendEmail, orderConfirmationHtml } from '@/lib/email'

const ALLOWED_AMOUNT_DRIFT = 1

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      items,
      couponCode,
      paymentMethod,
      shippingAddr,
      billingAddr,
      customerEmail,
      customerName,
      customerPhone,
      clientTotal,
      cashfreeOrderId,
    } = body as {
      items: PricingItemInput[]
      couponCode?: string
      paymentMethod?: 'cod' | 'online'
      shippingAddr: Record<string, unknown>
      billingAddr?: Record<string, unknown>
      customerEmail: string
      customerName?: string
      customerPhone?: string
      clientTotal?: number
      cashfreeOrderId?: string
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items[] required' }, { status: 400 })
    }
    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail required' }, { status: 400 })
    }

    const priced = await priceCartFromDb(items)
    const totals = computeTotals(priced, { couponCode, paymentMethod: paymentMethod ?? 'cod' })

    if (typeof clientTotal === 'number' && Math.abs(clientTotal - totals.total) > ALLOWED_AMOUNT_DRIFT) {
      return NextResponse.json(
        {
          error: 'Amount mismatch. Cart prices have changed — refresh and try again.',
          serverTotal: totals.total,
          clientTotal,
        },
        { status: 409 },
      )
    }

    // Find-or-create only — never overwrite an existing User's profile from an
    // unauthenticated checkout. Shipping contact lives on the Order row.
    const emailLc = String(customerEmail).toLowerCase()
    const user =
      (await db.user.findUnique({ where: { email: emailLc } })) ??
      (await db.user.create({
        data: {
          email: emailLc,
          name: customerName || emailLc.split('@')[0],
          phone: customerPhone || null,
        },
      }))

    const orderNumber =
      cashfreeOrderId ||
      `ML-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Perform order creation and stock reduction in a transaction to prevent overselling
    const order = await db.$transaction(async (tx) => {
      // 1. Verify and decrement stock
      for (const item of priced) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, stock: true }
        })
        if (!prod) {
          throw new Error(`Product "${item.name}" not found.`)
        }
        if (prod.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${prod.name}". Only ${prod.stock} left in stock.`)
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // 2. Create the order
      return await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: 'confirmed',
          subtotal: totals.subtotal,
          shipping: totals.shipping + totals.codFee,
          discount: totals.discount,
          tax: totals.gst,
          total: totals.total,
          paymentMethod: paymentMethod ?? null,
          paymentStatus: 'pending',
          shippingAddr: JSON.stringify(shippingAddr ?? {}),
          billingAddr: billingAddr ? JSON.stringify(billingAddr) : null,
          couponCode: totals.appliedCoupon,
          items: {
            create: priced.map((p) => ({
              productId: p.productId,
              name: p.name,
              image: p.image,
              price: p.unitPrice,
              quantity: p.quantity,
              variant: p.variant,
              subtotal: p.lineSubtotal,
            })),
          },
        },
        include: { items: true },
      })
    })

    // NOTE: referral reward is NOT credited at order creation — it is gated on
    // payment capture (prepaid → /payments/cashfree/verify) or delivery (admin
    // marks order delivered). This prevents farming credit via unpaid COD orders.
    // See completeReferralReward() in src/lib/referral-reward.ts.

    // Mark abandoned cart recovered (fire-and-forget)
    const waPhone = customerPhone || (JSON.parse(order.shippingAddr) as Record<string, string>).phone
    if (waPhone) {
      const cleanPhone = String(waPhone).replace(/\D/g, '').slice(-10)
      db.abandonedCart.updateMany({ where: { phone: cleanPhone, recovered: false }, data: { recovered: true } }).catch(() => {})
    }

    // WhatsApp order confirmation (fire-and-forget)
    if (waPhone) {
      const itemsSummary = order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')
      notifyOrderConfirmed(waPhone, {
        customerName: user.name,
        orderNumber: order.orderNumber,
        items: itemsSummary,
        total: order.total,
        paymentMethod: order.paymentMethod || 'COD',
      }).catch(() => {})
    }

    // Order confirmation email (#14) — fire-and-forget.
    if (customerEmail) {
      sendEmail({
        to: customerEmail,
        subject: `Order Confirmed — ${order.orderNumber}`,
        html: orderConfirmationHtml(order.orderNumber, user.name, order.total, order.items.map(i => ({ name: i.name, qty: i.quantity, price: i.price }))),
      }).catch(() => {})
    }

    // Auto-sync this order into an ERP invoice (fire-and-forget, idempotent).
    // Skips gracefully if the ERP tables/config aren't set up.
    import('@/lib/erp-sync').then(({ createErpInvoiceFromOrder }) =>
      createErpInvoiceFromOrder(order.id)
    ).catch(() => {})

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.paymentMethod,
        shippingAddr: JSON.parse(order.shippingAddr),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
        createdAt: order.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Order API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
