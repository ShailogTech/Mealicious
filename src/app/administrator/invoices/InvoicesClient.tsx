'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import type { ErpColumn, ErpRow } from '@/components/administrator/erp-crud-types'
import { downloadInvoicePdf, type PdfInvoice, type PdfCompany } from '@/lib/administrator/invoice-pdf'

interface Invoice extends ErpRow {
  id: string
  invoiceNumber: string
  date: string
  customerName: string
  mobile: string
  grandTotal: number
  paymentMode: string
}

const COLUMNS: ErpColumn[] = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'date', label: 'Date' },
  { key: 'customerName', label: 'Customer' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'grandTotal', label: 'Total', type: 'inr' },
  { key: 'paymentMode', label: 'Payment', type: 'badge' },
]

export function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const [rows] = useState<Invoice[]>(invoices)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleDownload(row: ErpRow) {
    const inv = row as Invoice
    setDownloadingId(inv.id)
    try {
      // Fetch the full invoice (with items) for the PDF.
      const res = await fetch(`/api/administrator/invoices/${inv.id}`)
      if (!res.ok) throw new Error()
      const { invoice } = await res.json()
      const pdfInvoice: PdfInvoice = {
        invoiceNumber: invoice.invoiceNumber,
        date: new Date(invoice.date).toISOString().slice(0, 10),
        customerName: invoice.customerName,
        mobile: invoice.mobile,
        address: invoice.address,
        customerGst: invoice.customerGst,
        paymentMode: invoice.paymentMode,
        items: invoice.items,
        subtotal: invoice.subtotal,
        discountTotal: invoice.discountTotal,
        gstTotal: invoice.gstTotal,
        cgst: invoice.cgst,
        sgst: invoice.sgst,
        grandTotal: invoice.grandTotal,
      }
      // Company identity is baked into the letterhead; minimal company object
      // suffices since the letterhead carries GSTIN/address artwork.
      const company: PdfCompany = { terms: 'Goods once sold will not be taken back.', footerText: "Thank you for shopping with us! Nature's Goodness in Every Bite." }
      await downloadInvoicePdf(pdfInvoice, company)
      toast.success('PDF downloaded')
    } catch {
      toast.error('PDF generation failed')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      <ErpPageHeader
        title="Invoices"
        description="Tax invoices issued. Download the official letterhead PDF."
        action={
          <Button asChild>
            <Link href="/administrator/billing"><FileText className="h-4 w-4" /> New Invoice</Link>
          </Button>
        }
      />
      <ErpDataTable
        columns={COLUMNS}
        rows={rows}
        renderRowActions={(row) => (
          <Button variant="ghost" size="icon" className="h-8 w-8"
            disabled={downloadingId === (row as Invoice).id}
            onClick={() => handleDownload(row)} title="Download PDF (letterhead)">
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
        emptyMessage="No invoices yet. Create one from “New Invoice”."
      />
    </div>
  )
}
