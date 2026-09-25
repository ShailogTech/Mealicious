'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, TrendingUp, TrendingDown, DollarSign, FileText, Building2, AlertCircle, Plus, Trash2, Scale } from 'lucide-react'
import Link from 'next/link'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Line, LineChart } from 'recharts'

interface Kpi { label: string; value: number; format: 'inr' }
interface BalanceSheetItem { id: string; itemName: string; amount: number }
interface BalanceSheetTotals {
  assets: number
  liabilities: number
  equity: number
  liabilitiesAndEquity: number
  balanced: boolean
}
interface Props {
  kpis: Kpi[]
  monthlyTrend: { month: string; income: number; expense: number }[]
  expenseByCategory: { category: string; amount: number }[]
  accountEntries: { id: string; type: string; partyName: string; amount: number; balance: number; status: string; dueDate: string }[]
  budgets: { id: string; department: string; category: string; allocated: number; spent: number }[]
  fixedAssets: { id: string; name: string; category: string; purchaseValue: number; currentValue: number; status: string }[]
  balanceSheet: { items: { Assets: BalanceSheetItem[]; Liabilities: BalanceSheetItem[]; Equity: BalanceSheetItem[] }; totals: BalanceSheetTotals }
  journalCount: number
}

const BS_SECTIONS = ['Assets', 'Liabilities', 'Equity']

const PIE_COLORS = ['#1b4332', '#d97706', '#3b7ea1', '#c1573b', '#78716c', '#e8a93b', '#2d6b4f', '#a3690f']
const incomeConfig = { income: { label: 'Income', color: '#1b4332' }, expense: { label: 'Expense', color: '#c1573b' } } satisfies ChartConfig

function inr(n: number) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
const STATUS_VARIANT: Record<string, 'secondary' | 'destructive' | 'outline'> = {
  Open: 'outline', Settled: 'secondary', Overdue: 'destructive', 'Partially Paid': 'secondary',
}

