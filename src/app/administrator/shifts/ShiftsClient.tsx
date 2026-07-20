'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Shift extends ErpRow {
  id: string
  name: string
  start: string
  end: string
  type: string
}

const TYPES = ['Standard', 'Rotational', 'Remote', 'Flexible', 'Custom']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Shift' },
  { key: 'start', label: 'Start' },
  { key: 'end', label: 'End' },
  { key: 'type', label: 'Type', type: 'badge' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Shift Name', type: 'text', required: true },
  { key: 'start', label: 'Start Time', type: 'text', required: true, help: 'e.g. 09:00 or "Flexible"' },
  { key: 'end', label: 'End Time', type: 'text', required: true },
  { key: 'type', label: 'Type', type: 'select', options: TYPES },
]

export function ShiftsClient({ shifts }: { shifts: Shift[] }) {
  const [rows, setRows] = useState<Shift[]>(shifts)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Shift | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Shift); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const s = row as Shift
    if (!confirm(`Delete shift "${s.name}"?`)) return
    const res = await fetch(`/api/administrator/shifts/${s.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== s.id))
      toast.success('Shift deleted')
    } else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/shifts/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { shift } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...shift } : x)))
        toast.success('Shift updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/shifts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { shift } = await res.json()
        setRows((r) => [...r, shift])
        toast.success('Shift added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Work Schedules" description="Shift templates used across departments." />
      <ErpDataTable
        columns={COLUMNS}
        rows={rows}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Shift"
        emptyMessage="No shifts defined yet."
      />
      <ErpFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? 'Edit Shift' : 'Add Shift'}
        fields={FIELDS}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
