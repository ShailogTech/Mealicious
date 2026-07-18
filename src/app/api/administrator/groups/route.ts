import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'groups')
  if (error) return error
  const groups = await db.erpGroup.findMany({ orderBy: { createdAt: 'desc' } })
  const employees = await db.erpEmployee.findMany({ select: { id: true, name: true, dept: true } })
  return NextResponse.json({
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
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'groups')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const created = await db.erpGroup.create({
    data: {
      name,
      description: body.description ? String(body.description) : null,
      ownerName: body.ownerName ? String(body.ownerName) : null,
      memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
    },
  })
  return NextResponse.json({ group: created })
}
