'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ErpModule } from '@/lib/administrator/modules'
import { ERP_SECTIONS } from '@/lib/administrator/modules'

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
                    const Icon = m.icon
                    return (
                      <li key={m.key}>
                        <Link
                          href={m.href}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            active
                              ? 'bg-amber-500 text-stone-950'
                              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                          )}
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
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate" title={companyName}>{companyName}</p>
              <p className="text-xs text-stone-500 truncate">{userName} · {userRole}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleLogout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
