import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'investors')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.stake != null) data.stake = String(body.stake)
  if (body.investedAmount != null) data.investedAmount = Number(body.investedAmount) || 0
  if (body.lastUpdate !== undefined) data.lastUpdate = body.lastUpdate ? new Date(body.lastUpdate) : null
  return NextResponse.json({ investor: await db.erpInvestor.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'investors')
  if (error) return error
  const { id } = await params
  await db.erpInvestor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
