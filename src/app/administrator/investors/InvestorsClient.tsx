'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Investor extends ErpRow {
  id: string; name: string; stake: string; investedAmount: number; lastUpdate: string
}

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Investor' },
  { key: 'stake', label: 'Stake', type: 'badge' },
  { key: 'investedAmount', label: 'Invested', type: 'inr' },
  { key: 'lastUpdate', label: 'Last Update' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Investor Name', type: 'text', required: true },
  { key: 'stake', label: 'Stake (e.g. 5%)', type: 'text' },
  { key: 'investedAmount', label: 'Invested Amount (₹)', type: 'number' },
  { key: 'lastUpdate', label: 'Last Update', type: 'date' },
]

export function InvestorsClient({ investors }: { investors: Investor[] }) {
  const [rows, setRows] = useState<Investor[]>(investors)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Investor | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Investor); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const i = row as Investor
    if (!confirm(`Delete investor "${i.name}"?`)) return
    const res = await fetch(`/api/administrator/investors/${i.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== i.id)); toast.success('Investor deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/investors/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { investor } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? {
          ...x, ...investor,
          lastUpdate: investor.lastUpdate ? new Date(investor.lastUpdate).toISOString().slice(0, 10) : '',
        } : x)))
        toast.success('Investor updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/investors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { investor } = await res.json()
        setRows((r) => [{
          ...investor,
          lastUpdate: investor.lastUpdate ? new Date(investor.lastUpdate).toISOString().slice(0, 10) : '',
        }, ...r])
        toast.success('Investor added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Investors" description="Stakeholders with investment and stake tracking." />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Investor" emptyMessage="No investors recorded yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Investor' : 'Add Investor'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
