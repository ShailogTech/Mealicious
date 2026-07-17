import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'inventory')
  if (error) return error
  const rows = await db.erpInventoryItem.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'inventory')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  const category = String(body.category || '').trim()
  if (!name || !category) {
    return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
  }
  const created = await db.erpInventoryItem.create({
    data: {
      name,
      category,
      hsn: body.hsn ? String(body.hsn) : null,
      sku: body.sku ? String(body.sku) : null,
      stock: Number(body.stock) || 0,
      reorderLevel: Number(body.reorderLevel) || 0,
      price: Number(body.price) || 0,
      gstPct: Number(body.gstPct) || 0,
    },
  })
  return NextResponse.json({ item: created })
}
