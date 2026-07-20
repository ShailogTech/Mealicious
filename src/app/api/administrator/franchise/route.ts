import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'franchise')
  if (error) return error
  return NextResponse.json({ franchise: await db.erpFranchise.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'franchise')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
  const created = await db.erpFranchise.create({
    data: {
      name,
      city: String(body.city || ''),
      owner: String(body.owner || ''),
      royaltyDue: Number(body.royaltyDue) || 0,
      status: body.status || 'Active',
    },
  })
  return NextResponse.json({ franchise: created })
}
