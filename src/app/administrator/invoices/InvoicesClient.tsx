'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, FileText, MessageCircle, Pencil, History } from 'lucide-react'
import Link from 'next/link'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpExportButtons } from '@/components/administrator/ErpExportButtons'
import type { ErpColumn, ErpRow } from '@/components/administrator/erp-crud-types'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { downloadInvoicePdf, type PdfInvoice, type PdfCompany } from '@/lib/administrator/invoice-pdf'
import { buildInvoiceWaLink, openInvoiceWaLink } from '@/lib/administrator/whatsapp-share'

interface Invoice extends ErpRow {
  id: string
  invoiceNumber: string
  date: string
  customerName: string
  mobile: string
  grandTotal: number
  paymentMode: string
}

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit']

const COLUMNS: ErpColumn[] = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'date', label: 'Date' },
  { key: 'customerName', label: 'Customer' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'grandTotal', label: 'Total', type: 'inr' },
  { key: 'paymentMode', label: 'Payment', type: 'badge' },
]

export function InvoicesClient({ invoices, canExport, canEdit }: { invoices: Invoice[]; canExport?: boolean; canEdit?: boolean }) {
  const [rows, setRows] = useState<Invoice[]>(invoices)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Revision counts per invoice (for the History indicator), fetched from the
  // revisions endpoint once on mount.
  const [revisionCounts, setRevisionCounts] = useState<Record<string, number>>({})

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)
  const [fCustomerName, setFCustomerName] = useState('')
  const [fMobile, setFMobile] = useState('')
  const [fPaymentMode, setFPaymentMode] = useState('Cash')

  useEffect(() => {
    if (rows.length === 0) return
    let cancelled = false
    Promise.all(
      rows.map(async (inv) => {
        const res = await fetch(`/api/administrator/invoices/${inv.id}/revisions`).catch(() => null)
        if (!res || !res.ok) return [inv.id, 0] as const
        const { count } = await res.json().catch(() => ({ count: 0 }))
        return [inv.id, Number(count) || 0] as const
      }),
    ).then((entries) => {
      if (!cancelled) setRevisionCounts(Object.fromEntries(entries))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [rows.length]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function openEdit(inv: Invoice) {
    setEditTarget(inv)
    setFCustomerName(inv.customerName)
    setFMobile(inv.mobile)
    setFPaymentMode(inv.paymentMode)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    if (!fCustomerName.trim()) { toast.error('Customer name is required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/administrator/invoices/${editTarget.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: fCustomerName, mobile: fMobile, paymentMode: fPaymentMode }),
      })
      if (res.ok) {
        const { invoice } = await res.json()
        setRows((rs) => rs.map((r) => (r.id === editTarget.id ? {
          ...r,
          customerName: invoice.customerName,
          mobile: invoice.mobile ?? '',
          paymentMode: invoice.paymentMode,
        } : r)))
        // A revision was just created — bump the History indicator.
        setRevisionCounts((rc) => ({ ...rc, [editTarget.id]: (rc[editTarget.id] ?? 0) + 1 }))
        toast.success(`Invoice ${editTarget.invoiceNumber} updated`)
        setEditOpen(false)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Update failed')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ErpPageHeader
        title="Invoices"
        description="Tax invoices issued. Download the official letterhead PDF."
        action={
          <>
            <ErpExportButtons model="invoices" canExport={!!canExport} />
            <Button asChild>
              <Link href="/administrator/billing"><FileText className="h-4 w-4" /> New Invoice</Link>
            </Button>
          </>
        }
      />
      <ErpDataTable
        columns={COLUMNS}
        rows={rows}
        renderCell={(column, row) => {
          // History indicator next to the invoice number when revisions exist.
          if (column.key === 'invoiceNumber') {
            const count = revisionCounts[(row as Invoice).id] ?? 0
            return (
              <span className="inline-flex items-center gap-1.5">
                <span>{String((row as Invoice).invoiceNumber)}</span>
                {count > 0 && (
                  <Badge variant="outline" className="gap-1 font-normal text-stone-500" title={`${count} edit${count === 1 ? '' : 's'} recorded`}>
                    <History className="h-3 w-3" /> {count}
                  </Badge>
                )}
              </span>
            )
          }
          return undefined
        }}
        renderRowActions={(row) => {
          const inv = row as Invoice
          const waLink = buildInvoiceWaLink(inv.mobile, inv.invoiceNumber, inv.customerName, inv.grandTotal)
          return (
            <>
              {waLink && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"
                  onClick={() => openInvoiceWaLink(waLink)} title="Send via WhatsApp">
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8"
                disabled={downloadingId === inv.id}
                onClick={() => handleDownload(row)} title="Download PDF (letterhead)">
                <Download className="h-3.5 w-3.5" />
              </Button>
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => openEdit(inv)} title="Edit invoice">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )
        }}
        emptyMessage="No invoices yet. Create one from “New Invoice”."
      />

      {/* Edit invoice dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Invoice {editTarget?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Customer Name <span className="text-red-500">*</span></Label>
              <Input value={fCustomerName} onChange={(e) => setFCustomerName(e.target.value)} placeholder="Customer name" />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input value={fMobile} onChange={(e) => setFMobile(e.target.value)} placeholder="Mobile number" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select value={fPaymentMode} onValueChange={setFPaymentMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-stone-400">
              The previous state is saved to the edit history automatically before this change is applied.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving…' : <><Pencil className="h-4 w-4" /> Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
