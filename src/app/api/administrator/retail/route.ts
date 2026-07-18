import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'retail')
  if (error) return error
  return NextResponse.json({ retail: await db.erpRetailStore.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'retail')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
  const created = await db.erpRetailStore.create({
    data: {
      name,
      city: String(body.city || ''),
      manager: String(body.manager || ''),
      monthlySales: Number(body.monthlySales) || 0,
      status: body.status || 'Active',
    },
  })
  return NextResponse.json({ retail: created })
}
