export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { VendorsClient } from './VendorsClient'

async function getData() {
  const vendors = await db.erpVendor.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    vendors: vendors.map((v) => ({
      id: v.id, name: v.name, type: v.type, city: v.city, rating: v.rating,
      status: v.status, outstanding: v.outstanding,
    })),
  }
}

export default async function VendorsPage() {
  const user = await requireErpPageUser()
  const { vendors } = await getData()
  return <VendorsClient vendors={vendors} canExport={user.role === 'SUPER_ADMIN'} />
}
