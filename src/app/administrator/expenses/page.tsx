export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { ExpensesClient } from './ExpensesClient'

async function getData() {
  const rows = await db.erpExpense.findMany({ orderBy: { date: 'desc' } })
  return {
    expenses: rows.map((e) => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      date: e.date.toISOString().slice(0, 10),
      vendor: e.vendor ?? '',
      paymentMode: e.paymentMode,
      status: e.status,
      documentUrl: e.documentUrl ?? '',
      documentName: e.documentName ?? '',
      createdBy: e.createdBy ?? '',
    })),
  }
}

export default async function ExpensesPage() {
  const user = await requireErpPageUser()
  const { expenses } = await getData()
  return <ExpensesClient expenses={expenses} canExport={user.role === 'SUPER_ADMIN'} />
}
