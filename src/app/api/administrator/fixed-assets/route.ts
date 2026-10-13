import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  return NextResponse.json({ fixedAssets: await db.erpFixedAsset.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  const category = String(body.category || '').trim()
  if (!name) return NextResponse.json({ error: 'Asset name is required' }, { status: 400 })
  if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  const created = await db.erpFixedAsset.create({
    data: {
      name,
      category,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchaseValue: Number(body.purchaseValue) || 0,
      currentValue: Number(body.currentValue) || 0,
      depreciationRate: Number(body.depreciationRate) || 10,
      location: body.location ? String(body.location) : null,
      status: body.status || 'Active',
    },
  })
  return NextResponse.json({ fixedAsset: created })
}
