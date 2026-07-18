export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { CrmClient } from './CrmClient'

async function getData() {
  const leads = await db.erpLead.findMany({ orderBy: { createdAt: 'desc' } })
  return { leads: leads.map((l) => ({ id: l.id, name: l.name, company: l.company, stage: l.stage, value: l.value, owner: l.owner })) }
}

export default async function CrmPage() {
  await requireErpPageUser()
  const { leads } = await getData()
  return <CrmClient leads={leads} />
}
