import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'mailinbox')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.isRead != null) data.isRead = Boolean(body.isRead)
  if (body.isStarred != null) data.isStarred = Boolean(body.isStarred)
  if (body.category != null) data.category = String(body.category)
  return NextResponse.json({ mail: await db.erpMailInbox.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'mailinbox')
  if (error) return error
  const { id } = await params
  await db.erpMailInbox.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
