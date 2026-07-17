'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErpSidebar } from './ErpSidebar'
import type { ErpModule } from '@/lib/administrator/modules'

interface ErpShellProps {
  children: React.ReactNode
  modules: ErpModule[]
  companyName: string
  userName: string
  userRole: string
}

export function ErpShell({ children, modules, companyName, userName, userRole }: ErpShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <ErpSidebar
        modules={modules}
        companyName={companyName}
        userName={userName}
        userRole={userRole}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold tracking-tight text-stone-900">Mealicious Operations</h1>
              <p className="text-[11px] text-stone-500 hidden sm:block">Enterprise Resource Planning</p>
            </div>
          </div>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            ERP
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
