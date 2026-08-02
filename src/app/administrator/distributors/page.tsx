export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { DistributorsClient } from './DistributorsClient'

async function getData() {
  const rows = await db.erpDistributor.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    distributors: rows.map((d) => ({
      id: d.id, name: d.name, city: d.city, territory: d.territory,
      targetAchieved: d.targetAchieved, status: d.status,
    })),
  }
}

export default async function DistributorsPage() {
  const user = await requireErpPageUser()
  const { distributors } = await getData()
  return <DistributorsClient distributors={distributors} canExport={user.role === 'SUPER_ADMIN'} />
}
