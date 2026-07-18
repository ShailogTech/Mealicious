import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'projects')
  if (error) return error
  const rows = await db.erpProject.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ projects: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'projects')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  const created = await db.erpProject.create({
    data: {
      name,
      owner: String(body.owner || ''),
      dept: String(body.dept || ''),
      progress: Number(body.progress) || 0,
      status: body.status || 'Backlog',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })
  return NextResponse.json({ project: created })
}
