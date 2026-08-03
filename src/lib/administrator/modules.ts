/**
 * ERP module registry — the subset built in Phase 1. Each entry's `key`
 * matches a key in the RBAC matrix (ErpSystemConfig.permissions) and is the
 * argument passed to requireErpRole(). Future phases append entries here.
 *
 * IMPORTANT: the serializable module data (key/label/section/href) lives here
 * so it can cross the Server→Client Component boundary. The icon (a Lucide
 * component, which is a function and therefore NOT serializable) is resolved
 * client-side via MODULE_ICONS in resolveModuleIcon() — never put an icon in
 * a prop passed from a server component to a client component.
 */

export type ErpModuleSection = 'Overview' | 'People & Operations' | 'Production & Growth' | 'Network'

export interface ErpModule {
  key: string
  label: string
  section: ErpModuleSection
  href: string
  /** Icon name resolved client-side via resolveModuleIcon(). */
  icon: string
}

export const ERP_MODULES: ErpModule[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    section: 'Overview',
    href: '/administrator/dashboard',
    icon: 'dashboard',
  },
  {
    key: 'employees',
    label: 'Employees / HRMS',
    section: 'People & Operations',
    href: '/administrator/employees',
    icon: 'users',
  },
  {
    key: 'shifts',
    label: 'Work Schedules',
    section: 'People & Operations',
    href: '/administrator/shifts',
    icon: 'clock',
  },
  {
    key: 'productivity',
    label: 'Productivity & Time Tracking',
    section: 'People & Operations',
    href: '/administrator/productivity',
    icon: 'activity',
  },
  {
    key: 'teams',
    label: 'Teams',
    section: 'People & Operations',
    href: '/administrator/teams',
    icon: 'users-2',
  },
  {
    key: 'groups',
    label: 'Groups',
    section: 'People & Operations',
    href: '/administrator/groups',
    icon: 'users-3',
  },
  {
    key: 'messages',
    label: 'Messages',
    section: 'People & Operations',
    href: '/administrator/messages',
    icon: 'message-circle',
  },
  {
    key: 'mailtickets',
    label: 'Mail / Tickets',
    section: 'People & Operations',
    href: '/administrator/mail-tickets',
    icon: 'mail',
  },
  {
    key: 'crm',
    label: 'CRM / Leads',
    section: 'People & Operations',
    href: '/administrator/crm',
    icon: 'handshake',
  },
  {
    key: 'sales',
    label: 'Sales & POS',
    section: 'People & Operations',
    href: '/administrator/sales',
    icon: 'shopping-cart',
  },
  {
    key: 'billing',
    label: 'New Invoice',
    section: 'People & Operations',
    href: '/administrator/billing',
    icon: 'file',
  },
  {
    key: 'wholesale',
    label: 'Wholesale Invoices',
    section: 'People & Operations',
    href: '/administrator/wholesale',
    icon: 'wholesale',
  },
  {
    key: 'purchase',
    label: 'Purchase Orders',
    section: 'People & Operations',
    href: '/administrator/purchase',
    icon: 'package',
  },
  {
    key: 'vendors',
    label: 'Vendor Portal',
    section: 'People & Operations',
    href: '/administrator/vendors',
    icon: 'store',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    section: 'People & Operations',
    href: '/administrator/invoices',
    icon: 'file',
  },
  {
    key: 'inventory',
    label: 'Inventory',
    section: 'Production & Growth',
    href: '/administrator/inventory',
    icon: 'boxes',
  },
  {
    key: 'manufacturing',
    label: 'Manufacturing',
    section: 'Production & Growth',
    href: '/administrator/manufacturing',
    icon: 'factory',
  },
  {
    key: 'supplychain',
    label: 'Supply Chain',
    section: 'Production & Growth',
    href: '/administrator/supply-chain',
    icon: 'truck',
  },
  {
    key: 'projects',
    label: 'Projects',
    section: 'Production & Growth',
    href: '/administrator/projects',
    icon: 'kanban',
  },
  {
    key: 'finance',
    label: 'Finance',
    section: 'Production & Growth',
    href: '/administrator/finance',
    icon: 'wallet',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    section: 'Production & Growth',
    href: '/administrator/analytics',
    icon: 'chart',
  },
  {
    key: 'franchise',
    label: 'Franchise',
    section: 'Network',
    href: '/administrator/franchise',
    icon: 'building',
  },
  {
    key: 'distributorportal',
    label: 'Distributor Portal',
    section: 'Network',
    href: '/administrator/distributors',
    icon: 'shopping-bag',
  },
  {
    key: 'retail',
    label: 'Retail Stores',
    section: 'Network',
    href: '/administrator/retail',
    icon: 'store',
  },
  {
    key: 'investors',
    label: 'Investors',
    section: 'Network',
    href: '/administrator/investors',
    icon: 'banknote',
  },
  {
    key: 'campaigns',
    label: 'Campaigns',
    section: 'Network',
    href: '/administrator/campaigns',
    icon: 'megaphone',
  },
  {
    key: 'assets',
    label: 'Assets',
    section: 'Network',
    href: '/administrator/assets',
    icon: 'wrench',
  },
  {
    key: 'emailmanagement',
    label: 'Email Management',
    section: 'Network',
    href: '/administrator/email-management',
    icon: 'emailmanagement',
  },
  {
    key: 'companysettings',
    label: 'Company Settings',
    section: 'Network',
    href: '/administrator/company-settings',
    icon: 'building',
  },
  {
    key: 'documents',
    label: 'Documents',
    section: 'Network',
    href: '/administrator/documents',
    icon: 'folder',
  },
  {
    key: 'marketing',
    label: 'Marketing Department',
    section: 'Network',
    href: '/administrator/marketing',
    icon: 'megaphone',
  },
  {
    key: 'financedept',
    label: 'Finance Department',
    section: 'Network',
    href: '/administrator/finance-dept',
    icon: 'chart',
  },
  {
    key: 'expenses',
    label: 'Expense Monitoring',
    section: 'Network',
    href: '/administrator/expenses',
    icon: 'expenses',
  },
  {
    key: 'bankaccounts',
    label: 'Bank Accounts',
    section: 'Network',
    href: '/administrator/bank-accounts',
    icon: 'bankaccounts',
  },
]

export const ERP_SECTIONS: ErpModuleSection[] = [
  'Overview',
  'People & Operations',
  'Production & Growth',
  'Network',
]

/** Filter modules visible to a given role, using the RBAC matrix. */
export function visibleErpModules(
  permissions: Record<string, Record<string, boolean>>,
  role: string,
): ErpModule[] {
  if (role === 'SUPER_ADMIN') return ERP_MODULES
  return ERP_MODULES.filter((m) => permissions[m.key]?.[role] ?? false)
}
