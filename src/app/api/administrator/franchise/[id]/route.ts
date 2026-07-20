import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'franchise')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name != null) data.name = String(body.name)
  if (body.city != null) data.city = String(body.city)
  if (body.owner != null) data.owner = String(body.owner)
  if (body.royaltyDue != null) data.royaltyDue = Number(body.royaltyDue) || 0
  if (body.status != null) data.status = String(body.status)
  return NextResponse.json({ franchise: await db.erpFranchise.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'franchise')
  if (error) return error
  const { id } = await params
  await db.erpFranchise.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
