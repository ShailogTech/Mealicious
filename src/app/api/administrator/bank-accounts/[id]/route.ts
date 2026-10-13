import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireErpRole(req, 'bankaccounts')
  if (error) return error
  if (user!.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()

  // Enforce single primary: if promoting this account, demote the others.
  if (body.isPrimary === true) {
    await db.erpBankAccount.updateMany({ where: { isPrimary: true }, data: { isPrimary: false } })
  }

  const data: Record<string, unknown> = {}
  if (body.bankName != null) data.bankName = String(body.bankName)
  if (body.accountName != null) data.accountName = String(body.accountName)
  if (body.accountNumber != null) data.accountNumber = String(body.accountNumber)
  if (body.ifscCode != null) data.ifscCode = String(body.ifscCode)
  if (body.branch != null) data.branch = String(body.branch)
  if (body.accountType != null) data.accountType = String(body.accountType)
  if (body.upiId != null) data.upiId = body.upiId ? String(body.upiId) : null
  if (body.notes != null) data.notes = body.notes ? String(body.notes) : null
  if (body.isPrimary != null) data.isPrimary = Boolean(body.isPrimary)

  return NextResponse.json({ bankAccount: await db.erpBankAccount.update({ where: { id }, data }) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireErpRole(req, 'bankaccounts')
  if (error) return error
  if (user!.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })
  }
  const { id } = await params
  await db.erpBankAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
