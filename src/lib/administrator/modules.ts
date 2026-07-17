import {
  LayoutDashboard, Users, FileText, Boxes, Wallet, type LucideIcon,
} from 'lucide-react'

/**
 * ERP module registry — the subset built in Phase 1. Each entry's `key`
 * matches a key in the RBAC matrix (ErpSystemConfig.permissions) and is the
 * argument passed to requireErpRole(). Future phases append entries here.
 */
export interface ErpModule {
  key: string
  label: string
  icon: LucideIcon
  section: 'Overview' | 'People & Operations' | 'Production & Growth'
  href: string
  /** Module keys not yet built in Phase 1; sidebar links resolve to a "coming soon" page. */
  comingSoon?: boolean
}

export const ERP_MODULES: ErpModule[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'Overview',
    href: '/administrator/dashboard',
  },
  {
    key: 'employees',
    label: 'Employees / HRMS',
    icon: Users,
    section: 'People & Operations',
    href: '/administrator/employees',
  },
  {
    key: 'billing',
    label: 'New Invoice',
    icon: FileText,
    section: 'People & Operations',
    href: '/administrator/billing',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    icon: FileText,
    section: 'People & Operations',
    href: '/administrator/invoices',
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    section: 'Production & Growth',
    href: '/administrator/inventory',
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: Wallet,
    section: 'Production & Growth',
    href: '/administrator/finance',
  },
]

export const ERP_SECTIONS: ErpModule['section'][] = [
  'Overview',
  'People & Operations',
  'Production & Growth',
]

/** Filter modules visible to a given role, using the RBAC matrix. */
export function visibleErpModules(
  permissions: Record<string, Record<string, boolean>>,
  role: string,
): ErpModule[] {
  if (role === 'SUPER_ADMIN') return ERP_MODULES
  return ERP_MODULES.filter((m) => permissions[m.key]?.[role] ?? false)
}
