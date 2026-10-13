'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft, MessageCircle, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { buildInvoiceWaLink, openInvoiceWaLink } from '@/lib/administrator/whatsapp-share'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { computeWholesaleInvoice, type InvoiceLineInput } from '@/lib/administrator/invoice-math'

/**
 * Wholesale (B2B) invoice form. Mirrors BillingClient's product-picker + line
 * layout but adds B2B-only fields (buyer business name/GSTIN/address/contact,
 * delivery terms, payment terms) and computes a single IGST line instead of the
 * CGST/SGST split. On submit it POSTs to /api/administrator/wholesale-invoices.
 */

const PAYMENT_TERMS = ['Advance', 'Credit', 'Due'] as const

interface Line {
  name: string
  qty: string
  price: string
  disc: string
  gstPct: string
}

const EMPTY_LINE: Line = { name: '', qty: '1', price: '0', disc: '0', gstPct: '0' }

export function WholesaleClient() {
  const router = useRouter()
  // Buyer (business) details — wholesale-specific.
  const [buyerBusinessName, setBuyerBusinessName] = useState('')
  const [buyerGst, setBuyerGst] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerContact, setBuyerContact] = useState('')
  // Terms.
  const [deliveryTerms, setDeliveryTerms] = useState('')
  const [paymentTerms, setPaymentTerms] = useState<typeof PAYMENT_TERMS[number]>('Credit')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [overallDiscountPct, setOverallDiscountPct] = useState('0')
  // Lines.
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }])
  const [saving, setSaving] = useState(false)
  const [createdInvoice, setCreatedInvoice] = useState<{ invoiceNumber: string; customerName: string; mobile: string | null; grandTotal: number } | null>(null)
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; price: number; gstPct: number }[]>([])

  // Fetch ERP inventory so the product picker auto-fills (same pattern as billing).
  useEffect(() => {
    fetch('/api/administrator/inventory').then((r) => r.json()).then((data) => {
      if (Array.isArray(data.items)) {
        setInventoryItems(data.items.map((i: Record<string, unknown>) => ({
          id: String(i.id), name: String(i.name), price: Number(i.price) || 0, gstPct: Number(i.gstPct) || 0,
        })))
      }
    }).catch(() => {})
  }, [])

  function selectProduct(idx: number, productId: string) {
    const product = inventoryItems.find((p) => p.id === productId)
    if (!product) return
    updateLine(idx, { name: product.name, price: String(product.price), gstPct: String(product.gstPct) })
  }

  const inputs: InvoiceLineInput[] = lines.map((l) => ({
    name: l.name, qty: Number(l.qty) || 0, price: Number(l.price) || 0, disc: Number(l.disc) || 0, gstPct: Number(l.gstPct) || 0,
  }))
  const totals = useMemo(
    () => computeWholesaleInvoice(inputs, Number(overallDiscountPct) || 0),
    [lines, overallDiscountPct],
  )

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  function addLine() { setLines((ls) => [...ls, { ...EMPTY_LINE }]) }
  function removeLine(idx: number) { setLines((ls) => ls.filter((_, i) => i !== idx)) }

  async function handleSubmit() {
    if (!buyerBusinessName.trim()) { toast.error('Buyer business name is required'); return }
    if (lines.length === 0 || lines.every((l) => !l.name.trim())) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/administrator/wholesale-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerBusinessName,
          buyerGst,
          buyerAddress,
          buyerContact,
          deliveryTerms,
          paymentTerms,
          date,
          overallDiscountPct: Number(overallDiscountPct) || 0,
          items: inputs,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to create wholesale invoice')
        return
      }
      const { invoice } = await res.json()
      toast.success('Wholesale invoice created')
      setCreatedInvoice({
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        mobile: invoice.mobile,
        grandTotal: invoice.grandTotal,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ErpPageHeader
        title="Wholesale Invoice"
        description="B2B tax invoice — inter-state IGST, no CGST/SGST split."
        action={
          <Button variant="outline" asChild>
            <Link href="/administrator/invoices"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: buyer + items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Buyer (Business)</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Business Name *</Label>
                <Input value={buyerBusinessName} onChange={(e) => setBuyerBusinessName(e.target.value)} placeholder="Buyer business / firm name" />
              </div>
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input value={buyerGst} onChange={(e) => setBuyerGst(e.target.value)} placeholder="Buyer GSTIN" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Textarea value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Buyer billing address" />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} placeholder="Phone / email" />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Terms</Label>
                <Input value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} placeholder="e.g. FOB / Ex-Works / Delivered" />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={(v) => setPaymentTerms(v as typeof PAYMENT_TERMS[number])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-4 w-4" /> Add Item</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <Label className="text-xs">Item</Label>
                    {inventoryItems.length > 0 && (
                      <Select onValueChange={(v) => selectProduct(idx, v)}>
                        <SelectTrigger className="mb-1 text-xs h-8"><SelectValue placeholder="Pick from inventory…" /></SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · ₹{p.price}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Input value={l.name} onChange={(e) => updateLine(idx, { name: e.target.value })} placeholder="Item name (or pick above)" />
                  </div>
                  <div className="col-span-3 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" value={l.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input type="number" value={l.price} onChange={(e) => updateLine(idx, { price: e.target.value })} />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Disc%</Label>
                    <Input type="number" value={l.disc} onChange={(e) => updateLine(idx, { disc: e.target.value })} />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    <Label className="text-xs">GST%</Label>
                    <Input type="number" value={l.gstPct} onChange={(e) => updateLine(idx, { gstPct: e.target.value })} />
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-end">
                    <div className="text-right">
                      <Label className="text-xs invisible sm:block">Total</Label>
                      <p className="text-sm font-semibold py-2">₹{totals.lines[idx]?.total.toFixed(2) ?? '0.00'}</p>
                    </div>
                  </div>
                  {lines.length > 1 && (
                    <div className="col-span-12 sm:col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeLine(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: overall discount + totals + save */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Subtotal" value={totals.subtotal} />
              {totals.lineDiscountTotal > 0 && <Row label="Line Discount" value={totals.lineDiscountTotal} />}
              {totals.overallDiscountAmount > 0 && <Row label="Overall Discount" value={totals.overallDiscountAmount} />}
              <Row label="IGST" value={totals.igst} />
              <div className="border-t border-stone-200 pt-2 mt-2">
                <Row label="Grand Total" value={totals.grandTotal} bold />
              </div>
              <div className="pt-2">
                <Label className="text-xs">Overall Discount %</Label>
                <Input type="number" value={overallDiscountPct} onChange={(e) => setOverallDiscountPct(e.target.value)} className="mt-1" />
              </div>
            </CardContent>
          </Card>
          <Button className="w-full" size="lg" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Saving…' : 'Save Wholesale Invoice'}
          </Button>
        </div>
      </div>

      {/* Success dialog — WhatsApp share + go to invoices */}
      <Dialog open={!!createdInvoice} onOpenChange={(o) => { if (!o) { setCreatedInvoice(null); router.push('/administrator/invoices') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wholesale invoice created</DialogTitle>
          </DialogHeader>
          {createdInvoice && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-600" />
                <span><b>{createdInvoice.invoiceNumber}</b> for {createdInvoice.customerName} — ₹{createdInvoice.grandTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-stone-500">Share the invoice via WhatsApp to your buyer:</p>
              <div className="flex gap-2">
                {buildInvoiceWaLink(createdInvoice.mobile, createdInvoice.invoiceNumber, createdInvoice.customerName, createdInvoice.grandTotal) ? (
                  <Button className="flex-1" onClick={() => openInvoiceWaLink(buildInvoiceWaLink(createdInvoice.mobile, createdInvoice.invoiceNumber, createdInvoice.customerName, createdInvoice.grandTotal))}>
                    <MessageCircle className="h-4 w-4" /> Send via WhatsApp
                  </Button>
                ) : (
                  <p className="text-xs text-amber-600 flex-1">No contact number on this invoice — WhatsApp share unavailable.</p>
                )}
                <Button variant="outline" onClick={() => { setCreatedInvoice(null); router.push('/administrator/invoices') }}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-bold' : 'text-stone-500'}>{label}</span>
      <span className={bold ? 'font-bold' : ''}>₹{value.toFixed(2)}</span>
    </div>
  )
}
