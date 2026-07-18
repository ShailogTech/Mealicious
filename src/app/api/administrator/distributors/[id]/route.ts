import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'distributorportal')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.city != null) data.city = String(body.city)
  if (body.territory != null) data.territory = String(body.territory)
  if (body.targetAchieved != null) data.targetAchieved = Number(body.targetAchieved) || 0
  if (body.status != null) data.status = String(body.status)
  return NextResponse.json({ distributor: await db.erpDistributor.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'distributorportal')
  if (error) return error
  const { id } = await params
  await db.erpDistributor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
