import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  return NextResponse.json({ customerSegments: await db.erpCustomerSegment.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Segment name is required' }, { status: 400 })
  const created = await db.erpCustomerSegment.create({
    data: {
      name,
      description: body.description ? String(body.description) : null,
      criteria: body.criteria ?? {},
      customerCount: Number(body.customerCount) || 0,
    },
  })
  return NextResponse.json({ customerSegment: created })
}
