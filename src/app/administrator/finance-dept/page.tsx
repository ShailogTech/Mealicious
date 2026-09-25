export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { redirect } from 'next/navigation'
import { FinanceDeptClient } from './FinanceDeptClient'

async function getData() {
  const [transactions, invoices, purchaseOrders, expenses, journalEntries, accountEntries, budgets, fixedAssets, balanceSheetItems] = await Promise.all([
    db.erpTransaction.findMany({ select: { type: true, amount: true, date: true, category: true } }),
    db.erpInvoice.findMany({ select: { grandTotal: true, date: true, paymentMode: true } }),
    db.erpPurchaseOrder.findMany({ select: { amount: true, status: true, vendor: true } }),
    db.erpExpense.findMany({ select: { amount: true, status: true, category: true } }).catch(() => []),
    db.erpJournalEntry.findMany({ select: { id: true, amount: true, debitAccount: true, creditAccount: true, description: true } }).catch(() => []),
    db.erpAccountEntry.findMany({ select: { id: true, type: true, partyName: true, amount: true, balance: true, status: true, dueDate: true } }).catch(() => []),
    db.erpBudget.findMany({ select: { id: true, department: true, category: true, allocated: true, spent: true } }).catch(() => []),
    db.erpFixedAsset.findMany({ select: { id: true, name: true, category: true, purchaseValue: true, currentValue: true, status: true } }).catch(() => []),
    db.erpBalanceSheetItem.findMany({ select: { id: true, section: true, itemName: true, amount: true } }).catch(() => []),
  ])

  const totalIncome = transactions.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0)
  const netProfit = totalIncome - totalExpense
  const totalReceivable = accountEntries.filter((a) => a.type === 'Receivable').reduce((s, a) => s + a.balance, 0)
  const totalPayable = accountEntries.filter((a) => a.type === 'Payable').reduce((s, a) => s + a.balance, 0)
  const totalAssets = fixedAssets.reduce((s, a) => s + a.currentValue, 0)
  const pendingExpenses = expenses.filter((e) => e.status === 'Pending').reduce((s, e) => s + e.amount, 0)
  const pendingPOs = purchaseOrders.filter((p) => p.status !== 'Received' && p.status !== 'Rejected').reduce((s, p) => s + p.amount, 0)

  // Monthly trend (last 6 months)
  const now = new Date()
  const monthlyTrend: { month: string; income: number; expense: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString('en-IN', { month: 'short' })
    const monthTransactions = transactions.filter((t) => {
      const td = new Date(t.date)
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
    })
    monthlyTrend.push({
      month: label,
      income: monthTransactions.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0),
      expense: monthTransactions.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0),
    })
  }

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {}
  for (const t of transactions.filter((t) => t.type === 'Expense')) {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
  }

  return {
    kpis: [
      { label: 'Total Revenue', value: totalIncome, format: 'inr' as const },
      { label: 'Total Expenses', value: totalExpense, format: 'inr' as const },
      { label: 'Net Profit', value: netProfit, format: 'inr' as const },
      { label: 'Receivables', value: totalReceivable, format: 'inr' as const },
      { label: 'Payables', value: totalPayable, format: 'inr' as const },
      { label: 'Fixed Assets', value: totalAssets, format: 'inr' as const },
      { label: 'Pending Expenses', value: pendingExpenses, format: 'inr' as const },
      { label: 'Pending POs', value: pendingPOs, format: 'inr' as const },
    ],
    monthlyTrend,
    expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })).slice(0, 8),
    accountEntries: accountEntries.slice(0, 10).map((a) => ({
      id: a.id, type: a.type, partyName: a.partyName, amount: a.amount, balance: a.balance,
      status: a.status, dueDate: a.dueDate ? a.dueDate.toISOString().slice(0, 10) : '',
    })),
    budgets: budgets.map((b) => ({
      id: b.id, department: b.department, category: b.category, allocated: b.allocated, spent: b.spent,
    })),
    fixedAssets: fixedAssets.slice(0, 10).map((a) => ({
      id: a.id, name: a.name, category: a.category, purchaseValue: a.purchaseValue, currentValue: a.currentValue, status: a.status,
    })),
    balanceSheet: {
      items: {
        Assets: balanceSheetItems.filter((b) => b.section === 'Assets').map((b) => ({ id: b.id, itemName: b.itemName, amount: b.amount })),
        Liabilities: balanceSheetItems.filter((b) => b.section === 'Liabilities').map((b) => ({ id: b.id, itemName: b.itemName, amount: b.amount })),
        Equity: balanceSheetItems.filter((b) => b.section === 'Equity').map((b) => ({ id: b.id, itemName: b.itemName, amount: b.amount })),
      },
      totals: (() => {
        const sum = (section: string) => balanceSheetItems.filter((b) => b.section === section).reduce((s, b) => s + b.amount, 0)
        const assets = sum('Assets')
        const liabilities = sum('Liabilities')
        const equity = sum('Equity')
        return {
          assets,
          liabilities,
          equity,
          liabilitiesAndEquity: liabilities + equity,
          balanced: Math.abs(assets - (liabilities + equity)) < 0.01,
        }
      })(),
    },
    journalCount: journalEntries.length,
  }
}

export default async function FinanceDeptPage() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  const data = await getData()
  return <FinanceDeptClient {...data} />
}
