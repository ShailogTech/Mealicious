'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Pencil } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Discount {
  id: string
  code: string
  type: string // prepaid | percent | flat
  value: number
  minOrder: number
  maxDiscount: number | null
  isActive: boolean
  description: string
}

const TYPES = ['prepaid', 'percent', 'flat']

const TYPE_LABEL: Record<string, string> = {
  prepaid: 'Prepaid (auto, online)',
  percent: 'Coupon (% off)',
  flat: 'Coupon (₹ off)',
}

function formatValue(d: Discount): string {
  if (d.type === 'prepaid' || d.type === 'percent') return `${d.value}%`
  return `₹${d.value}`
}

export function DiscountsClient({ discounts }: { discounts: Discount[] }) {
  const [rows, setRows] = useState<Discount[]>(discounts)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [type, setType] = useState('percent')
  const [value, setValue] = useState('10')
  const [minOrder, setMinOrder] = useState('0')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [description, setDescription] = useState('')

  function resetForm() {
    setCode(''); setType('percent'); setValue('10'); setMinOrder('0')
    setMaxDiscount(''); setIsActive(true); setDescription('')
  }

  function openCreate() {
    setEditing(null); resetForm(); setDrawerOpen(true)
  }

  function openEdit(d: Discount) {
    setEditing(d)
    setCode(d.code); setType(d.type); setValue(String(d.value)); setMinOrder(String(d.minOrder))
    setMaxDiscount(d.maxDiscount != null ? String(d.maxDiscount) : '')
    setIsActive(d.isActive); setDescription(d.description); setDrawerOpen(true)
  }

  async function handleSubmit() {
    const payload = {
      code,
      type,
      value: Number(value) || 0,
      minOrder: Number(minOrder) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      isActive,
      description: description || null,
    }
    if (!code.trim()) { toast.error('Code is required'); return }
    if (editing) {
      const res = await fetch(`/api/admin/discounts/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (res.ok) {
        const { discount } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...discount, description: discount.description ?? '' } : x)))
        toast.success('Discount updated')
        setDrawerOpen(false)
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (res.ok) {
        const { discount } = await res.json()
        setRows((r) => [...r, { ...discount, description: discount.description ?? '' }])
        toast.success('Discount created')
        setDrawerOpen(false)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Create failed')
      }
    }
  }

  async function handleToggle(d: Discount) {
    const res = await fetch(`/api/admin/discounts/${d.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !d.isActive }),
    })
    if (res.ok) {
      setRows((r) => r.map((x) => (x.id === d.id ? { ...x, isActive: !d.isActive } : x)))
      toast.success(`${d.code} ${d.isActive ? 'disabled' : 'enabled'}`)
    }
  }

  async function handleDelete(d: Discount) {
    if (!confirm(`Delete discount "${d.code}"?`)) return
    const res = await fetch(`/api/admin/discounts/${d.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== d.id)); toast.success('Discount deleted') }
    else { toast.error('Delete failed') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-neutral-500">
          {rows.length} discount{rows.length === 1 ? '' : 's'} · manages coupons + the prepaid auto-discount
        </p>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Discount</Button>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-neutral-500">No discounts yet.</CardContent></Card>
        ) : rows.map((d) => (
          <Card key={d.id} className={!d.isActive ? 'opacity-60' : ''}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{d.code}</span>
                  <Badge variant="secondary">{TYPE_LABEL[d.type] ?? d.type}</Badge>
                  {!d.isActive && <Badge variant="outline">Disabled</Badge>}
                </div>
                <p className="text-sm text-neutral-600 mt-1">
                  <b>{formatValue(d)}</b> off
                  {d.minOrder > 0 && ` · min ₹${d.minOrder}`}
                  {d.maxDiscount != null && ` · max ₹${d.maxDiscount}`}
                </p>
                {d.description && <p className="text-xs text-neutral-400 mt-0.5">{d.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={d.isActive} onCheckedChange={() => handleToggle(d)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(d)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Discount' : 'Add Discount'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20 or PREPAID10" disabled={!!editing} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value {type === 'flat' ? '(₹)' : '(%)'}</Label>
                <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Order (₹)</Label>
                <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Discount (₹, optional)</Label>
                <Input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No cap" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="is-active" />
              <Label htmlFor="is-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
