export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { PurchaseClient } from './PurchaseClient'

async function getData() {
  const orders = await db.erpPurchaseOrder.findMany({ orderBy: { date: 'desc' } })
  return {
    purchaseOrders: orders.map((p) => ({
      id: p.id, vendor: p.vendor, amount: p.amount, status: p.status,
      date: p.date.toISOString().slice(0, 10),
    })),
  }
}

export default async function PurchasePage() {
  await requireErpPageUser()
  const { purchaseOrders } = await getData()
  return <PurchaseClient purchaseOrders={purchaseOrders} />
}
