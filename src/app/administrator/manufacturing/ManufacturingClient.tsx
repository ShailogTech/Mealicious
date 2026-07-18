'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface ProductionOrder extends ErpRow {
  id: string; product: string; qty: number; machine: string; status: string; endDate: string
}

const PRODUCTS = [
  'Roasted Makhana - Peri Peri', 'Roasted Makhana - Classic Salted', 'Ragi Chips',
  'Millet Cookies - Jaggery', 'Protein Energy Bar - Almond', 'Protein Energy Bar - Cranberry',
  'Baked Banana Chips', 'Multigrain Namkeen', 'Roasted Chana Mix', 'Beetroot Chips',
  'Quinoa Puffs', 'Foxnut Trail Mix', 'Amaranth Laddoo', 'Sprouted Moong Snack', 'Coconut Jaggery Bites',
]
const MACHINES = ['Roaster-1', 'Roaster-2', 'Packing Line A', 'Packing Line B', 'Mixer-1']
const STATUSES = ['Scheduled', 'In Progress', 'Completed', 'QC Hold']

const COLUMNS: ErpColumn[] = [
  { key: 'product', label: 'Product' },
  { key: 'qty', label: 'Qty', type: 'number' },
  { key: 'machine', label: 'Machine' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'endDate', label: 'Target End' },
]

const FIELDS: ErpField[] = [
  { key: 'product', label: 'Product', type: 'select', options: PRODUCTS, required: true },
  { key: 'qty', label: 'Quantity', type: 'number', required: true },
  { key: 'machine', label: 'Machine / Line', type: 'select', options: MACHINES },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'endDate', label: 'Target End Date', type: 'date' },
]

export function ManufacturingClient({ productionOrders }: { productionOrders: ProductionOrder[] }) {
  const [rows, setRows] = useState<ProductionOrder[]>(productionOrders)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<ProductionOrder | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as ProductionOrder); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const o = row as ProductionOrder
    if (!confirm(`Delete production order for "${o.product}"?`)) return
    const res = await fetch(`/api/administrator/manufacturing/${o.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== o.id)); toast.success('Order deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/manufacturing/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { productionOrder } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? {
          ...x, ...productionOrder,
          endDate: productionOrder.endDate ? new Date(productionOrder.endDate).toISOString().slice(0, 10) : '',
        } : x)))
        toast.success('Order updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/manufacturing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { productionOrder } = await res.json()
        const mapped = {
          ...productionOrder,
          endDate: productionOrder.endDate ? new Date(productionOrder.endDate).toISOString().slice(0, 10) : '',
        }
        setRows((r) => [mapped, ...r])
        toast.success('Order added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Manufacturing" description="Production orders across machine lines." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Order" emptyMessage="No production orders yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Order' : 'Add Order'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
