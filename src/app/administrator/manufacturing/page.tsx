export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { ManufacturingClient } from './ManufacturingClient'

async function getData() {
  const orders = await db.erpProductionOrder.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    productionOrders: orders.map((o) => ({
      id: o.id, product: o.product, qty: o.qty, machine: o.machine, status: o.status,
      endDate: o.endDate ? o.endDate.toISOString().slice(0, 10) : '',
    })),
  }
}

export default async function ManufacturingPage() {
  const user = await requireErpPageUser()
  const { productionOrders } = await getData()
  return <ManufacturingClient productionOrders={productionOrders} canExport={user.role === 'SUPER_ADMIN'} />
}
