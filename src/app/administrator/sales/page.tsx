export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { SalesClient } from './SalesClient'

async function getData() {
  const sales = await db.erpSalesOrder.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    sales: sales.map((s) => ({
      id: s.id, customer: s.customer, product: s.product, qty: s.qty,
      amount: s.amount, channel: s.channel, status: s.status,
    })),
  }
}

export default async function SalesPage() {
  await requireErpPageUser()
  const { sales } = await getData()
  return <SalesClient sales={sales} />
}
