export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { AssetsClient } from './AssetsClient'

async function getData() {
  const rows = await db.erpAsset.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    assets: rows.map((a) => ({
      id: a.id, name: a.name, type: a.type, assignedTo: a.assignedTo, status: a.status,
      purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString().slice(0, 10) : '',
      warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.toISOString().slice(0, 10) : '',
    })),
  }
}

export default async function AssetsPage() {
  const user = await requireErpPageUser()
  const { assets } = await getData()
  return <AssetsClient assets={assets} canExport={user.role === 'SUPER_ADMIN'} />
}
