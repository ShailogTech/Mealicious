'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndianRupee, Users, FileText, AlertTriangle } from 'lucide-react'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface SeriesPoint { label: string; revenue: number; expense: number }

interface DashboardData {
  revenue: number
  activeEmployees: number
  pendingInvoices: number
  lowStockCount: number
  recentInvoices: { id: string; invoiceNumber: string; customerName: string; grandTotal: number; date: string }[]
  series: SeriesPoint[]
}

const chartConfig = {
  revenue: { label: 'Revenue', color: '#d97706' },
  expense: { label: 'Expense', color: '#78716c' },
} satisfies ChartConfig

function inr(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const kpis = [
    { label: 'Total Revenue', value: inr(data.revenue), icon: IndianRupee, accent: 'text-amber-600' },
    { label: 'Active Employees', value: data.activeEmployees, icon: Users, accent: 'text-emerald-600' },
    { label: 'Pending Invoices', value: data.pendingInvoices, icon: FileText, accent: 'text-blue-600' },
    { label: 'Low-Stock Items', value: data.lowStockCount, icon: AlertTriangle, accent: 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{kpi.label}</p>
                  <Icon className={`h-4 w-4 ${kpi.accent}`} />
                </div>
                <p className="mt-2 text-2xl font-black text-stone-900">{kpi.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue / Expense chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs Expense (12 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={data.series}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => inr(Number(v))} width={70} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentInvoices.length === 0 ? (
            <p className="text-sm text-stone-500 py-6 text-center">No invoices yet. Create one from “New Invoice”.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                    <th className="py-2 font-semibold">Invoice #</th>
                    <th className="py-2 font-semibold">Customer</th>
                    <th className="py-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-stone-100">
                      <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="py-2">{inv.customerName}</td>
                      <td className="py-2 text-right font-semibold">{inr(inv.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
