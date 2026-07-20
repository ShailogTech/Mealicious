export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { TeamsClient } from './TeamsClient'

async function getData() {
  const teams = await db.erpTeam.findMany({
    include: { teamLead: { select: { id: true, name: true } }, manager: { select: { id: true, name: true } } },
    orderBy: { dept: 'asc' },
  })
  const employees = await db.erpEmployee.findMany({ select: { id: true, name: true, team: true, dept: true, employmentType: true } })
  return {
    teams: teams.map((t) => {
      const members = employees.filter((e) => e.team === t.name && e.dept === t.dept)
      return {
        id: t.id,
        name: t.name,
        dept: t.dept,
        teamLeadId: t.teamLead?.id ?? '',
        teamLeadName: t.teamLead?.name ?? 'Unassigned',
        managerId: t.manager?.id ?? '',
        managerName: t.manager?.name ?? 'Unassigned',
        members: members.map((m) => ({ id: m.id, name: m.name, isIntern: m.employmentType === 'Intern' })),
      }
    }),
    employees: employees.map((e) => ({ id: e.id, name: e.name, dept: e.dept })),
  }
}

export default async function TeamsPage() {
  await requireErpPageUser()
  const { teams, employees } = await getData()
  return <TeamsClient teams={teams} employees={employees} />
}
