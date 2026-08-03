'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ExternalLink } from 'lucide-react'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpExportButtons } from '@/components/administrator/ErpExportButtons'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ErpColumn, ErpRow } from '@/components/administrator/erp-crud-types'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  vendor: string
  paymentMode: string
  status: string
  documentUrl: string
  documentName: string
  createdBy: string
}

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque']
const STATUSES = ['Pending', 'Approved', 'Paid', 'Rejected']

const COLUMNS: ErpColumn[] = [
  { key: 'date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', type: 'inr' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'status', label: 'Status' },
  { key: 'document', label: 'Document' },
]

function statusClasses(status: string): string {
  switch (status) {
    case 'Approved': return 'border-transparent bg-blue-100 text-blue-800'
    case 'Paid': return 'border-transparent bg-green-100 text-green-800'
    case 'Rejected': return 'border-transparent bg-red-100 text-red-800'
    case 'Pending':
    default: return 'border-transparent bg-amber-100 text-amber-800'
  }
}

export function ExpensesClient({ expenses, canExport }: { expenses: Expense[]; canExport?: boolean }) {
  const [rows, setRows] = useState<Expense[]>(expenses)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add-expense form state
  const [fCategory, setFCategory] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fAmount, setFAmount] = useState('')
  const [fVendor, setFVendor] = useState('')
  const [fPaymentMode, setFPaymentMode] = useState('Bank Transfer')
  const [fDate, setFDate] = useState('')
  const [fFile, setFFile] = useState<File | null>(null)

  function resetForm() {
    setFCategory(''); setFDescription(''); setFAmount(''); setFVendor('')
    setFPaymentMode('Bank Transfer'); setFDate(''); setFFile(null)
    const fi = document.getElementById('expense-file') as HTMLInputElement | null
    if (fi) fi.value = ''
  }

  async function handleAdd() {
    if (!fCategory.trim()) { toast.error('Category is required'); return }
    if (!fDescription.trim()) { toast.error('Description is required'); return }
    const amount = Number(fAmount)
    if (!amount || amount <= 0) { toast.error('A valid amount is required'); return }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('category', fCategory)
      fd.append('description', fDescription)
      fd.append('amount', String(amount))
      fd.append('vendor', fVendor)
      fd.append('paymentMode', fPaymentMode)
      if (fDate) fd.append('date', fDate)
      if (fFile) fd.append('file', fFile)

      const res = await fetch('/api/administrator/expenses', { method: 'POST', body: fd })
      if (res.ok) {
        const { expense } = await res.json()
        setRows((r) => [{
          id: expense.id,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          date: new Date(expense.date).toISOString().slice(0, 10),
          vendor: expense.vendor ?? '',
          paymentMode: expense.paymentMode,
          status: expense.status,
          documentUrl: expense.documentUrl ?? '',
          documentName: expense.documentName ?? '',
          createdBy: expense.createdBy ?? '',
        }, ...r])
        toast.success('Expense added')
        setAddOpen(false)
        resetForm()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Add failed')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(e: Expense, status: string) {
    const res = await fetch(`/api/administrator/expenses/${e.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setRows((r) => r.map((x) => (x.id === e.id ? { ...x, status } : x)))
      toast.success(`Marked ${status}`)
    } else { toast.error('Update failed') }
  }

  async function handleDelete(row: ErpRow) {
    const e = row as Expense
    if (!confirm(`Delete expense "${e.description}"?`)) return
    const res = await fetch(`/api/administrator/expenses/${e.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== e.id)); toast.success('Expense deleted') }
    else { toast.error('Delete failed') }
  }

  function renderCell(column: ErpColumn, row: ErpRow): React.ReactNode {
    const e = row as Expense
    if (column.key === 'status') {
      return (
        <Select value={e.status} onValueChange={(v) => handleStatusChange(e, v)}>
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      )
    }
    if (column.key === 'document') {
      if (!e.documentUrl) return <span className="text-stone-400 text-xs">—</span>
      return (
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild title={e.documentName || 'View document'}>
          <a href={e.documentUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" /> View
          </a>
        </Button>
      )
    }
    if (column.key === 'vendor') {
      return e.vendor ? <span>{e.vendor}</span> : <span className="text-stone-400">—</span>
    }
    // Other columns fall back to the default cell renderer (returns null here).
    return null
  }

  return (
    <div>
      <ErpPageHeader
        title="Expense Monitoring"
        description="Track bills, invoices, and reimbursements with status workflow."
        action={
          <div className="flex items-center gap-2">
            <ErpExportButtons model="expenses" canExport={!!canExport} />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
        }
      />

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.map((s) => (
          <Badge key={s} className={statusClasses(s)}>{s}</Badge>
        ))}
      </div>

      <ErpDataTable
        columns={COLUMNS}
        rows={rows as unknown as ErpRow[]}
        onDelete={handleDelete}
        renderCell={renderCell}
        addLabel="Add Expense"
        emptyMessage="No expenses recorded yet."
      />

      {/* Add Expense dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Input value={fCategory} onChange={(e) => setFCategory(e.target.value)} placeholder="e.g. Travel, Office Supplies" />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="What was this expense for?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                <Input type="number" value={fAmount} onChange={(e) => setFAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vendor</Label>
                <Input value={fVendor} onChange={(e) => setFVendor(e.target.value)} placeholder="Vendor name" />
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
            </div>
            <div className="space-y-1.5">
              <Label>Bill / Invoice Document</Label>
              <Input id="expense-file" type="file" onChange={(e) => setFFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-stone-400">Optional — upload the bill or invoice for this expense.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetForm() }} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : <><Plus className="h-4 w-4" /> Add</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
