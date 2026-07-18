import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'distributorportal')
  if (error) return error
  return NextResponse.json({ distributors: await db.erpDistributor.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'distributorportal')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Distributor name is required' }, { status: 400 })
  const created = await db.erpDistributor.create({
    data: {
      name,
      city: String(body.city || ''),
      territory: String(body.territory || ''),
      targetAchieved: Number(body.targetAchieved) || 0,
      status: body.status || 'Active',
    },
  })
  return NextResponse.json({ distributor: created })
}
