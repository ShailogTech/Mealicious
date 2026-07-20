import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'assets')
  if (error) return error
  return NextResponse.json({ assets: await db.erpAsset.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'assets')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Asset name is required' }, { status: 400 })
  const created = await db.erpAsset.create({
    data: {
      name,
      type: body.type || 'Machinery',
      assignedTo: String(body.assignedTo || ''),
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
      status: body.status || 'In Use',
    },
  })
  return NextResponse.json({ asset: created })
}
