import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'campaigns')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.channel != null) data.channel = String(body.channel)
  if (body.budget != null) data.budget = Number(body.budget) || 0
  if (body.leads != null) data.leads = Number(body.leads) || 0
  if (body.roi != null) data.roi = String(body.roi)
  if (body.status != null) data.status = String(body.status)
  return NextResponse.json({ campaign: await db.erpCampaign.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'campaigns')
  if (error) return error
  const { id } = await params
  await db.erpCampaign.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
