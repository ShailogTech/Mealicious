'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Sale extends ErpRow {
  id: string; customer: string; product: string; qty: number; amount: number; channel: string; status: string
}

const CHANNELS = ['Website', 'Amazon', 'Flipkart', 'Retail Store', 'Distributor', 'Modern Trade']
const STATUSES = ['Completed', 'Pending', 'Processing', 'Cancelled']

const COLUMNS: ErpColumn[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'product', label: 'Product' },
  { key: 'qty', label: 'Qty', type: 'number' },
  { key: 'amount', label: 'Amount', type: 'inr' },
  { key: 'channel', label: 'Channel' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const FIELDS: ErpField[] = [
  { key: 'customer', label: 'Customer', type: 'text', required: true },
  { key: 'product', label: 'Product', type: 'text' },
  { key: 'qty', label: 'Quantity', type: 'number' },
  { key: 'amount', label: 'Amount (₹)', type: 'number' },
  { key: 'channel', label: 'Channel', type: 'select', options: CHANNELS },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
]

export function SalesClient({ sales }: { sales: Sale[] }) {
  const [rows, setRows] = useState<Sale[]>(sales)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Sale | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Sale); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const s = row as Sale
    if (!confirm(`Delete sale to "${s.customer}"?`)) return
    const res = await fetch(`/api/administrator/sales/${s.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== s.id)); toast.success('Sale deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/sales/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { sale } = await res.json(); setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...sale } : x))); toast.success('Sale updated') }
      else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/sales', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { sale } = await res.json(); setRows((r) => [sale, ...r]); toast.success('Sale added') }
      else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Sales & POS" description="Sales orders across all channels." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Sale" emptyMessage="No sales recorded yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Sale' : 'Add Sale'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
