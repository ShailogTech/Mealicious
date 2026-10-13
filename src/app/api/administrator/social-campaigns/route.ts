import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  return NextResponse.json({ socialCampaigns: await db.erpSocialCampaign.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  const platform = String(body.platform || '').trim()
  if (!name) return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
  if (!platform) return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
  const created = await db.erpSocialCampaign.create({
    data: {
      name,
      platform,
      status: body.status || 'Planned',
      budget: Number(body.budget) || 0,
      spent: Number(body.spent) || 0,
      impressions: Number(body.impressions) || 0,
      clicks: Number(body.clicks) || 0,
      conversions: Number(body.conversions) || 0,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })
  return NextResponse.json({ socialCampaign: created })
}
