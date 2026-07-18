import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

// Only HR + SuperAdmin may edit productivity rules.
export async function PATCH(req: NextRequest) {
  const { error, user } = await requireErpRole(req, 'productivity')
  if (error) return error
  if (user!.role !== 'HR' && user!.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only HR or Super Admin can edit rules' }, { status: 403 })
  }
  const body = await req.json()
  const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
  if (!config) return NextResponse.json({ error: 'Config missing' }, { status: 500 })
  const current = (config.productivityRules ?? {}) as Record<string, unknown>
  const next: Record<string, unknown> = { ...current }
  for (const key of ['minWorkingHours', 'maxWorkingHours', 'minProductivityPct', 'maxBreakMinutes', 'idleThresholdMinutes']) {
    if (body[key] != null) next[key] = Number(body[key])
  }
  if (body.lateLoginAfter != null) next.lateLoginAfter = String(body.lateLoginAfter)
  if (body.earlyLogoutBefore != null) next.earlyLogoutBefore = String(body.earlyLogoutBefore)
  const updated = await db.erpSystemConfig.update({ where: { id: 'singleton' }, data: { productivityRules: next } })
  return NextResponse.json({ productivityRules: updated.productivityRules })
}
