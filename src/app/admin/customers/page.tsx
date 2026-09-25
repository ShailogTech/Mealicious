export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CustomersClient } from './CustomersClient'
import { format } from 'date-fns'

async function getCustomers() {
  // Fetch users with order counts AND their recent orders (for the details view).
  const users = await db.user.findMany({
    include: {
      _count: { select: { orders: true } },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, orderNumber: true, status: true, paymentStatus: true,
          total: true, paymentMethod: true, createdAt: true,
          shippingAddr: true, items: { select: { name: true, quantity: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? '',
    role: u.role,
    orderCount: u._count.orders,
    joined: format(new Date(u.createdAt), 'dd MMM yyyy'),
    totalSpent: u.orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
    orders: u.orders.map(o => {
      let addr: Record<string, string> = {}
      try { addr = JSON.parse(o.shippingAddr) } catch {}
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod ?? '',
        total: o.total,
        date: format(new Date(o.createdAt), 'dd MMM yyyy'),
        address: [addr.name, addr.address, addr.city, addr.state, addr.pincode, addr.phone].filter(Boolean).join(', '),
        items: o.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      }
    }),
  }))
}

export default async function CustomersPage() {
  const customers = await getCustomers()
  return (
    <div>
      <AdminHeader title="Customers" />
      <CustomersClient customers={customers} />
    </div>
  )
}
