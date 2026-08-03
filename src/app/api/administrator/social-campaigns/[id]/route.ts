import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.platform != null) data.platform = String(body.platform)
  if (body.status != null) data.status = String(body.status)
  if (body.budget != null) data.budget = Number(body.budget) || 0
  if (body.spent != null) data.spent = Number(body.spent) || 0
  if (body.impressions != null) data.impressions = Number(body.impressions) || 0
  if (body.clicks != null) data.clicks = Number(body.clicks) || 0
  if (body.conversions != null) data.conversions = Number(body.conversions) || 0
  if (body.startDate != null) data.startDate = body.startDate ? new Date(body.startDate) : null
  if (body.endDate != null) data.endDate = body.endDate ? new Date(body.endDate) : null
  return NextResponse.json({ socialCampaign: await db.erpSocialCampaign.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  await db.erpSocialCampaign.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
