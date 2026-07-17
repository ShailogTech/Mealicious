'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { computeInvoice, type InvoiceLineInput } from '@/lib/administrator/invoice-math'

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit']

interface Line {
  name: string
  qty: string
  price: string
  disc: string
  gstPct: string
}

const EMPTY_LINE: Line = { name: '', qty: '1', price: '0', disc: '0', gstPct: '0' }

export function BillingClient() {
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [address, setAddress] = useState('')
  const [customerGst, setCustomerGst] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }])
  const [saving, setSaving] = useState(false)

  const inputs: InvoiceLineInput[] = lines.map((l) => ({
    name: l.name, qty: Number(l.qty) || 0, price: Number(l.price) || 0, disc: Number(l.disc) || 0, gstPct: Number(l.gstPct) || 0,
  }))
  const totals = useMemo(() => computeInvoice(inputs), [lines])

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  function addLine() { setLines((ls) => [...ls, { ...EMPTY_LINE }]) }
  function removeLine(idx: number) { setLines((ls) => ls.filter((_, i) => i !== idx)) }

  async function handleSubmit() {
    if (!customerName.trim()) { toast.error('Customer name is required'); return }
    if (lines.length === 0 || lines.every((l) => !l.name.trim())) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/administrator/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, mobile, address, customerGst, date, paymentMode, items: inputs }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to create invoice')
        return
      }
      toast.success('Invoice created')
      router.push('/administrator/invoices')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ErpPageHeader
        title="New Invoice"
        description="Create a tax invoice. GST is split equally into CGST and SGST."
        action={
          <Button variant="outline" asChild>
            <Link href="/administrator/invoices"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: customer + items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer Name *</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile</Label>
                <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Customer GSTIN</Label>
                <Input value={customerGst} onChange={(e) => setCustomerGst(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
                    <Input value={l.name} onChange={(e) => updateLine(idx, { name: e.target.value })} placeholder="Item name" />
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

        {/* Right: totals + save */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Subtotal" value={totals.subtotal} />
              {totals.discountTotal > 0 && <Row label="Discount" value={totals.discountTotal} />}
              <Row label="CGST" value={totals.cgst} />
              <Row label="SGST" value={totals.sgst} />
              <div className="border-t border-stone-200 pt-2 mt-2">
                <Row label="Grand Total" value={totals.grandTotal} bold />
              </div>
            </CardContent>
          </Card>
          <Button className="w-full" size="lg" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Saving…' : 'Save Invoice'}
          </Button>
        </div>
      </div>
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
