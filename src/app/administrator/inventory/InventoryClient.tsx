'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface InventoryItem extends ErpRow {
  id: string
  name: string
  category: string
  hsn: string
  sku: string
  stock: number
  reorderLevel: number
  price: number
  gstPct: number
}

const CATEGORIES = ['Makhana', 'Chips', 'Combo', 'Snacks', 'Other']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Stock', type: 'number' },
  { key: 'reorderLevel', label: 'Reorder Level', type: 'number' },
  { key: 'price', label: 'Price', type: 'inr' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Product Name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: true },
  { key: 'hsn', label: 'HSN Code', type: 'text' },
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'stock', label: 'Stock Qty', type: 'number', required: true },
  { key: 'reorderLevel', label: 'Reorder Level', type: 'number' },
  { key: 'price', label: 'Price (₹, GST incl.)', type: 'number', required: true },
  { key: 'gstPct', label: 'GST %', type: 'number' },
]

export function InventoryClient({ items }: { items: InventoryItem[] }) {
  const [rows, setRows] = useState<InventoryItem[]>(items)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as InventoryItem); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const it = row as InventoryItem
    if (!confirm(`Delete "${it.name}" from inventory?`)) return
    const res = await fetch(`/api/administrator/inventory/${it.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== it.id))
      toast.success('Item deleted')
    } else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/inventory/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { item } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...item } : x)))
        toast.success('Item updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/inventory', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { item } = await res.json()
        setRows((r) => [item, ...r])
        toast.success('Item added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Inventory" description="Stock-keeping units, stock levels, and reorder points." />
      <ErpDataTable
        columns={COLUMNS}
        rows={rows}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Item"
        emptyMessage="No inventory items yet."
      />
      <ErpFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? 'Edit Item' : 'Add Item'}
        fields={FIELDS}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
