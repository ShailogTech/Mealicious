export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { redirect } from 'next/navigation'
import { CompanySettingsClient } from './CompanySettingsClient'

export default async function CompanySettingsPage() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/administrator/dashboard')

  const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
  const company = (config?.company ?? {}) as Record<string, string>
  return <CompanySettingsClient company={company} />
}
