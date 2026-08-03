export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { EmailManagementClient } from './EmailManagementClient'

async function getData() {
  const rows = await db.erpCompanyEmail.findMany({ orderBy: { createdAt: 'asc' } })
  const employees = await db.erpEmployee.findMany({
    where: { status: 'Active' },
    select: { id: true, name: true, dept: true, officialEmail: true },
    orderBy: { name: 'asc' },
  })
  return {
    emails: rows.map((e) => ({
      id: e.id,
      email: e.email,
      department: e.department,
      assignedTo: e.assignedTo,
      isActive: e.isActive,
      notes: e.notes,
    })),
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      dept: e.dept,
      officialEmail: e.officialEmail ?? '',
    })),
  }
}

export default async function EmailManagementPage() {
  const user = await requireErpPageUser()
  const { emails, employees } = await getData()
  return (
    <EmailManagementClient
      emails={emails}
      employees={employees}
      canManage={user.role === 'SUPER_ADMIN'}
    />
  )
}
