import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  return NextResponse.json({ loyaltyMembers: await db.erpLoyaltyMember.findMany({ orderBy: { joinedAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const body = await req.json()
  const customerName = String(body.customerName || '').trim()
  if (!customerName) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
  const created = await db.erpLoyaltyMember.create({
    data: {
      customerName,
      customerPhone: body.customerPhone ? String(body.customerPhone) : null,
      customerEmail: body.customerEmail ? String(body.customerEmail) : null,
      points: Number(body.points) || 0,
      tier: body.tier || 'Silver',
      totalSpent: Number(body.totalSpent) || 0,
      referrals: Number(body.referrals) || 0,
    },
  })
  return NextResponse.json({ loyaltyMember: created })
}
