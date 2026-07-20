export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { DashboardClient } from './DashboardClient'

async function getDashboardData() {
  const now = new Date()
  // 12-month window ending this month.
  const months: { label: string; year: number; month: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleString('en-IN', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [
    invoices,
    employees,
    inventory,
    transactions,
    pendingInvoices,
    recentInvoices,
  ] = await Promise.all([
    db.erpInvoice.findMany({ where: { date: { gte: windowStart } }, select: { grandTotal: true, date: true } }),
    db.erpEmployee.count({ where: { status: 'Active' } }),
    db.erpInventoryItem.findMany({ select: { stock: true, reorderLevel: true, name: true } }),
    db.erpTransaction.findMany({ where: { date: { gte: windowStart } }, select: { type: true, amount: true, date: true } }),
    db.erpInvoice.count({ where: { paymentMode: 'Credit' } }),
    db.erpInvoice.findMany({ orderBy: { date: 'desc' }, take: 6, select: { id: true, invoiceNumber: true, customerName: true, grandTotal: true, date: true } }),
  ])

  const revenue = invoices.reduce((s, i) => s + i.grandTotal, 0)
  const lowStockItems = inventory.filter((i) => i.stock <= i.reorderLevel)

  // Bucket revenue/expense per month.
  const series = months.map((m) => {
    const rev = invoices
      .filter((i) => i.date.getFullYear() === m.year && i.date.getMonth() === m.month)
      .reduce((s, i) => s + i.grandTotal, 0)
    const exp = transactions
      .filter((t) => t.type === 'Expense' && t.date.getFullYear() === m.year && t.date.getMonth() === m.month)
      .reduce((s, t) => s + t.amount, 0)
    return { label: m.label, revenue: rev, expense: exp }
  })

  return {
    revenue,
    activeEmployees: employees,
    pendingInvoices,
    lowStockCount: lowStockItems.length,
    recentInvoices: recentInvoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      customerName: i.customerName,
      grandTotal: i.grandTotal,
      date: i.date.toISOString(),
    })),
    series,
  }
}

export default async function DashboardPage() {
  await requireErpPageUser()
  const data = await getDashboardData()
  return <DashboardClient data={data} />
}
