export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { SupplyChainClient } from './SupplyChainClient'

async function getData() {
  const shipments = await db.erpShipment.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    shipments: shipments.map((s) => ({
      id: s.id, from: s.fromLocation, to: s.toLocation, vehicle: s.vehicle, status: s.status,
      eta: s.eta ? s.eta.toISOString().slice(0, 10) : '',
    })),
  }
}

export default async function SupplyChainPage() {
  await requireErpPageUser()
  const { shipments } = await getData()
  return <SupplyChainClient shipments={shipments} />
}
