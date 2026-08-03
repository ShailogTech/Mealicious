'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Wallet, TrendingUp, TrendingDown, DollarSign, FileText, Building2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Line, LineChart } from 'recharts'

interface Kpi { label: string; value: number; format: 'inr' }
interface Props {
  kpis: Kpi[]
  monthlyTrend: { month: string; income: number; expense: number }[]
  expenseByCategory: { category: string; amount: number }[]
  accountEntries: { id: string; type: string; partyName: string; amount: number; balance: number; status: string; dueDate: string }[]
  budgets: { id: string; department: string; category: string; allocated: number; spent: number }[]
  fixedAssets: { id: string; name: string; category: string; purchaseValue: number; currentValue: number; status: string }[]
  journalCount: number
}

const PIE_COLORS = ['#1b4332', '#d97706', '#3b7ea1', '#c1573b', '#78716c', '#e8a93b', '#2d6b4f', '#a3690f']
const incomeConfig = { income: { label: 'Income', color: '#1b4332' }, expense: { label: 'Expense', color: '#c1573b' } } satisfies ChartConfig

function inr(n: number) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
const STATUS_VARIANT: Record<string, 'secondary' | 'destructive' | 'outline'> = {
  Open: 'outline', Settled: 'secondary', Overdue: 'destructive', 'Partially Paid': 'secondary',
}

export function FinanceDeptClient({ kpis, monthlyTrend, expenseByCategory, accountEntries, budgets, fixedAssets, journalCount }: Props) {
  const kpiIcons = [DollarSign, TrendingDown, TrendingUp, FileText, FileText, Building2, AlertCircle, AlertCircle]
  const kpiColors = ['text-emerald-600', 'text-red-600', kpis[2]?.value >= 0 ? 'text-emerald-600' : 'text-red-600', 'text-blue-600', 'text-orange-600', 'text-purple-600', 'text-amber-600', 'text-red-600']

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

      {/* Roadmap */}
      <Card className="bg-stone-50">
        <CardHeader><CardTitle className="text-base">Finance Roadmap — {journalCount} journal entries</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-stone-500">
            {[
              'General Ledger (full double-entry)', 'GST/Tax Management with filing', 'Payroll Integration',
              'P&L Statement generator', 'Balance Sheet generator', 'Cash Flow Statement',
              'Bank Reconciliation', 'Payment Approval Workflow', 'Forecasting & Financial Analysis',
              'Audit Trail logging', 'Financial compliance reports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" /> {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3">P&L, Budgets, AP/AR, Fixed Assets, and Expense tracking are live above. Full double-entry GL and tax filing are on the roadmap.</p>
        </CardContent>
      </Card>
    </div>
  )
}
