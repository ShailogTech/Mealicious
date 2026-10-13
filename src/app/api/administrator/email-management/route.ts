import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

// Any ERP role with the emailmanagement permission can view; only SUPER_ADMIN
// can create / assign / revoke (enforced in POST below).
export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'emailmanagement')
  if (error) return error
  const emails = await db.erpCompanyEmail.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ emails })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireErpRole(req, 'emailmanagement')
  if (error) return error
  // Only SUPER_ADMIN can create / assign email accounts.
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 })
  }
  const body = await req.json()
  const email = String(body.email || '').trim().toLowerCase()
  const department = String(body.department || '').trim()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!department) return NextResponse.json({ error: 'Department is required' }, { status: 400 })

  const created = await db.erpCompanyEmail.create({
    data: {
      email,
      department,
      assignedTo: body.assignedTo ? String(body.assignedTo).trim() : null,
      isActive: body.isActive !== undefined ? !!body.isActive : true,
      notes: body.notes ? String(body.notes) : null,
    },
  })
  return NextResponse.json({ email: created })
}
