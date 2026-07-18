'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface RetailStore extends ErpRow {
  id: string; name: string; city: string; manager: string; monthlySales: number; status: string
}

const CITIES = ['Salem', 'Chennai', 'Coimbatore', 'Bengaluru', 'Hyderabad', 'Madurai', 'Erode', 'Trichy', 'Pune', 'Mumbai']
const STATUSES = ['Active', 'Under Review']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Store' },
  { key: 'city', label: 'City' },
  { key: 'manager', label: 'Manager' },
  { key: 'monthlySales', label: 'Monthly Sales', type: 'inr' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Store Name', type: 'text', required: true },
  { key: 'city', label: 'City', type: 'select', options: CITIES },
  { key: 'manager', label: 'Manager', type: 'text' },
  { key: 'monthlySales', label: 'Monthly Sales (₹)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
]

export function RetailClient({ retail }: { retail: RetailStore[] }) {
  const [rows, setRows] = useState<RetailStore[]>(retail)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<RetailStore | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as RetailStore); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const s = row as RetailStore
    if (!confirm(`Delete store "${s.name}"?`)) return
    const res = await fetch(`/api/administrator/retail/${s.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== s.id)); toast.success('Store deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/retail/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { retail } = await res.json(); setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...retail } : x))); toast.success('Store updated') }
      else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/retail', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { retail } = await res.json(); setRows((r) => [retail, ...r]); toast.success('Store added') }
      else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Retail Stores" description="Company-owned retail outlets." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Store" emptyMessage="No retail stores yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Store' : 'Add Store'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
