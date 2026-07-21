'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Boxes,
  Tag, ImageIcon, FileText, Star, MessageSquare, Mail, ArrowLeft, FolderTree, MessageCircle, Bell, LogOut, Percent
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/discounts', label: 'Discounts', icon: Percent },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/admin/push', label: 'Push Notify', icon: Bell },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
]

export function TopNav() {
  const pathname = usePathname()

  async function handleLogout() {
    if (!confirm('Are you sure you want to log out of the admin panel?')) return
    await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/'
  }

  return (
    <div className="w-full bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 gap-4">
        {/* Left: Brand logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-extrabold tracking-tight text-stone-900">MEALICIOUS</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
        </div>

        {/* Center: Scrollable navigation bar */}
        <nav className="flex-1 overflow-x-auto scrollbar-none flex items-center gap-1.5 py-2 scroll-smooth" role="navigation" aria-label="Admin Navigation">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold select-none transition-all whitespace-nowrap cursor-pointer border',
                  active
                    ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-sm shadow-amber-500/10'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Back to Home & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
