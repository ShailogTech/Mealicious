import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  return NextResponse.json({ productLaunches: await db.erpProductLaunch.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const body = await req.json()
  const productName = String(body.productName || '').trim()
  if (!productName) return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
  const created = await db.erpProductLaunch.create({
    data: {
      productName,
      launchDate: body.launchDate ? new Date(body.launchDate) : null,
      status: body.status || 'Planning',
      budget: Number(body.budget) || 0,
      targetMarket: body.targetMarket ? String(body.targetMarket) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  })
  return NextResponse.json({ productLaunch: created })
}
