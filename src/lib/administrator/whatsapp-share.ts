/**
 * Client-side WhatsApp share helper for invoices. Builds a wa.me click-to-chat
 * URL pre-filled with the invoice summary. Opens in a new tab — the user
 * reviews and sends manually (no server-side Cloud API call).
 */

/** Normalize an Indian phone to wa.me format (E.164 without +). */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) return digits
  if (digits.length === 10) return `91${digits}`
  return digits
}

/**
 * Build a wa.me link for sharing an invoice.
 * Returns null if the phone is missing/invalid (caller should hide the button).
 */
export function buildInvoiceWaLink(
  mobile: string | null | undefined,
  invoiceNumber: string,
  customerName: string,
  grandTotal: number,
): string | null {
  if (!mobile || mobile.trim().length < 10) return null
  const phone = normalizePhone(mobile)
  if (phone.length < 10) return null

  const lines = [
    `Hello ${customerName},`,
    ``,
    `Here is your invoice from Mealicious:`,
    ``,
    `Invoice: ${invoiceNumber}`,
    `Amount: ₹${Number(grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ``,
    `Thank you for your purchase!`,
    `Nature's Goodness in Every Bite.`,
  ]
  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${phone}?text=${text}`
}

/** Open the wa.me link in a new tab. No-op if link is null. */
export function openInvoiceWaLink(link: string | null): void {
  if (!link) return
  window.open(link, '_blank', 'noopener,noreferrer')
}