export function FinanceDeptClient({ kpis, monthlyTrend, expenseByCategory, accountEntries, budgets, fixedAssets, balanceSheet, journalCount }: Props) {
  const kpiIcons = [DollarSign, TrendingDown, TrendingUp, FileText, FileText, Building2, AlertCircle, AlertCircle]
  const kpiColors = ['text-emerald-600', 'text-red-600', kpis[2]?.value >= 0 ? 'text-emerald-600' : 'text-red-600', 'text-blue-600', 'text-orange-600', 'text-purple-600', 'text-amber-600', 'text-red-600']

  // Balance sheet local state (add/delete without full page reload)
  const [bsItems, setBsItems] = useState(balanceSheet.items)
  const [bsAddOpen, setBsAddOpen] = useState(false)
  const [bsSaving, setBsSaving] = useState(false)
  const [fSection, setFSection] = useState('Assets')
  const [fItemName, setFItemName] = useState('')
  const [fAmount, setFAmount] = useState('')

  const bsTotals: BalanceSheetTotals = (() => {
    const sum = (section: keyof typeof bsItems) => bsItems[section].reduce((s, i) => s + i.amount, 0)
    const assets = sum('Assets')
    const liabilities = sum('Liabilities')
    const equity = sum('Equity')
    return {
      assets, liabilities, equity,
      liabilitiesAndEquity: liabilities + equity,
      balanced: Math.abs(assets - (liabilities + equity)) < 0.01,
    }
  })()

  async function handleAddBsItem() {
    const name = fItemName.trim()
    if (!name) { toast.error('Item name is required'); return }
    const amount = Number(fAmount) || 0
    setBsSaving(true)
    try {
      const res = await fetch('/api/administrator/balance-sheet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: fSection, itemName: name, amount }),
      })
      if (res.ok) {
        const { item } = await res.json()
        setBsItems((prev) => ({ ...prev, [item.section]: [{ id: item.id, itemName: item.itemName, amount: item.amount }, ...prev[item.section as keyof typeof prev]] }))
        toast.success('Balance sheet item added')
        setBsAddOpen(false)
        setFItemName(''); setFAmount('')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Add failed')
      }
    } finally {
      setBsSaving(false)
    }
  }

  async function handleDeleteBsItem(item: BalanceSheetItem, section: string) {
    const res = await fetch(`/api/administrator/balance-sheet/${item.id}`, { method: 'DELETE' }).catch(() => null)
    if (res && res.ok) {
      setBsItems((prev) => ({ ...prev, [section]: prev[section as keyof typeof prev].filter((x) => x.id !== item.id) }))
      toast.success('Item removed')
    } else {
      toast.error('Delete failed')
    }
  }

  function renderBsSection(title: string, section: 'Assets' | 'Liabilities' | 'Equity') {
    const items = bsItems[section] ?? []
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{title}</p>
        {items.length === 0 ? (
          <p className="text-sm text-stone-400 py-3">No {title.toLowerCase()} items yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-stone-100 group">
                  <td className="py-2">{it.itemName}</td>
                  <td className="py-2 text-right font-medium whitespace-nowrap">{inr(it.amount)}</td>
                  <td className="py-2 pl-2 w-8">
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteBsItem(it, section)} title="Remove item">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div>
      <ErpPageHeader
        title="Finance Department"
        description="General ledger, AP/AR, budgets, fixed assets, P&L, and financial analytics."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link href="/administrator/finance">Transactions</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href="/administrator/expenses">Expenses</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href="/administrator/invoices">Invoices</Link></Button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => {
          const Icon = kpiIcons[i] || DollarSign
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{kpi.label}</p>
                  <Icon className={`h-4 w-4 ${kpiColors[i] || 'text-stone-500'}`} />
                </div>
                <p className="mt-2 text-lg font-black text-stone-900">{inr(kpi.value)}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Income vs Expense trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">Income vs Expense (6 months)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={incomeConfig} className="h-[240px] w-full">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => inr(Number(v))} width={70} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No expense data.</p>
            ) : (
              <ChartContainer config={{ amount: { label: 'Amount', color: '#1b4332' } }} className="h-[240px] w-full">
                <BarChart data={expenseByCategory} layout="vertical">
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v) => inr(Number(v))} />
                  <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={9} width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} maxBarThickness={20} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AP / AR */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Accounts Payable & Receivable</CardTitle></CardHeader>
        <CardContent>
          {accountEntries.length === 0 ? (
            <p className="text-sm text-stone-500 py-4 text-center">No AP/AR entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  <th className="py-2 font-semibold">Type</th><th className="font-semibold">Party</th>
                  <th className="font-semibold">Amount</th><th className="font-semibold">Balance</th>
                  <th className="font-semibold">Due Date</th><th className="font-semibold">Status</th>
                </tr></thead>
                <tbody>
                  {accountEntries.map((a) => (
                    <tr key={a.id} className="border-b border-stone-100">
                      <td><Badge variant={a.type === 'Receivable' ? 'secondary' : 'outline'}>{a.type}</Badge></td>
                      <td className="py-2">{a.partyName}</td>
                      <td>{inr(a.amount)}</td>
                      <td className="font-semibold">{inr(a.balance)}</td>
                      <td className="text-stone-500">{a.dueDate || '—'}</td>
                      <td><Badge variant={STATUS_VARIANT[a.status] ?? 'secondary'}>{a.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Budget tracker */}
        <Card>
          <CardHeader><CardTitle className="text-base">Budget Allocation</CardTitle></CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No budgets set.</p>
            ) : (
              <div className="space-y-3">
                {budgets.map((b) => {
                  const pct = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{b.department} · {b.category}</span>
                        <span className="text-stone-500">{inr(b.spent)} / {inr(b.allocated)}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed assets */}
        <Card>
          <CardHeader><CardTitle className="text-base">Fixed Assets</CardTitle></CardHeader>
          <CardContent>
            {fixedAssets.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No fixed assets registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                    <th className="py-2 font-semibold">Asset</th><th className="font-semibold">Type</th>
                    <th className="font-semibold">Value</th><th className="font-semibold">Status</th>
                  </tr></thead>
                  <tbody>
                    {fixedAssets.map((a) => (
                      <tr key={a.id} className="border-b border-stone-100">
                        <td className="py-2">{a.name}</td>
                        <td><Badge variant="outline">{a.category}</Badge></td>
                        <td>{inr(a.currentValue)}</td>
                        <td><Badge variant={a.status === 'Active' ? 'secondary' : 'destructive'}>{a.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Balance Sheet — Assets = Liabilities + Equity */}
      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-stone-500" />
            <CardTitle className="text-base">Balance Sheet</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setBsAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Assets */}
            <div>
              {renderBsSection('Assets', 'Assets')}
              <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-stone-200 text-sm font-bold text-stone-900">
                <span>Total Assets</span>
                <span>{inr(bsTotals.assets)}</span>
              </div>
            </div>
            {/* Right: Liabilities + Equity */}
            <div>
              {renderBsSection('Liabilities', 'Liabilities')}
              <div className="mt-4">
                {renderBsSection('Equity', 'Equity')}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-stone-200 text-sm font-bold text-stone-900">
                <span>Total Liabilities + Equity</span>
                <span>{inr(bsTotals.liabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100">
            {bsTotals.balanced ? (
              <Badge className="border-transparent bg-emerald-100 text-emerald-800">Balanced — Assets = Liabilities + Equity</Badge>
            ) : (
              <Badge variant="destructive">
                Out of balance by {inr(Math.abs(bsTotals.assets - bsTotals.liabilitiesAndEquity))}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card className="bg-stone-50">
        <CardHeader><CardTitle className="text-base">Finance Roadmap — {journalCount} journal entries</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-stone-500">
            {[
              'General Ledger (full double-entry)', 'GST/Tax Management with filing', 'Payroll Integration',
              'P&L Statement generator', 'Cash Flow Statement',
              'Bank Reconciliation', 'Payment Approval Workflow', 'Forecasting & Financial Analysis',
              'Audit Trail logging', 'Financial compliance reports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" /> {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3">P&L, Budgets, AP/AR, Fixed Assets, Balance Sheet, and Expense tracking are live above. Full double-entry GL and tax filing are on the roadmap.</p>
        </CardContent>
      </Card>

      {/* Add Balance Sheet Item dialog */}
      <Dialog open={bsAddOpen} onOpenChange={(o) => { setBsAddOpen(o); if (!o) { setFSection('Assets'); setFItemName(''); setFAmount('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Balance Sheet Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Section <span className="text-red-500">*</span></Label>
              <Select value={fSection} onValueChange={setFSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BS_SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Item Name <span className="text-red-500">*</span></Label>
              <Input value={fItemName} onChange={(e) => setFItemName(e.target.value)} placeholder="e.g. Cash & Bank / Loans / Share Capital" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" value={fAmount} onChange={(e) => setFAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBsAddOpen(false)} disabled={bsSaving}>Cancel</Button>
            <Button onClick={handleAddBsItem} disabled={bsSaving}>
              {bsSaving ? 'Adding…' : <><Plus className="h-4 w-4" /> Add</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
