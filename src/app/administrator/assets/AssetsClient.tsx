'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import { ErpExportButtons } from '@/components/administrator/ErpExportButtons'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Asset extends ErpRow {
  id: string; name: string; type: string; assignedTo: string; status: string; purchaseDate: string; warrantyExpiry: string
}

const TYPES = ['Machinery', 'Vehicle', 'IT Equipment', 'Furniture']
const STATUSES = ['In Use', 'Under Maintenance', 'Idle']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Asset' },
  { key: 'type', label: 'Type', type: 'badge' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'warrantyExpiry', label: 'Warranty Expiry' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Asset Name', type: 'text', required: true },
  { key: 'type', label: 'Type', type: 'select', options: TYPES },
  { key: 'assignedTo', label: 'Assigned To', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
  { key: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
]

export function AssetsClient({ assets, canExport }: { assets: Asset[]; canExport?: boolean }) {
  const [rows, setRows] = useState<Asset[]>(assets)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Asset); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const a = row as Asset
    if (!confirm(`Delete asset "${a.name}"?`)) return
    const res = await fetch(`/api/administrator/assets/${a.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== a.id)); toast.success('Asset deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    const mapDates = (a: Record<string, unknown>): Asset => ({
      ...(a as unknown as Asset),
      purchaseDate: a.purchaseDate ? new Date(a.purchaseDate as string).toISOString().slice(0, 10) : '',
      warrantyExpiry: a.warrantyExpiry ? new Date(a.warrantyExpiry as string).toISOString().slice(0, 10) : '',
    })
    if (editing) {
      const res = await fetch(`/api/administrator/assets/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { asset } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? mapDates(asset) : x)))
        toast.success('Asset updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/assets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { asset } = await res.json()
        setRows((r) => [mapDates(asset), ...r])
        toast.success('Asset added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Assets" description="Company assets with assignment and warranty tracking." action={<ErpExportButtons model="assets" canExport={!!canExport} />} />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Asset" emptyMessage="No assets recorded yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Asset' : 'Add Asset'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
