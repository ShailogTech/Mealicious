import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'teams')
  if (error) return error
  const teams = await db.erpTeam.findMany({
    include: { teamLead: { select: { id: true, name: true } }, manager: { select: { id: true, name: true } } },
    orderBy: { dept: 'asc' },
  })
  // Members are derived from ErpEmployee.team + dept (matches ERP source).
  const employees = await db.erpEmployee.findMany({ select: { id: true, name: true, team: true, dept: true, employmentType: true } })
  const result = teams.map((t) => {
    const members = employees.filter((e) => e.team === t.name && e.dept === t.dept)
    return {
      id: t.id,
      name: t.name,
      dept: t.dept,
      teamLeadId: t.teamLead?.id ?? null,
      teamLeadName: t.teamLead?.name ?? 'Unassigned',
      managerId: t.manager?.id ?? null,
      managerName: t.manager?.name ?? 'Unassigned',
      members: members.map((m) => ({ id: m.id, name: m.name, isIntern: m.employmentType === 'Intern' })),
    }
  })
  return NextResponse.json({ teams: result })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'teams')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  const dept = String(body.dept || '').trim()
  if (!name || !dept) {
    return NextResponse.json({ error: 'Name and department are required' }, { status: 400 })
  }
  const created = await db.erpTeam.create({
    data: {
      name,
      dept,
      teamLeadId: body.teamLeadId || null,
      managerId: body.managerId || null,
    },
  })
  return NextResponse.json({ team: created })
}
