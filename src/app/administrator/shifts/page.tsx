export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { ShiftsClient } from './ShiftsClient'

async function getData() {
  // Seed shifts from config if the table is empty (one-time migration from
  // the JSON blob in ErpSystemConfig.shifts to real ErpShift rows).
  const count = await db.erpShift.count()
  if (count === 0) {
    const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
    const seedShifts = (config?.shifts ?? []) as { name: string; start: string; end: string; type: string }[]
    if (seedShifts.length > 0) {
      await db.erpShift.createMany({ data: seedShifts })
    }
  }
  const shifts = await db.erpShift.findMany({ orderBy: { createdAt: 'asc' } })
  return {
    shifts: shifts.map((s) => ({ id: s.id, name: s.name, start: s.start, end: s.end, type: s.type })),
  }
}

export default async function ShiftsPage() {
  const user = await requireErpPageUser()
  const { shifts } = await getData()
  return <ShiftsClient shifts={shifts} canExport={user.role === 'SUPER_ADMIN'} />
}
