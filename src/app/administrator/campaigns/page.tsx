export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { CampaignsClient } from './CampaignsClient'

async function getData() {
  const rows = await db.erpCampaign.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    campaigns: rows.map((c) => ({
      id: c.id, name: c.name, channel: c.channel, budget: c.budget,
      leads: c.leads, roi: c.roi, status: c.status,
    })),
  }
}

export default async function CampaignsPage() {
  await requireErpPageUser()
  const { campaigns } = await getData()
  return <CampaignsClient campaigns={campaigns} />
}
