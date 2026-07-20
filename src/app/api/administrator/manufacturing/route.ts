import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'manufacturing')
  if (error) return error
  const rows = await db.erpProductionOrder.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ productionOrders: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'manufacturing')
  if (error) return error
  const body = await req.json()
  const product = String(body.product || '').trim()
  if (!product) return NextResponse.json({ error: 'Product is required' }, { status: 400 })
  const created = await db.erpProductionOrder.create({
    data: {
      product,
      qty: Number(body.qty) || 0,
      machine: body.machine || '',
      status: body.status || 'Scheduled',
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })
  return NextResponse.json({ productionOrder: created })
}
