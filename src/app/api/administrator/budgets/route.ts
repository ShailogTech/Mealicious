import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  return NextResponse.json({ budgets: await db.erpBudget.findMany({ orderBy: { createdAt: 'desc' } }) })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const body = await req.json()
  const department = String(body.department || '').trim()
  const category = String(body.category || '').trim()
  if (!department) return NextResponse.json({ error: 'Department is required' }, { status: 400 })
  if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  const created = await db.erpBudget.create({
    data: {
      department,
      category,
      allocated: Number(body.allocated) || 0,
      spent: Number(body.spent) || 0,
      financialYear: body.financialYear || '2026-27',
    },
  })
  return NextResponse.json({ budget: created })
}
