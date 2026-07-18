import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'crm')
  if (error) return error
  const rows = await db.erpLead.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ leads: rows })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'crm')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
  const created = await db.erpLead.create({
    data: {
      name,
      company: String(body.company || ''),
      stage: body.stage || 'New',
      value: Number(body.value) || 0,
      owner: String(body.owner || ''),
    },
  })
  return NextResponse.json({ lead: created })
}
