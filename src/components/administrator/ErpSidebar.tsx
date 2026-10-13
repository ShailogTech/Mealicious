'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut, X, LayoutDashboard, Users, FileText, Boxes, Wallet,
  Clock, Activity, UsersRound, UserCircle, MessageCircle, Mail,
  Handshake, ShoppingCart, Package, Store, Factory, Truck, KanbanSquare,
  ChartColumn, Building2, ShoppingBag, Banknote, Megaphone, Wrench,
  FolderOpen, Receipt, Mailbox, Landmark, Inbox,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ErpModule } from '@/lib/administrator/modules'
import { ERP_SECTIONS } from '@/lib/administrator/modules'

/**
 * Icon lookup — kept here (client-side) because Lucide icons are functions and
 * cannot be serialized across the Server→Client Component boundary. The module
 * registry carries only an `icon` string key; we resolve it to the component
 * here in the client component.
 */
const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  file: FileText,
  boxes: Boxes,
  wallet: Wallet,
  clock: Clock,
  activity: Activity,
  'users-2': UsersRound,
  'users-3': UserCircle,
  'message-circle': MessageCircle,
  mail: Mail,
  handshake: Handshake,
  'shopping-cart': ShoppingCart,
  package: Package,
  store: Store,
  factory: Factory,
  truck: Truck,
  kanban: KanbanSquare,
  chart: ChartColumn,
  building: Building2,
  'shopping-bag': ShoppingBag,
  banknote: Banknote,
  megaphone: Megaphone,
  wrench: Wrench,
  folder: FolderOpen,
  wholesale: Receipt,
  emailmanagement: Mailbox,
  expenses: Wallet,
  bankaccounts: Landmark,
  mailinbox: Inbox,
}

function resolveModuleIcon(key: string): LucideIcon {
  return MODULE_ICONS[key] ?? FileText
}

interface ErpSidebarProps {
  modules: ErpModule[]
  companyName: string
  userName: string
  userRole: string
  open: boolean
  onClose: () => void
}

export function ErpSidebar({ modules, companyName, userName, userRole, open, onClose }: ErpSidebarProps) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/administrator/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/administrator/login'
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col border-r border-stone-200 bg-white transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-stone-200 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-stone-900 truncate">MEALICIOUS</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Official ERP</p>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {ERP_SECTIONS.map((section) => {
            const sectionModules = modules.filter((m) => m.section === section)
            if (sectionModules.length === 0) return null
            return (
              <div key={section}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {section}
                </p>
                <ul className="space-y-1">
                  {sectionModules.map((m) => {
                    const active = pathname.startsWith(m.href)
                    const Icon = resolveModuleIcon(m.icon)
                    return (
                      <li key={m.key}>
                        <Link
                          href={m.href}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            active
                              ? 'text-stone-950'
                              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                          )}
                          style={active ? { backgroundColor: 'var(--erp-accent, #f59e0b)' } : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{m.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-stone-200 p-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <Link href="/administrator/profile" className="min-w-0 hover:opacity-80" onClick={onClose}>
              <p className="text-sm font-semibold text-stone-900 truncate" title={companyName}>{companyName}</p>
              <p className="text-xs text-stone-500 truncate">{userName} · {userRole}</p>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="My Profile">
                <Link href="/administrator/profile" onClick={onClose}><UserCircle className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
