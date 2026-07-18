export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { GroupsClient } from './GroupsClient'

async function getData() {
  const groups = await db.erpGroup.findMany({ orderBy: { createdAt: 'desc' } })
  const employees = await db.erpEmployee.findMany({ select: { id: true, name: true, dept: true } })
  return {
    groups: groups.map((g) => {
      const ids = (g.memberIds ?? []) as string[]
      const members = ids
        .map((id) => employees.find((e) => e.id === id))
        .filter(Boolean)
        .map((e) => ({ id: (e as { id: string }).id, name: (e as { name: string }).name, dept: (e as { dept: string }).dept }))
      return {
        id: g.id,
        name: g.name,
        description: g.description ?? '',
        ownerName: g.ownerName ?? '',
        members,
      }
    }),
    employees: employees.map((e) => ({ id: e.id, name: e.name, dept: e.dept })),
  }
}

export default async function GroupsPage() {
  await requireErpPageUser()
  const { groups, employees } = await getData()
  return <GroupsClient groups={groups} employees={employees} />
}
