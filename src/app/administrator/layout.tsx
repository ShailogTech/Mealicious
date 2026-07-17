import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { ErpShell } from '@/components/administrator/ErpShell'
import { visibleErpModules, type ErpModule } from '@/lib/administrator/modules'

export const dynamic = 'force-dynamic'

/**
 * ERP shell layout. Auth handling:
 *  - No session → render children bare. The login page shows; every other
 *    page calls getErpSessionUser() itself and redirects to /administrator/login
 *    if null (see each page.tsx). This keeps the login route working without a
 *    separate layout while keeping the auth check explicit per route.
 *  - Session present → wrap children in the sidebar shell.
 */
export default async function AdministratorLayout({ children }: { children: React.ReactNode }) {
  const user = await getErpSessionUser()

  if (!user) {
    return <>{children}</>
  }

  // An authenticated user reaching the login page is bounced to the dashboard.
  // (Login page is a client component that also redirects via useEffect.)

  const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
  const permissions = (config?.permissions ?? {}) as Record<string, Record<string, boolean>>
  const company = (config?.company ?? {}) as { companyName?: string }
  const modules = visibleErpModules(permissions, user.role) as ErpModule[]

  return (
    <ErpShell
      modules={modules}
      companyName={company.companyName ?? 'Mealicious'}
      userName={user.displayName}
      userRole={user.role.replace('_', ' ')}
    >
      {children}
    </ErpShell>
  )
}
