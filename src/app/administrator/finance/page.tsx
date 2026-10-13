export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { FinanceClient } from './FinanceClient'

async function getData() {
  const transactions = await db.erpTransaction.findMany({ orderBy: { date: 'desc' } })
  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      category: t.category,
      amount: t.amount,
      account: t.account,
      note: t.note ?? '',
      date: t.date.toISOString().slice(0, 10),
    })),
  }
}

export default async function FinancePage() {
  const user = await requireErpPageUser()
  const { transactions } = await getData()
  return <FinanceClient transactions={transactions} canExport={user.role === 'SUPER_ADMIN'} />
}
