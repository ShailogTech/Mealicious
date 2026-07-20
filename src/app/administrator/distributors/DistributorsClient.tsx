'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Distributor extends ErpRow {
  id: string; name: string; city: string; territory: string; targetAchieved: number; status: string
}

const CITIES = ['Salem', 'Chennai', 'Coimbatore', 'Bengaluru', 'Hyderabad', 'Madurai', 'Erode', 'Trichy', 'Pune', 'Mumbai']
const STATUSES = ['Active', 'Probation']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Distributor' },
  { key: 'city', label: 'City' },
  { key: 'territory', label: 'Territory' },
  { key: 'targetAchieved', label: 'Target Achieved', type: 'number' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Distributor Name', type: 'text', required: true },
  { key: 'city', label: 'City', type: 'select', options: CITIES },
  { key: 'territory', label: 'Territory', type: 'text' },
  { key: 'targetAchieved', label: 'Target Achieved (%)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
]

export function DistributorsClient({ distributors }: { distributors: Distributor[] }) {
  const [rows, setRows] = useState<Distributor[]>(distributors)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Distributor | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Distributor); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const d = row as Distributor
    if (!confirm(`Delete distributor "${d.name}"?`)) return
    const res = await fetch(`/api/administrator/distributors/${d.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== d.id)); toast.success('Distributor deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/distributors/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { distributor } = await res.json(); setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...distributor } : x))); toast.success('Distributor updated') }
      else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/distributors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { distributor } = await res.json(); setRows((r) => [distributor, ...r]); toast.success('Distributor added') }
      else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Distributor Portal" description="Distribution partners with territory and targets." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Distributor" emptyMessage="No distributors yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Distributor' : 'Add Distributor'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
