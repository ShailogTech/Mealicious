import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'bankaccounts')
  if (error) return error
  if (user!.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })
  }
  // Primary account sorts first, then most recent.
  const rows = await db.erpBankAccount.findMany({
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ bankAccounts: rows })
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'bankaccounts')
  if (error) return error
  if (user!.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })
  }

  const body = await req.json()
  const bankName = String(body.bankName || '').trim()
  const accountName = String(body.accountName || '').trim()
  const accountNumber = String(body.accountNumber || '').trim()
  const ifscCode = String(body.ifscCode || '').trim()
  const branch = String(body.branch || '').trim()

  if (!bankName) return NextResponse.json({ error: 'Bank name is required' }, { status: 400 })
  if (!accountName) return NextResponse.json({ error: 'Account name is required' }, { status: 400 })
  if (!accountNumber) return NextResponse.json({ error: 'Account number is required' }, { status: 400 })
  if (!ifscCode) return NextResponse.json({ error: 'IFSC code is required' }, { status: 400 })

  // Enforce single primary: clear other primaries first if this one is primary.
  const isPrimary = Boolean(body.isPrimary)
  if (isPrimary) {
    await db.erpBankAccount.updateMany({ where: { isPrimary: true }, data: { isPrimary: false } })
  }

  const created = await db.erpBankAccount.create({
    data: {
      bankName,
      accountName,
      accountNumber,
      ifscCode,
      branch,
      accountType: body.accountType || 'Current',
      upiId: body.upiId ? String(body.upiId) : null,
      isPrimary,
      notes: body.notes ? String(body.notes) : null,
    },
  })
  return NextResponse.json({ bankAccount: created })
}
