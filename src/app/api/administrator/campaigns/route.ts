import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'campaigns')
  if (error) return error
  return NextResponse.json({ campaigns: await db.erpCampaign.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'campaigns')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
  const created = await db.erpCampaign.create({
    data: {
      name,
      channel: String(body.channel || ''),
      budget: Number(body.budget) || 0,
      leads: Number(body.leads) || 0,
      roi: String(body.roi || ''),
      status: body.status || 'Planned',
    },
  })
  return NextResponse.json({ campaign: created })
}
