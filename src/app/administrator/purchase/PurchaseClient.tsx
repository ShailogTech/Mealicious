'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface PurchaseOrder extends ErpRow {
  id: string; vendor: string; amount: number; status: string; date: string
}

const STATUSES = ['Received', 'Pending Approval', 'In Transit', 'Rejected']

const COLUMNS: ErpColumn[] = [
  { key: 'vendor', label: 'Vendor' },
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount', type: 'inr' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const FIELDS: ErpField[] = [
  { key: 'vendor', label: 'Vendor', type: 'text', required: true },
  { key: 'amount', label: 'Amount (₹)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'date', label: 'Date', type: 'date' },
]

export function PurchaseClient({ purchaseOrders }: { purchaseOrders: PurchaseOrder[] }) {
  const [rows, setRows] = useState<PurchaseOrder[]>(purchaseOrders)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as PurchaseOrder); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const p = row as PurchaseOrder
    if (!confirm(`Delete purchase order for "${p.vendor}"?`)) return
    const res = await fetch(`/api/administrator/purchase/${p.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== p.id)); toast.success('Order deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/purchase/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { purchaseOrder } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...purchaseOrder, date: new Date(purchaseOrder.date).toISOString().slice(0, 10) } : x)))
        toast.success('Order updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { purchaseOrder } = await res.json()
        setRows((r) => [{ ...purchaseOrder, date: new Date(purchaseOrder.date).toISOString().slice(0, 10) }, ...r])
        toast.success('Order added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Purchase Orders" description="Orders raised against vendors." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Order" emptyMessage="No purchase orders yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Order' : 'Add Order'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
