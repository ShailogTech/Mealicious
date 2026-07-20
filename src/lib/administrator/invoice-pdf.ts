/**
 * Client-side invoice PDF generator — a TypeScript port of the static ERP's
 * invoice-pdf.js. Renders a tax invoice on the official company letterhead
 * (public/erp/letterhead.jpg) using jsPDF, laid out to sit inside the
 * letterhead's blank zone (below the header block, above the footer band).
 *
 * Runs in the browser only. The Invoices module calls downloadInvoicePDF()
 * from a client component.
 */

export interface PdfInvoiceItem {
  sno: number
  name: string
  qty: number
  price: number
  disc: number
  taxable: number
  gstPct: number
  total: number
}

export interface PdfInvoice {
  invoiceNumber: string
  date: string
  customerName: string
  mobile?: string | null
  address?: string | null
  customerGst?: string | null
  paymentMode?: string | null
  items: PdfInvoiceItem[]
  subtotal: number
  discountTotal: number
  gstTotal: number
  cgst: number
  sgst: number
  grandTotal: number
}

export interface PdfCompany {
  companyName?: string
  address?: string
  phone?: string
  email?: string
  gstin?: string
  fssai?: string
  cin?: string
  terms?: string
  footerText?: string
  bankName?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankIFSC?: string
  bankBranch?: string
  upiId?: string
}

function pdfMoney(n: number): string {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

let letterheadCache: string | null = null
async function getLetterheadDataUrl(): Promise<string> {
  if (letterheadCache) return letterheadCache
  const res = await fetch('/erp/letterhead.jpg')
  const blob = await res.blob()
  letterheadCache = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return letterheadCache
}

export async function buildInvoicePdfBlob(invoice: PdfInvoice, company: PdfCompany): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginL = 55
  const marginR = 55
  const contentW = pageW - marginL - marginR

  // Letterhead background.
  try {
    const dataUrl = await getLetterheadDataUrl()
    doc.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH)
  } catch {
    // Missing letterhead is non-fatal; the invoice still renders.
  }

  let y = 148

  // Title.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 30, 30)
  doc.text('TAX INVOICE', pageW / 2, y, { align: 'center' })
  y += 26

  doc.setDrawColor(230, 150, 90)
  doc.setLineWidth(0.75)
  doc.line(marginL, y, pageW - marginR, y)
  y += 20

  // Meta line.
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(60, 60, 60)
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, marginL, y)
  doc.text(`Date: ${invoice.date}`, pageW - marginR, y, { align: 'right' })
  y += 14
  doc.text(`Payment Mode: ${invoice.paymentMode || '—'}`, marginL, y)
  if (company.gstin) doc.text(`GSTIN: ${company.gstin}`, pageW - marginR, y, { align: 'right' })
  y += 22

  // Bill To.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('Bill To', marginL, y)
  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(60, 60, 60)
  doc.text(invoice.customerName || '—', marginL, y)
  y += 13
  if (invoice.mobile) { doc.text(`Mobile: ${invoice.mobile}`, marginL, y); y += 13 }
  if (invoice.address) {
    const addrLines = doc.splitTextToSize(invoice.address, contentW * 0.55)
    doc.text(addrLines, marginL, y)
    y += 13 * addrLines.length
  }
  if (invoice.customerGst) { doc.text(`GSTIN: ${invoice.customerGst}`, marginL, y); y += 13 }
  y += 12

  // Items table header.
  const colX = {
    sno: marginL,
    name: marginL + 28,
    qty: marginL + 250,
    price: marginL + 300,
    disc: marginL + 365,
    taxable: marginL + 425,
    gst: marginL + 485,
    total: pageW - marginR,
  }
  doc.setFillColor(27, 67, 50)
  doc.rect(marginL, y - 11, contentW, 20, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('#', colX.sno + 4, y + 3)
  doc.text('Item', colX.name, y + 3)
  doc.text('Qty', colX.qty, y + 3)
  doc.text('Price', colX.price, y + 3)
  doc.text('Disc%', colX.disc, y + 3)
  doc.text('Taxable', colX.taxable, y + 3)
  doc.text('GST', colX.gst, y + 3)
  doc.text('Total', colX.total, y + 3, { align: 'right' })
  y += 22

  // Items rows.
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)
  for (const it of invoice.items) {
    if (y > pageH - 160) {
      doc.addPage()
      y = 60
    }
    doc.text(String(it.sno), colX.sno + 4, y)
    const nameLines = doc.splitTextToSize(it.name || '', colX.qty - colX.name - 4)
    doc.text(nameLines[0] || '', colX.name, y)
    doc.text(String(it.qty), colX.qty, y)
    doc.text(pdfMoney(it.price), colX.price, y)
    doc.text(String(it.disc || 0), colX.disc, y)
    doc.text(pdfMoney(it.taxable), colX.taxable, y)
    doc.text(String(it.gstPct || 0) + '%', colX.gst, y)
    doc.text(pdfMoney(it.total), colX.total, y, { align: 'right' })
    y += 18
  }

  y += 6
  doc.setDrawColor(220, 220, 220)
  doc.line(marginL, y, pageW - marginR, y)
  y += 16

  // Totals.
  doc.setFontSize(9.5)
  const labelX = pageW - marginR - 160
  const valueX = pageW - marginR
  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(bold ? 20 : 70, bold ? 20 : 70, bold ? 20 : 70)
    doc.text(label, labelX, y)
    doc.text(value, valueX, y, { align: 'right' })
    y += 15
  }
  row('Subtotal', pdfMoney(invoice.subtotal))
  if (invoice.discountTotal > 0) row('Discount', pdfMoney(invoice.discountTotal))
  row('CGST', pdfMoney(invoice.cgst))
  row('SGST', pdfMoney(invoice.sgst))
  y += 4
  row('Grand Total', pdfMoney(invoice.grandTotal), true)

  // Terms & footer.
  y += 20
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  if (company.terms) {
    const termsLines = doc.splitTextToSize(company.terms, contentW)
    doc.text(termsLines, marginL, y)
    y += 11 * termsLines.length
  }
  if (company.footerText) {
    doc.text(company.footerText, pageW / 2, pageH - 40, { align: 'center' })
  }

  return doc.output('blob')
}

export async function downloadInvoicePdf(invoice: PdfInvoice, company: PdfCompany): Promise<void> {
  const blob = await buildInvoicePdfBlob(invoice, company)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoice.invoiceNumber}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
