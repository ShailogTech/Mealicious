import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'sales')
  if (error) return error
  const rows = await db.erpSalesOrder.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ sales: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'sales')
  if (error) return error
  const body = await req.json()
  const customer = String(body.customer || '').trim()
  if (!customer) return NextResponse.json({ error: 'Customer is required' }, { status: 400 })
  const created = await db.erpSalesOrder.create({
    data: {
      customer,
      product: String(body.product || ''),
      qty: Number(body.qty) || 0,
      amount: Number(body.amount) || 0,
      channel: body.channel || 'Website',
      status: body.status || 'Completed',
    },
  })
  return NextResponse.json({ sale: created })
}
