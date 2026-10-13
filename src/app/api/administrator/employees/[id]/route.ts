import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'employees')
  if (error) return error
  const { id } = await params
  const employee = await db.erpEmployee.findUnique({ where: { id }, include: { adminUser: true } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ employee })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireErpRole(req, 'employees')
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}

  // Standard field updates.
  const str = (k: string) => { if (body[k] != null) data[k] = body[k] ? String(body[k]) : null }
  const date = (k: string) => { if (body[k] != null) data[k] = body[k] ? new Date(body[k]) : null }
  ;['name', 'dept', 'role', 'city', 'shift', 'team', 'orgLevel', 'employmentType', 'status',
    'gender', 'bloodGroup', 'maritalStatus', 'nationality', 'aadhaar', 'pan', 'passportNumber',
    'drivingLicense', 'personalEmail', 'officialEmail', 'emergencyContactName', 'emergencyContactNumber',
    'permanentAddress', 'currentAddress', 'state', 'pinCode', 'country', 'workLocation',
    'bankName', 'bankAccountNumber', 'bankIFSC', 'bankBranch'].forEach(str)
  ;['dob', 'joinedAt', 'internshipStart', 'internshipEnd'].forEach(date)
  if (body.salary != null) data.salary = Number(body.salary) || 0
  if (body.monitoring != null) data.monitoring = body.monitoring
  if (body.moduleAccess != null) {
    // Only Super Admin can manage module-access overrides.
    if (user!.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can manage module access' }, { status: 403 })
    }
    data.moduleAccess = Array.isArray(body.moduleAccess) ? body.moduleAccess : []
  }

  // Discipline flow: when status moves to Suspended, also deactivate the
  // linked AdminUser login (so the employee can't sign in).
  if (body.status === 'Suspended') {
    data.suspendedAt = new Date()
    data.suspendedReason = body.suspendedReason ? String(body.suspendedReason) : null
  } else if (body.status && body.status !== 'Suspended') {
    data.suspendedAt = null
    data.suspendedReason = null
  }

  const updated = await db.erpEmployee.update({ where: { id }, data })

  // Cascade suspend/terminate to the linked login.
  if (body.status === 'Suspended' || body.status === 'Terminated') {
    if (updated.adminUserId) {
      await db.adminUser.update({
        where: { id: updated.adminUserId },
        data: {
          isActive: false,
          ...(body.status === 'Suspended' ? {
            suspendedAt: new Date(),
            suspendedReason: body.suspendedReason ? String(body.suspendedReason) : null,
          } : {}),
        },
      })
    }
  } else if (body.status === 'Active' && updated.adminUserId) {
    // Re-activating the employee restores login access.
    await db.adminUser.update({
      where: { id: updated.adminUserId },
      data: { isActive: true, suspendedAt: null, suspendedReason: null },
    })
  }

  return NextResponse.json({ employee: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireErpRole(req, 'employees')
  if (error) return error
  const { id } = await params
  // Detach any linked login rather than deleting it, then remove the employee.
  await db.erpEmployee.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
