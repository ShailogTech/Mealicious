'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Vendor extends ErpRow {
  id: string; name: string; type: string; city: string; rating: number; status: string; outstanding: number
}

const TYPES = ['Raw Material', 'Packaging', 'Logistics', 'Co-Packer', 'Ingredient Importer']
const CITIES = ['Salem', 'Chennai', 'Coimbatore', 'Bengaluru', 'Hyderabad', 'Madurai', 'Erode', 'Trichy', 'Pune', 'Mumbai']
const STATUSES = ['Active', 'Under Review']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Vendor' },
  { key: 'type', label: 'Type', type: 'badge' },
  { key: 'city', label: 'City' },
  { key: 'rating', label: 'Rating', type: 'number' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'outstanding', label: 'Outstanding', type: 'inr' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Vendor Name', type: 'text', required: true },
  { key: 'type', label: 'Type', type: 'select', options: TYPES },
  { key: 'city', label: 'City', type: 'select', options: CITIES },
  { key: 'rating', label: 'Rating (0-5)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'outstanding', label: 'Outstanding Amount (₹)', type: 'number' },
]

export function VendorsClient({ vendors }: { vendors: Vendor[] }) {
  const [rows, setRows] = useState<Vendor[]>(vendors)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Vendor); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const v = row as Vendor
    if (!confirm(`Delete vendor "${v.name}"?`)) return
    const res = await fetch(`/api/administrator/vendors/${v.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== v.id)); toast.success('Vendor deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/vendors/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { vendor } = await res.json(); setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...vendor } : x))); toast.success('Vendor updated') }
      else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/vendors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { vendor } = await res.json(); setRows((r) => [vendor, ...r]); toast.success('Vendor added') }
      else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Vendor Portal" description="Suppliers with outstanding balances and status." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Vendor" emptyMessage="No vendors yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Vendor' : 'Add Vendor'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
