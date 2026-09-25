import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const rows = await db.discount.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ discounts: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const body = await req.json()
  const code = String(body.code || '').trim().toUpperCase()
  const type = String(body.type || '')
  if (!code || !['prepaid', 'percent', 'flat', 'bogo', 'freegift'].includes(type)) {
    return NextResponse.json({ error: 'Valid code and type (prepaid|percent|flat|bogo|freegift) are required' }, { status: 400 })
  }
  const existing = await db.discount.findUnique({ where: { code } })
  if (existing) return NextResponse.json({ error: `Discount code ${code} already exists` }, { status: 400 })
  const created = await db.discount.create({
    data: {
      code,
      type,
      value: Number(body.value) || 0,
      minOrder: Number(body.minOrder) || 0,
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      isActive: body.isActive !== false,
      description: body.description ? String(body.description) : null,
    },
  })
  return NextResponse.json({ discount: created })
}
