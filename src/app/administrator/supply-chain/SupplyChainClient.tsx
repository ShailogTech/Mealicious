'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import { ErpExportButtons } from '@/components/administrator/ErpExportButtons'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Shipment extends ErpRow {
  id: string; from: string; to: string; vehicle: string; status: string; eta: string
}

const ORIGINS = ['Salem Factory', 'Coimbatore Warehouse', 'Chennai Hub']
const CITIES = ['Salem', 'Chennai', 'Coimbatore', 'Bengaluru', 'Hyderabad', 'Madurai', 'Erode', 'Trichy', 'Pune', 'Mumbai']
const STATUSES = ['Dispatched', 'In Transit', 'Delivered', 'Delayed']

const COLUMNS: ErpColumn[] = [
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'eta', label: 'ETA' },
]

const FIELDS: ErpField[] = [
  { key: 'from', label: 'Origin', type: 'select', options: ORIGINS, required: true },
  { key: 'to', label: 'Destination', type: 'select', options: CITIES, required: true },
  { key: 'vehicle', label: 'Vehicle No.', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'eta', label: 'ETA', type: 'date' },
]

export function SupplyChainClient({ shipments, canExport }: { shipments: Shipment[]; canExport?: boolean }) {
  const [rows, setRows] = useState<Shipment[]>(shipments)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Shipment | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Shipment); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const s = row as Shipment
    if (!confirm(`Delete shipment ${s.from} → ${s.to}?`)) return
    const res = await fetch(`/api/administrator/supply-chain/${s.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== s.id)); toast.success('Shipment deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/supply-chain/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { shipment } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? {
          ...x, ...shipment,
          eta: shipment.eta ? new Date(shipment.eta).toISOString().slice(0, 10) : '',
        } : x)))
        toast.success('Shipment updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/supply-chain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { shipment } = await res.json()
        const mapped = { ...shipment, eta: shipment.eta ? new Date(shipment.eta).toISOString().slice(0, 10) : '' }
        setRows((r) => [mapped, ...r])
        toast.success('Shipment added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Supply Chain" description="Shipments between facilities." action={<ErpExportButtons model="supplychain" canExport={!!canExport} />} />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Shipment" emptyMessage="No shipments yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Shipment' : 'Add Shipment'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
