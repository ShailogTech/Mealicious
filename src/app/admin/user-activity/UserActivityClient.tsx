'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Eye, ShoppingCart, Trophy, Users,
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Activity {
  id: string
  userId: string
  userName: string
  userEmail: string
  activityType: string
  productName: string
  date: string
}

interface Stats {
  totalViews: number
  totalCartAdds: number
  topProduct: { name: string; count: number } | null
  topUser: { label: string; count: number } | null
}

const TYPES = ['all', 'view_product', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'search']

const TYPE_LABEL: Record<string, string> = {
  all: 'All Activities',
  view_product: 'Product Views',
  add_to_cart: 'Cart Adds',
  remove_from_cart: 'Cart Removes',
  begin_checkout: 'Checkouts Started',
  search: 'Searches',
}

// Color-coded badge per activity type
const BADGE_CLASS: Record<string, string> = {
  view_product: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-0',
  add_to_cart: 'bg-green-100 text-green-700 hover:bg-green-100 border-0',
  remove_from_cart: 'bg-red-100 text-red-700 hover:bg-red-100 border-0',
  begin_checkout: 'bg-purple-100 text-purple-700 hover:bg-purple-100 border-0',
  search: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100 border-0',
}

export function UserActivityClient({ activities, stats }: { activities: Activity[]; stats: Stats }) {
  const [type, setType] = useState('all')
  const filtered = type === 'all' ? activities : activities.filter((a) => a.activityType === type)

  return (
    <div className="p-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Total Product Views</p>
              <p className="text-xl font-bold text-stone-900">{stats.totalViews}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-50">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Total Cart Adds</p>
              <p className="text-xl font-bold text-stone-900">{stats.totalCartAdds}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-50">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Most Viewed Product</p>
              <p className="text-sm font-semibold text-stone-900 truncate" title={stats.topProduct?.name}>
                {stats.topProduct ? stats.topProduct.name : '—'}
              </p>
              {stats.topProduct && (
                <p className="text-xs text-neutral-400">{stats.topProduct.count} views</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-50">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Most Active User</p>
              <p className="text-sm font-semibold text-stone-900 truncate" title={stats.topUser?.label}>
                {stats.topUser ? stats.topUser.label : '—'}
              </p>
              {stats.topUser && (
                <p className="text-xs text-neutral-400">{stats.topUser.count} events</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-sm text-neutral-500">
          Showing {filtered.length} recent event{filtered.length === 1 ? '' : 's'}
          {type !== 'all' && ` · ${TYPE_LABEL[type]}`}
        </p>
        <div className="w-56">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity table */}
      <div className="border rounded-md bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Activity</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{a.userName}</div>
                  {a.userEmail && <div className="text-xs text-neutral-400">{a.userEmail}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge className={BADGE_CLASS[a.activityType] ?? 'bg-neutral-100 text-neutral-600 border-0'}>
                    {a.activityType.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-neutral-700">{a.productName || '—'}</td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{a.date}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-neutral-400">No activity recorded yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
