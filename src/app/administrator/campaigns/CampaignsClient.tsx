'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import { ErpExportButtons } from '@/components/administrator/ErpExportButtons'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Campaign extends ErpRow {
  id: string; name: string; channel: string; budget: number; leads: number; roi: string; status: string
}

const CHANNELS = ['Instagram', 'Google Ads', 'Email', 'WhatsApp', 'Influencer']
const STATUSES = ['Live', 'Completed', 'Planned']

const COLUMNS: ErpColumn[] = [
  { key: 'name', label: 'Campaign' },
  { key: 'channel', label: 'Channel', type: 'badge' },
  { key: 'budget', label: 'Budget', type: 'inr' },
  { key: 'leads', label: 'Leads', type: 'number' },
  { key: 'roi', label: 'ROI' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const FIELDS: ErpField[] = [
  { key: 'name', label: 'Campaign Name', type: 'text', required: true },
  { key: 'channel', label: 'Channel', type: 'select', options: CHANNELS },
  { key: 'budget', label: 'Budget (₹)', type: 'number' },
  { key: 'leads', label: 'Leads', type: 'number' },
  { key: 'roi', label: 'ROI (e.g. 2.5x)', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
]

export function CampaignsClient({ campaigns, canExport }: { campaigns: Campaign[]; canExport?: boolean }) {
  const [rows, setRows] = useState<Campaign[]>(campaigns)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Campaign); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const c = row as Campaign
    if (!confirm(`Delete campaign "${c.name}"?`)) return
    const res = await fetch(`/api/administrator/campaigns/${c.id}`, { method: 'DELETE' })
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== c.id)); toast.success('Campaign deleted') }
    else { toast.error('Delete failed') }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/campaigns/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { campaign } = await res.json(); setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...campaign } : x))); toast.success('Campaign updated') }
      else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) { const { campaign } = await res.json(); setRows((r) => [campaign, ...r]); toast.success('Campaign added') }
      else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Campaigns" description="Marketing campaigns with budget, leads, and ROI." action={<ErpExportButtons model="campaigns" canExport={!!canExport} />} />
      <ErpDataTable columns={COLUMNS} rows={rows} onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete} addLabel="Add Campaign" emptyMessage="No campaigns yet." />
      <ErpFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Campaign' : 'Add Campaign'} fields={FIELDS} initial={editing} onSubmit={handleSubmit} />
    </div>
  )
}
