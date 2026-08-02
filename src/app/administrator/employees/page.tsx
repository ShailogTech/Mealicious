export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { EmployeesClient } from './EmployeesClient'

async function getData() {
  const employees = await db.erpEmployee.findMany({
    orderBy: { createdAt: 'desc' },
    include: { adminUser: { select: { username: true, email: true } } },
  })
  return {
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
  }
}

export default async function EmployeesPage() {
  const user = await requireErpPageUser()
  const { employees } = await getData()
  return <EmployeesClient employees={employees} canExport={user.role === 'SUPER_ADMIN'} canManageAccess={user.role === 'SUPER_ADMIN'} />
}
