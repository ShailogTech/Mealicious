import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

// Company settings is hard-locked to SUPER_ADMIN (matches ERP).
export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'companysettings')
  if (error) return error
  const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json({ company: config?.company ?? {} })
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireErpRole(req, 'companysettings')
  if (error) return error
  const body = await req.json()
  const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
  if (!config) return NextResponse.json({ error: 'Config missing' }, { status: 500 })
  const current = (config.company ?? {}) as Record<string, unknown>
  const next: Record<string, unknown> = { ...current }

  // Allowlist of editable identity fields.
  const fields = [
    'companyName', 'address', 'phone', 'email', 'website',
    'gstin', 'fssai', 'cin', 'invoicePrefix',
    'bankName', 'bankAccountName', 'bankAccountNumber', 'bankIFSC', 'bankBranch', 'upiId',
    'terms', 'footerText',
  ]
  for (const f of fields) {
    if (body[f] != null) next[f] = String(body[f])
  }

  await db.erpSystemConfig.update({ where: { id: 'singleton' }, data: { company: next } })
  return NextResponse.json({ company: next })
}
