'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Eye } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface OrderItem { name: string; quantity: number; price: number }
interface CustomerOrder {
  id: string; orderNumber: string; status: string; paymentStatus: string
  paymentMethod: string; total: number; date: string; address: string; items: OrderItem[]
}
interface Customer {
  id: string; name: string; email: string; phone: string; role: string
  orderCount: number; joined: string; totalSpent: number; orders: CustomerOrder[]
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default', pending: 'outline', failed: 'destructive', refunded: 'secondary',
  delivered: 'default', shipped: 'secondary', confirmed: 'secondary', processing: 'outline', cancelled: 'destructive',
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<Customer | null>(null)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="p-6">
      <div className="relative w-72 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input className="pl-9" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="border rounded-md bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Orders</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Total Spent</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-600">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-neutral-600">{c.email}</td>
                <td className="px-4 py-3 text-neutral-600">{c.phone || '-'}</td>
                <td className="px-4 py-3">{c.orderCount}</td>
                <td className="px-4 py-3 font-semibold text-green-700">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{c.role}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-500">{c.joined}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(c)}>
                    <Eye className="h-4 w-4" /> View
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-neutral-400">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer details dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Profile */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium">Email:</span> <span className="text-neutral-600">{viewing.email}</span></div>
                  <div><span className="font-medium">Phone:</span> <span className="text-neutral-600">{viewing.phone || '—'}</span></div>
                  <div><span className="font-medium">Joined:</span> <span className="text-neutral-600">{viewing.joined}</span></div>
                  <div><span className="font-medium">Total Spent:</span> <span className="text-green-700 font-semibold">₹{viewing.totalSpent.toLocaleString('en-IN')}</span></div>
                </div>

                <Separator />

                {/* Recent orders */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Order History ({viewing.orderCount} total)</h3>
                  {viewing.orders.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-4">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {viewing.orders.map(o => (
                        <div key={o.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="font-mono text-sm font-medium">{o.orderNumber}</span>
                              <span className="text-xs text-neutral-400 ml-2">{o.date}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <Badge variant={STATUS_VARIANT[o.status] ?? 'outline'} className="capitalize">{o.status}</Badge>
                              <Badge variant={STATUS_VARIANT[o.paymentStatus] ?? 'outline'} className="capitalize">{o.paymentStatus}</Badge>
                              <Badge variant="secondary">{o.paymentMethod || 'COD'}</Badge>
                            </div>
                          </div>
                          {o.address && (
                            <p className="text-xs text-neutral-500 mt-1.5">📍 {o.address}</p>
                          )}
                          <div className="mt-2">
                            {o.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-xs text-neutral-600">
                                <span>{item.quantity}× {item.name}</span>
                                <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-semibold mt-1 pt-1 border-t">
                              <span>Total</span>
                              <span>₹{o.total.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
