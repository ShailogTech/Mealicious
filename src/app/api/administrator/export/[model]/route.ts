import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'

/**
 * Generic export. Super-admin only (bulk data extract).
 * GET /api/administrator/export/<model>?format=csv|xlsx|pdf
 */
const ALLOWED = [
  'employees', 'invoices', 'inventory', 'finance',
  'crm', 'sales', 'purchase', 'vendors',
  'manufacturing', 'supplychain', 'projects',
  'franchise', 'distributors', 'retail', 'investors', 'campaigns', 'assets',
  'shifts', 'teams', 'groups',
  'expenses',
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
    case 'expenses': return await db.erpExpense.findMany({ orderBy: { date: 'desc' } }) as unknown as Record<string, unknown>[]
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

async function toXlsx(rows: Record<string, unknown>[], model: string): Promise<Buffer> {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(model)
  if (rows.length === 0) {
    ws.addRow(['No data'])
    const buf = await wb.xlsx.writeBuffer()
    return Buffer.from(buf)
  }
  const headers = Object.keys(rows[0])
  ws.addRow(headers)
  for (const row of rows) ws.addRow(headers.map((h) => row[h] ?? ''))
  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } }
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.columns.forEach((col) => { col.width = 18 })
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

async function toPdf(rows: Record<string, unknown>[], model: string): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(`Mealicious ERP — ${model} export`, 40, 30)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 40, 46)

  if (rows.length === 0) {
    doc.text('No data to export.', 40, 70)
    return Buffer.from(doc.output('arraybuffer'))
  }

  const headers = Object.keys(rows[0])
  const body = rows.map((row) => headers.map((h) => {
    const v = row[h]
    if (v == null) return ''
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    return String(v)
  }))

  // jspdf-autotable v5 attaches via module augmentation
  const autoTable = (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable
  autoTable({
    startY: 60,
    head: [headers],
    body,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [27, 67, 50], textColor: 255, fontSize: 8 },
    margin: { left: 40, right: 40 },
  })

  return Buffer.from(doc.output('arraybuffer'))
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ model: string }> }) {
  const user = await getErpSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden — export is Super Admin only' }, { status: 403 })

  const { model } = await params
  if (!ALLOWED.includes(model as ModelKey)) {
    return NextResponse.json({ error: 'Unknown model for export' }, { status: 400 })
  }

  const format = (req.nextUrl.searchParams.get('format') || 'csv').toLowerCase()
  const rows = await fetchRows(model as ModelKey)

  if (format === 'xlsx') {
    const buf = await toXlsx(rows, model)
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${model}.xlsx"`,
      },
    })
  }

  if (format === 'pdf') {
    const buf = await toPdf(rows, model)
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${model}.pdf"`,
      },
    })
  }

  // Default: CSV
  const csv = toCsv(rows)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${model}.csv"`,
    },
  })
}
