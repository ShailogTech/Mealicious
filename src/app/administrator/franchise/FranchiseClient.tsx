'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Franchise extends ErpRow { id: string; name: string; city: string; owner: string; royaltyDue: number; status: string }

const CITIES = ['Salem', 'Chennai', 'Coimbatore', 'Bengaluru', 'Hyderabad', 'Madurai', 'Erode', 'Trichy', 'Pune', 'Mumbai']
const STATUSES = ['Active', 'Setup Pending']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Store' },
  { key: 'city', label: 'City' },
  { key: 'owner', label: 'Owner' },
  { key: 'royaltyDue', label: 'Royalty Due', type: 'inr' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Store Name', type: 'text', required: true },
  { key: 'city', label: 'City', type: 'select', options: CITIES },
  { key: 'owner', label: 'Franchise Owner', type: 'text' },
  { key: 'royaltyDue', label: 'Royalty Due (₹)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
]

export function FranchiseClient({ franchise }: { franchise: Franchise[] }) {
  const [rows, setRows] = useState<Franchise[]>(franchise)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Franchise | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Franchise); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const f = row as Franchise
    if (!confirm(`Delete franchise "${f.name}"?`)) return
    const res = await fetch(`/api/administrator/franchise/${f.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== f.id)); toast.success('Franchise deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/franchise/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { franchise } = await res.json(); setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...franchise } : x))); toast.success('Franchise updated') }
      else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/franchise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { franchise } = await res.json(); setRows((r) => [franchise, ...r]); toast.success('Franchise added') }
      else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Franchise" description="Franchise stores with royalty tracking." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Store" emptyMessage="No franchise stores yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Store' : 'Add Store'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
