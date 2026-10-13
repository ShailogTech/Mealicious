export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { InvoicesClient } from './InvoicesClient'

async function getData() {
  const invoices = await db.erpInvoice.findMany({ orderBy: { date: 'desc' } })
  return {
    invoices: invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      date: i.date.toISOString().slice(0, 10),
      customerName: i.customerName,
      mobile: i.mobile ?? '',
      grandTotal: i.grandTotal,
      paymentMode: i.paymentMode,
    })),
  }
}

export default async function InvoicesPage() {
  const user = await requireErpPageUser()
  const { invoices } = await getData()
  return (
    <InvoicesClient
      invoices={invoices}
      canExport={user.role === 'SUPER_ADMIN'}
      canEdit={user.role === 'SUPER_ADMIN' || user.role === 'FINANCE'}
    />
  )
}
