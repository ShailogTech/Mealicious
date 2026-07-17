import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { requireErpRole } from '@/lib/erp-session'
import { generateTempPassword, generateUniqueUsername } from '@/lib/administrator/employee-helpers'

/**
 * Create a login (AdminUser) for an employee. HR/SuperAdmin only.
 * Generates a one-time temp password that is returned ONCE and not stored
 * in plaintext anywhere; only the hash is persisted.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireErpRole(req, 'employees')
  if (error) return error
  const { id } = await params

  const employee = await db.erpEmployee.findUnique({ where: { id }, include: { adminUser: true } })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  if (employee.adminUser) return NextResponse.json({ error: 'This employee already has a login.' }, { status: 400 })

  // Derive a login email. Prefer officialEmail; else build from username + domain.
  const username = await generateUniqueUsername(employee.name)
  const email = (employee.officialEmail || `${username}@mealicious.store`).toLowerCase().trim()

  const existing = await db.adminUser.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: `Login email ${email} is already in use.` }, { status: 400 })

  const tempPassword = generateTempPassword()
  const initials = employee.name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  const created = await db.adminUser.create({
    data: {
      email,
      username,
      displayName: employee.name,
      initials,
      hashedPassword: await hashPassword(tempPassword),
      role: 'EMPLOYEE',
      isActive: true,
      linkedEmployee: { connect: { id: employee.id } },
    },
  })

  // Sanity: confirm the caller is an admin (user is non-null after requireErpRole).
  void user

  return NextResponse.json({
    ok: true,
    credentials: { email, username, tempPassword },
    warning: 'These credentials are shown only once. Share them securely with the employee.',
  })
}
