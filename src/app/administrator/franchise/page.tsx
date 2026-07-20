export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { FranchiseClient } from './FranchiseClient'

async function getData() {
  const rows = await db.erpFranchise.findMany({ orderBy: { createdAt: 'desc' } })
  return { franchise: rows.map((f) => ({ id: f.id, name: f.name, city: f.city, owner: f.owner, royaltyDue: f.royaltyDue, status: f.status })) }
}

export default async function FranchisePage() {
  await requireErpPageUser()
  const { franchise } = await getData()
  return <FranchiseClient franchise={franchise} />
}
