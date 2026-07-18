import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { ErpShell } from '@/components/administrator/ErpShell'
import { visibleErpModules, type ErpModule } from '@/lib/administrator/modules'
import { deptAccent } from '@/lib/administrator/dept-theme'

export const dynamic = 'force-dynamic'

/**
 * ERP shell layout. Auth handling:
 *  - No session → render children bare. The login page shows; every other
 *    page calls getErpSessionUser() itself and redirects to /administrator/login
 *    if null (see each page.tsx). This keeps the login route working without a
 *    separate layout while keeping the auth check explicit per route.
 *  - Session present → wrap children in the sidebar shell, themed by dept.
 */
export default async function AdministratorLayout({ children }: { children: React.ReactNode }) {
  const user = await getErpSessionUser()

  if (!user) {
    return <>{children}</>
  }

  const config = await db.erpSystemConfig.findUnique({ where: { id: 'singleton' } })
  const permissions = (config?.permissions ?? {}) as Record<string, Record<string, boolean>>
  const company = (config?.company ?? {}) as { companyName?: string }
  const modules = visibleErpModules(permissions, user.role) as ErpModule[]

  // Department theming: Super Admin keeps default amber; others get their
  // department's accent color (ported from the ERP's DEPT_THEME).
  const dept = user.role === 'SUPER_ADMIN' ? null : user.linkedEmployee?.dept ?? null
  const accent = deptAccent(dept)

  return (
    <ErpShell
      modules={modules}
      companyName={company.companyName ?? 'Mealicious'}
      userName={user.displayName}
      userRole={user.role.replace('_', ' ')}
      accent={accent.accent}
      accentStrong={accent.strong}
    >
      {children}
    </ErpShell>
  )
}
