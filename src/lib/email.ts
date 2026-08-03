/**
 * Email sending helper. Uses the Resend API (or falls back gracefully if not
 * configured). Fire-and-forget pattern — never blocks the caller.
 *
 * Environment variables needed:
 *   RESEND_API_KEY — Resend API key
 *   FROM_EMAIL — sender address (e.g. support@mealicious.store)
 */

const RESEND_URL = 'https://api.resend.com/emails'

function apiKey() { return process.env.RESEND_API_KEY || '' }
function fromEmail() { return process.env.FROM_EMAIL || 'Mealicious <support@mealicious.store>' }
export function isEmailConfigured() { return !!apiKey() }

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log('[email] Not configured, skipping send to', to)
    return false
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail(), to: [to], subject, html }),
    })
    if (!res.ok) {
      console.error('[email] Send failed:', res.status, await res.text())
      return false
    }
    return true
  } catch (e) {
    console.error('[email] Error:', e)
    return false
  }
}

/** Order confirmation email HTML template. */
export function orderConfirmationHtml(orderNumber: string, customerName: string, total: number, items: { name: string; qty: number; price: number }[]): string {
  const itemRows = items.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(i.price * i.qty).toFixed(2)}</td></tr>`).join('')
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#1b4332;padding:24px;text-align:center">
        <h1 style="color:#e8a93b;margin:0;font-size:24px">Mealicious</h1>
        <p style="color:#fff;margin:4px 0 0;font-size:13px">Order Confirmation</p>
      </div>
      <div style="padding:24px">
        <p>Hi ${customerName},</p>
        <p>Thank you for your order! Your order <b>${orderNumber}</b> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
          <tfoot><tr><td colspan="2" style="padding:12px;text-align:right;font-weight:bold">Total:</td><td style="padding:12px;text-align:right;font-weight:bold">₹${total.toFixed(2)}</td></tr></tfoot>
        </table>
        <p>We'll notify you via WhatsApp and email once your order is shipped.</p>
        <p style="color:#888;font-size:12px;margin-top:24px">Nature's Goodness in Every Bite · <a href="https://mealicious.store" style="color:#e8a93b">mealicious.store</a></p>
      </div>
    </div>
  `
}

/** Shipping/tracking notification email HTML template. */
export function trackingNotificationHtml(orderNumber: string, customerName: string, trackingId: string, trackingUrl: string, courierName: string): string {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
      <div style="background:#1b4332;padding:24px;text-align:center">
        <h1 style="color:#e8a93b;margin:0;font-size:24px">Mealicious</h1>
        <p style="color:#fff;margin:4px 0 0;font-size:13px">Your Order Has Been Shipped!</p>
      </div>
      <div style="padding:24px">
        <p>Hi ${customerName},</p>
        <p>Great news! Your order <b>${orderNumber}</b> has been shipped.</p>
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:0"><b>Courier:</b> ${courierName}</p>
          <p style="margin:4px 0"><b>Tracking Number:</b> ${trackingId}</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="color:#e8a93b">Track Your Order →</a>` : ''}
        </div>
        <p>Thank you for choosing Mealicious!</p>
        <p style="color:#888;font-size:12px;margin-top:24px">Nature's Goodness in Every Bite · <a href="https://mealicious.store" style="color:#e8a93b">mealicious.store</a></p>
      </div>
    </div>
  `
}
