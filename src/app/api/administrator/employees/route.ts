import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'
import { nextEmployeeCode, computeProductivityScore, performanceRatingLabel, DEFAULT_MONITORING } from '@/lib/administrator/employee-helpers'

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'employees')
  if (error) return error
  const employees = await db.erpEmployee.findMany({
    orderBy: { createdAt: 'desc' },
    include: { adminUser: { select: { username: true, email: true } } },
  })
  return NextResponse.json({
    employees: employees.map((e) => ({
      id: e.id,
      employeeCode: e.employeeCode,
      name: e.name,
      dept: e.dept,
      role: e.role,
      city: e.city ?? '',
      shift: e.shift ?? '',
      team: e.team ?? '',
      orgLevel: e.orgLevel ?? '',
      employmentType: e.employmentType,
      status: e.status,
      productivityScore: e.productivityScore,
      performanceRating: e.performanceRating ?? '',
      loginUsername: e.adminUser?.username ?? '',
      loginEmail: e.adminUser?.email ?? '',
    })),
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'employees')
  if (error) return error
  const body = await req.json()
  const name = String(body.name || '').trim()
  const dept = String(body.dept || '').trim()
  if (!name || !dept) {
    return NextResponse.json({ error: 'Name and department are required' }, { status: 400 })
  }

  const code = body.employeeCode ? String(body.employeeCode) : await nextEmployeeCode()
  const created = await db.erpEmployee.create({
    data: {
      employeeCode: code,
      name,
      dept,
      role: String(body.role || ''),
      city: body.city || null,
      shift: body.shift || null,
      team: body.team || null,
      orgLevel: body.orgLevel || null,
      employmentType: body.employmentType || 'Full-Time',
      status: body.status || 'Active',
      joinedAt: body.joinedAt ? new Date(body.joinedAt) : new Date(),
      salary: Number(body.salary) || 0,
      // Personal
      gender: body.gender || null,
      dob: body.dob ? new Date(body.dob) : null,
      bloodGroup: body.bloodGroup || null,
      maritalStatus: body.maritalStatus || null,
      nationality: body.nationality || 'Indian',
      aadhaar: body.aadhaar || null,
      pan: body.pan || null,
      passportNumber: body.passportNumber || null,
      drivingLicense: body.drivingLicense || null,
      personalEmail: body.personalEmail || null,
      officialEmail: body.officialEmail || null,
      emergencyContactName: body.emergencyContactName || null,
      emergencyContactNumber: body.emergencyContactNumber || null,
      // Address
      permanentAddress: body.permanentAddress || null,
      currentAddress: body.currentAddress || null,
      state: body.state || null,
      pinCode: body.pinCode || null,
      country: body.country || 'India',
      workLocation: body.workLocation || null,
      // Bank
      bankName: body.bankName || null,
      bankAccountNumber: body.bankAccountNumber || null,
      bankIFSC: body.bankIFSC || null,
      bankBranch: body.bankBranch || null,
      // Internship window
      internshipStart: body.internshipStart ? new Date(body.internshipStart) : null,
      internshipEnd: body.internshipEnd ? new Date(body.internshipEnd) : null,
      // Productivity (auto-init)
      attendancePct: 100,
      avgHours: 0,
      taskCompletionPct: 0,
      idlePct: 0,
      productivityScore: computeProductivityScore({ attendancePct: 100, avgHours: 0, taskCompletionPct: 0, idlePct: 0 }),
      performanceRating: performanceRatingLabel(0),
      monitoring: DEFAULT_MONITORING,
    },
  })
  return NextResponse.json({ employee: created })
}
