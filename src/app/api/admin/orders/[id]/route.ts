import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-server'
import { notifyOrderShipped, notifyOrderDelivered, notifyOrderCancelled } from '@/lib/whatsapp'
import { completeReferralReward } from '@/lib/referral-reward'
import { sendEmail, trackingNotificationHtml } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.status) data.status = String(body.status).toLowerCase()
  if (body.paymentStatus) data.paymentStatus = String(body.paymentStatus).toLowerCase()
  if (body.trackingId !== undefined) data.trackingId = body.trackingId
  if (body.trackingUrl !== undefined) data.trackingUrl = body.trackingUrl
  if (body.shippingProvider !== undefined) data.shippingProvider = body.shippingProvider

  // Try to find by orderNumber first, fall back to id, including items for stock updates
  let existing = await db.order.findUnique({ where: { orderNumber: id }, include: { user: true, items: true } })
  if (!existing) {
    existing = await db.order.findUnique({ where: { id }, include: { user: true, items: true } })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Automatic payment update on delivery (simplifies admin workflow & ensures revenue updates)
  if (data.status === 'delivered') {
    data.paymentStatus = 'paid'
  }

  // Handle stock restoration on cancellation
  if (data.status === 'cancelled' && existing.status !== 'cancelled') {
    for (const item of existing.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      }).catch(err => console.error(`Failed to restore stock for product ${item.productId}:`, err))
    }
  }

  // Handle stock reduction if re-activated from cancelled to confirmed/processing/etc
  if (existing.status === 'cancelled' && data.status && data.status !== 'cancelled') {
    for (const item of existing.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      }).catch(err => console.error(`Failed to re-decrement stock for product ${item.productId}:`, err))
    }
  }

  const updated = await db.order.update({
    where: { id: existing.id },
    data
  })

  // WhatsApp delivery alerts (fire-and-forget)
  if (existing && body.status && body.status !== existing.status) {
    let addr: Record<string, string> = {}
    try { addr = JSON.parse(existing.shippingAddr) } catch {}
    const phone = existing.user?.phone || addr.phone
    const name = existing.user?.name || addr.fullName || 'Customer'
    if (phone) {
      const newStatus = String(body.status).toLowerCase()
      if (newStatus === 'shipped') {
        notifyOrderShipped(phone, {
          customerName: name,
          orderNumber: existing.orderNumber,
          courierName: String(data.shippingProvider || existing.shippingProvider || 'Courier'),
          awb: String(data.trackingId || existing.trackingId || ''),
          trackingUrl: String(data.trackingUrl || existing.trackingUrl || 'https://mealicious.store'),
        }).catch(() => {})
      } else if (newStatus === 'delivered') {
        notifyOrderDelivered(phone, { customerName: name, orderNumber: existing.orderNumber }).catch(() => {})
      } else if (newStatus === 'cancelled') {
        notifyOrderCancelled(phone, { customerName: name, orderNumber: existing.orderNumber, total: existing.total }).catch(() => {})
      }
    }
  }

  // Credit referrer once a COD order is genuinely delivered (prepaid credited at payment)
  if (existing && body.status && String(body.status).toLowerCase() === 'delivered' && existing.status !== 'delivered') {
    completeReferralReward(existing.userId).catch(() => {})
  }

  // #15: When tracking ID is entered/updated, notify the customer via Email + WhatsApp
  // (separate from the status-change block above — fires even without a status change).
  if (body.trackingId && body.trackingId !== (existing.trackingId || '')) {
    let addr: Record<string, string> = {}
    try { addr = JSON.parse(existing.shippingAddr) } catch {}
    const phone = existing.user?.phone || addr.phone
    const name = existing.user?.name || addr.fullName || 'Customer'
    const email = existing.user?.email
    const trackingId = String(body.trackingId)
    const trackingUrl = String(body.trackingUrl || '')
    const courierName = String(body.shippingProvider || existing.shippingProvider || 'Courier')

    // WhatsApp notification
    if (phone) {
      notifyOrderShipped(phone, {
        customerName: name,
        orderNumber: existing.orderNumber,
        courierName,
        awb: trackingId,
        trackingUrl: trackingUrl || 'https://mealicious.store',
      }).catch(() => {})
    }
    // Email notification
    if (email) {
      sendEmail({
        to: email,
        subject: `Your order has been shipped — ${existing.orderNumber}`,
        html: trackingNotificationHtml(existing.orderNumber, name, trackingId, trackingUrl, courierName),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ order: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  
  // Try to find by orderNumber first, fall back to id
  let o = await db.order.findUnique({ where: { orderNumber: id }, include: { items: true } })
  if (!o) {
    o = await db.order.findUnique({ where: { id }, include: { items: true } })
  }
  if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
  // Cascade: delete order items first
  await db.orderItem.deleteMany({ where: { orderId: o.id } })
  await db.order.delete({ where: { id: o.id } })
  return NextResponse.json({ ok: true })
}
