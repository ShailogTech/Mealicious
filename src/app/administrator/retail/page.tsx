export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { RetailClient } from './RetailClient'

async function getData() {
  const rows = await db.erpRetailStore.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    retail: rows.map((r) => ({
      id: r.id, name: r.name, city: r.city, manager: r.manager,
      monthlySales: r.monthlySales, status: r.status,
    })),
  }
}

export default async function RetailPage() {
  await requireErpPageUser()
  const { retail } = await getData()
  return <RetailClient retail={retail} />
}
