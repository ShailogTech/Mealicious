import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'vendors')
  if (error) return error
  const rows = await db.erpVendor.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ vendors: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'vendors')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
  const created = await db.erpVendor.create({
    data: {
      name,
      type: body.type || 'Raw Material',
      city: String(body.city || ''),
      rating: Number(body.rating) || 0,
      status: body.status || 'Active',
      outstanding: Number(body.outstanding) || 0,
    },
  })
  return NextResponse.json({ vendor: created })
}
