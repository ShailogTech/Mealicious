import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireErpRole(req, 'emailmanagement')
  if (error) return error
  // Only SUPER_ADMIN can assign / revoke / edit email accounts.
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase()
  if (body.department !== undefined) data.department = String(body.department)
  // assignedTo may be explicitly set to null (revoke) — only treat undefined as no-op.
  if (body.assignedTo !== undefined) {
    data.assignedTo = body.assignedTo ? String(body.assignedTo).trim() : null
  }
  if (body.isActive !== undefined) data.isActive = !!body.isActive
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null

  const updated = await db.erpCompanyEmail.update({ where: { id }, data })
  return NextResponse.json({ email: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireErpRole(req, 'emailmanagement')
  if (error) return error
  // Only SUPER_ADMIN can delete email accounts.
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 })
  }
  const { id } = await params
  await db.erpCompanyEmail.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
