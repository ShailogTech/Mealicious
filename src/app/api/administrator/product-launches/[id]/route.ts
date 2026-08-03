import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.productName != null) data.productName = String(body.productName)
  if (body.launchDate != null) data.launchDate = body.launchDate ? new Date(body.launchDate) : null
  if (body.status != null) data.status = String(body.status)
  if (body.budget != null) data.budget = Number(body.budget) || 0
  if (body.targetMarket != null) data.targetMarket = body.targetMarket ? String(body.targetMarket) : null
  if (body.notes != null) data.notes = body.notes ? String(body.notes) : null
  return NextResponse.json({ productLaunch: await db.erpProductLaunch.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'marketing')
  if (error) return error
  const { id } = await params
  await db.erpProductLaunch.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
