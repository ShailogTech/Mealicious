import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'

/**
 * Generic CSV export. Super-admin only (bulk data extract).
 * GET /api/administrator/export/<model> returns a CSV of all rows.
 */
const ALLOWED = [
  'employees', 'invoices', 'inventory', 'finance',
  'crm', 'sales', 'purchase', 'vendors',
  'manufacturing', 'supplychain', 'projects',
  'franchise', 'distributors', 'retail', 'investors', 'campaigns', 'assets',
  'shifts', 'teams', 'groups',
] as const

type ModelKey = typeof ALLOWED[number]

// Map URL segment → a function returning rows as plain objects.
async function fetchRows(model: ModelKey): Promise<Record<string, unknown>[]> {
  switch (model) {
    case 'employees': {
      const rows = await db.erpEmployee.findMany()
      return rows.map((e) => ({ employeeCode: e.employeeCode, name: e.name, dept: e.dept, role: e.role, status: e.status, productivityScore: e.productivityScore }))
    }
    case 'invoices': return await db.erpInvoice.findMany({ select: { invoiceNumber: true, date: true, customerName: true, grandTotal: true, paymentMode: true } }) as unknown as Record<string, unknown>[]
    case 'inventory': return await db.erpInventoryItem.findMany() as unknown as Record<string, unknown>[]
    case 'finance': return await db.erpTransaction.findMany() as unknown as Record<string, unknown>[]
    case 'crm': return await db.erpLead.findMany() as unknown as Record<string, unknown>[]
    case 'sales': return await db.erpSalesOrder.findMany() as unknown as Record<string, unknown>[]
    case 'purchase': return await db.erpPurchaseOrder.findMany() as unknown as Record<string, unknown>[]
    case 'vendors': return await db.erpVendor.findMany() as unknown as Record<string, unknown>[]
    case 'manufacturing': return await db.erpProductionOrder.findMany() as unknown as Record<string, unknown>[]
    case 'supplychain': return await db.erpShipment.findMany() as unknown as Record<string, unknown>[]
    case 'projects': return await db.erpProject.findMany() as unknown as Record<string, unknown>[]
    case 'franchise': return await db.erpFranchise.findMany() as unknown as Record<string, unknown>[]
    case 'distributors': return await db.erpDistributor.findMany() as unknown as Record<string, unknown>[]
    case 'retail': return await db.erpRetailStore.findMany() as unknown as Record<string, unknown>[]
    case 'investors': return await db.erpInvestor.findMany() as unknown as Record<string, unknown>[]
    case 'campaigns': return await db.erpCampaign.findMany() as unknown as Record<string, unknown>[]
    case 'assets': return await db.erpAsset.findMany() as unknown as Record<string, unknown>[]
    case 'shifts': return await db.erpShift.findMany() as unknown as Record<string, unknown>[]
    case 'teams': return await db.erpTeam.findMany() as unknown as Record<string, unknown>[]
    case 'groups': return await db.erpGroup.findMany() as unknown as Record<string, unknown>[]
  }
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','))
  return lines.join('\n')
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ model: string }> }) {
  const user = await getErpSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden — export is Super Admin only' }, { status: 403 })

  const { model } = await params
  if (!ALLOWED.includes(model as ModelKey)) {
    return NextResponse.json({ error: 'Unknown model for export' }, { status: 400 })
  }
  const rows = await fetchRows(model as ModelKey)
  const csv = toCsv(rows)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${model}.csv"`,
    },
  })
}
