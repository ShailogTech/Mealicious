'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Lead extends ErpRow {
  id: string; name: string; company: string; stage: string; value: number; owner: string
}

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Contact' },
  { key: 'company', label: 'Company' },
  { key: 'stage', label: 'Stage', type: 'badge' },
  { key: 'value', label: 'Deal Value', type: 'inr' },
  { key: 'owner', label: 'Owner' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Contact Name', type: 'text', required: true },
  { key: 'company', label: 'Company', type: 'text' },
  { key: 'stage', label: 'Stage', type: 'select', options: STAGES },
  { key: 'value', label: 'Deal Value (₹)', type: 'number' },
  { key: 'owner', label: 'Owner', type: 'text' },
]

export function CrmClient({ leads }: { leads: Lead[] }) {
  const [rows, setRows] = useState<Lead[]>(leads)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Lead); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const l = row as Lead
    if (!confirm(`Delete lead "${l.name}"?`)) return
    const res = await fetch(`/api/administrator/crm/${l.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== l.id)); toast.success('Lead deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/crm/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { lead } = await res.json(); setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...lead } : x))); toast.success('Lead updated') }
      else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/crm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { lead } = await res.json(); setRows((r) => [lead, ...r]); toast.success('Lead added') }
      else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="CRM / Leads" description="Sales pipeline contacts and deal stages." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Lead" emptyMessage="No leads yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Lead' : 'Add Lead'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
