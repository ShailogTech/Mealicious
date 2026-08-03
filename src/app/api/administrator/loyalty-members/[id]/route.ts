import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.customerName != null) data.customerName = String(body.customerName)
  if (body.customerPhone != null) data.customerPhone = body.customerPhone ? String(body.customerPhone) : null
  if (body.customerEmail != null) data.customerEmail = body.customerEmail ? String(body.customerEmail) : null
  if (body.points != null) data.points = Number(body.points) || 0
  if (body.tier != null) data.tier = String(body.tier)
  if (body.totalSpent != null) data.totalSpent = Number(body.totalSpent) || 0
  if (body.referrals != null) data.referrals = Number(body.referrals) || 0
  return NextResponse.json({ loyaltyMember: await db.erpLoyaltyMember.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  await db.erpLoyaltyMember.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
