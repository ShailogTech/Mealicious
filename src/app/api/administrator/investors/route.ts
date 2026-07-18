import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'investors')
  if (error) return error
  return NextResponse.json({ investors: await db.erpInvestor.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'investors')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Investor name is required' }, { status: 400 })
  const created = await db.erpInvestor.create({
    data: {
      name,
      stake: String(body.stake || ''),
      investedAmount: Number(body.investedAmount) || 0,
      lastUpdate: body.lastUpdate ? new Date(body.lastUpdate) : null,
    },
  })
  return NextResponse.json({ investor: created })
}
