'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import { ErpDataTable } from '@/components/administrator/ErpDataTable'
import { ErpFormDrawer } from '@/components/administrator/ErpFormDrawer'
import type { ErpColumn, ErpField, ErpRow } from '@/components/administrator/erp-crud-types'

interface Transaction extends ErpRow {
  id: string
  type: string
  category: string
  amount: number
  account: string
  note: string
  date: string
}

const ACCOUNTS = ['Axis Bank - Current', 'HDFC - Savings', 'Cash']
const TYPES = ['Income', 'Expense']

const COLUMNS: ErpColumn[] = [
  { key: 'date', label: 'Date' },
  { key: 'type', label: 'Type', type: 'badge' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount', type: 'inr' },
  { key: 'account', label: 'Account' },
]

const FIELDS: ErpField[] = [
  { key: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
  { key: 'category', label: 'Category', type: 'text', required: true },
  { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
  { key: 'account', label: 'Account', type: 'select', options: ACCOUNTS, required: true },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'note', label: 'Note', type: 'textarea' },
]

export function FinanceClient({ transactions }: { transactions: Transaction[] }) {
  const [rows, setRows] = useState<Transaction[]>(transactions)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  function openCreate() { setEditing(null); setDrawerOpen(true) }
  function openEdit(row: ErpRow) { setEditing(row as Transaction); setDrawerOpen(true) }

  async function handleDelete(row: ErpRow) {
    const t = row as Transaction
    if (!confirm(`Delete this ${t.type.toLowerCase()} of ₹${t.amount}?`)) return
    const res = await fetch(`/api/administrator/finance/${t.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRows((r) => r.filter((x) => x.id !== t.id))
      toast.success('Transaction deleted')
    } else {
      toast.error('Delete failed')
    }
  }

  async function handleSubmit(values: ErpRow) {
    if (editing) {
      const res = await fetch(`/api/administrator/finance/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { transaction } = await res.json()
        setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...transaction, date: new Date(transaction.date).toISOString().slice(0, 10) } : x)))
        toast.success('Transaction updated')
      } else { toast.error('Update failed') }
    } else {
      const res = await fetch('/api/administrator/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      })
      if (res.ok) {
        const { transaction } = await res.json()
        setRows((r) => [{ ...transaction, date: new Date(transaction.date).toISOString().slice(0, 10) }, ...r])
        toast.success('Transaction added')
      } else { toast.error('Add failed') }
    }
  }

  return (
    <div>
      <ErpPageHeader title="Finance" description="Income and expense transactions." />
      <ErpDataTable
        columns={COLUMNS}
        rows={rows}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Add Transaction"
        emptyMessage="No transactions yet."
      />
      <ErpFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? 'Edit Transaction' : 'Add Transaction'}
        fields={FIELDS}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
