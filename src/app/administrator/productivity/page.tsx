export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { redirect } from 'next/navigation'
import { ProductivityClient } from './ProductivityClient'

interface ProductivityRules {
  minWorkingHours: number
  maxWorkingHours: number
  minProductivityPct: number
  maxBreakMinutes: number
  idleThresholdMinutes: number
  lateLoginAfter: string
  earlyLogoutBefore: string
}

async function getData() {
  const [employees, config] = await Promise.all([
    db.erpEmployee.findMany({ select: { id: true, name: true, dept: true, productivityScore: true, attendancePct: true, performanceRating: true } }),
    db.erpSystemConfig.findUnique({ where: { id: 'singleton' }, select: { productivityRules: true } }),
  ])
  const rules = (config?.productivityRules ?? {}) as Partial<ProductivityRules>
  const valid = employees.filter((e) => e.productivityScore > 0 || e.attendancePct > 0)
  const sorted = [...valid].sort((a, b) => b.productivityScore - a.productivityScore)
  return {
    avgScore: valid.length ? Math.round(valid.reduce((s, e) => s + e.productivityScore, 0) / valid.length) : 0,
    avgAttendance: valid.length ? Math.round(valid.reduce((s, e) => s + e.attendancePct, 0) / valid.length) : 0,
    top10: sorted.slice(0, 10).map((e) => ({ id: e.id, name: e.name, dept: e.dept, score: e.productivityScore, rating: e.performanceRating ?? '' })),
    bottom5: sorted.slice(-5).reverse().map((e) => ({ id: e.id, name: e.name, dept: e.dept, score: e.productivityScore, attendance: e.attendancePct })),
    deptScores: computeDeptScores(valid),
    rules: {
      minWorkingHours: rules.minWorkingHours ?? 8,
      maxWorkingHours: rules.maxWorkingHours ?? 10,
      minProductivityPct: rules.minProductivityPct ?? 60,
      maxBreakMinutes: rules.maxBreakMinutes ?? 60,
      idleThresholdMinutes: rules.idleThresholdMinutes ?? 30,
      lateLoginAfter: rules.lateLoginAfter ?? '09:15',
      earlyLogoutBefore: rules.earlyLogoutBefore ?? '17:45',
    },
  }
}

function computeDeptScores(employees: { dept: string; productivityScore: number }[]) {
  const byDept: Record<string, number[]> = {}
  for (const e of employees) {
    if (!byDept[e.dept]) byDept[e.dept] = []
    byDept[e.dept].push(e.productivityScore)
  }
  return Object.entries(byDept).map(([dept, scores]) => ({
    dept,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }))
}

export default async function ProductivityPage() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  const data = await getData()
  const canEditRules = user.role === 'HR' || user.role === 'SUPER_ADMIN'
  return <ProductivityClient {...data} canEditRules={canEditRules} />
}
