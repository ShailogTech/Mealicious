import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireErpRole } from '@/lib/erp-session'

const SECTIONS = ['Assets', 'Liabilities', 'Equity']

export async function GET(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const items = await db.erpBalanceSheetItem.findMany({
    orderBy: [{ section: 'asc' }, { createdAt: 'desc' }],
  })
  // Grouped by section with totals for the Assets = Liabilities + Equity check.
  const grouped: Record<string, { id: string; itemName: string; amount: number }[]> = {
    Assets: [], Liabilities: [], Equity: [],
  }
  for (const it of items) {
    if (!grouped[it.section]) grouped[it.section] = []
    grouped[it.section].push({ id: it.id, itemName: it.itemName, amount: it.amount })
  }
  const totalAssets = grouped.Assets.reduce((s, i) => s + i.amount, 0)
  const totalLiabilities = grouped.Liabilities.reduce((s, i) => s + i.amount, 0)
  const totalEquity = grouped.Equity.reduce((s, i) => s + i.amount, 0)
  return NextResponse.json({
    items: grouped,
    totals: {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      liabilitiesAndEquity: totalLiabilities + totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    },
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireErpRole(req, 'financedept')
  if (error) return error
  const body = await req.json()
  const section = String(body.section || '').trim()
  const itemName = String(body.itemName || '').trim()
  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: 'Section must be Assets, Liabilities or Equity' }, { status: 400 })
  }
  if (!itemName) return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
  const created = await db.erpBalanceSheetItem.create({
    data: {
      section,
      itemName,
      amount: Number(body.amount) || 0,
      asOfYear: Number(body.asOfYear) || 2026,
      asOfMonth: Number(body.asOfMonth) || 3,
    },
  })
  return NextResponse.json({ item: created })
}
