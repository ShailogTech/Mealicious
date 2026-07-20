import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'shifts')
  if (error) return error
  const rows = await db.erpShift.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ shifts: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'shifts')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  const start = String(body.start || '').trim()
  const end = String(body.end || '').trim()
  const type = String(body.type || 'Standard')
  if (!name || !start || !end) {
    return NextResponse.json({ error: 'Name, start, and end are required' }, { status: 400 })
  }
  const created = await db.erpShift.create({ data: { name, start, end, type } })
  return NextResponse.json({ shift: created })
}
