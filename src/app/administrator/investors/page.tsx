export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { InvestorsClient } from './InvestorsClient'

async function getData() {
  const rows = await db.erpInvestor.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    investors: rows.map((i) => ({
      id: i.id, name: i.name, stake: i.stake, investedAmount: i.investedAmount,
      lastUpdate: i.lastUpdate ? i.lastUpdate.toISOString().slice(0, 10) : '',
    })),
  }
}

export default async function InvestorsPage() {
  await requireErpPageUser()
  const { investors } = await getData()
  return <InvestorsClient investors={investors} />
}
