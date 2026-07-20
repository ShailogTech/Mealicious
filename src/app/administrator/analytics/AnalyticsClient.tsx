'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Cell } from 'recharts'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'

interface Kpi { label: string; value: number }
interface ChannelDatum { channel: string; total: number }
interface ModeDatum { mode: string; total: number }
interface LeadsDatum { channel: string; leads: number }

interface Props {
  kpis: Kpi[]
  salesByChannel: ChannelDatum[]
  revenueByMode: ModeDatum[]
  campaignLeads: LeadsDatum[]
  totalCampaignBudget: number
  avgDistributorTarget: number
}

const channelConfig = { total: { label: 'Sales', color: '#d97706' } } satisfies ChartConfig
const modeConfig = { total: { label: 'Revenue', color: '#1b4332' } } satisfies ChartConfig
const PIE_COLORS = ['#1b4332', '#d97706', '#3b7ea1', '#c1573b', '#78716c', '#e8a93b']

function inr(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function AnalyticsClient({ kpis, salesByChannel, revenueByMode, campaignLeads, totalCampaignBudget, avgDistributorTarget }: Props) {
  return (
    <div>
      <ErpPageHeader title="Analytics" description="Cross-module insights from sales, campaigns, and network." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{kpi.label}</p>
              <p className="mt-2 text-lg font-black text-stone-900">
                {kpi.label.includes('Leads') || kpi.label.includes('Retail') ? kpi.value : inr(kpi.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm text-stone-600">Total Campaign Budget</span>
          <span className="font-bold">{inr(totalCampaignBudget)}</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm text-stone-600">Avg Distributor Target Achievement</span>
          <span className="font-bold">{avgDistributorTarget}%</span>
        </CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales by channel */}
        <Card>
          <CardHeader><CardTitle className="text-base">Sales by Channel</CardTitle></CardHeader>
          <CardContent>
            {salesByChannel.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No sales data.</p>
            ) : (
              <ChartContainer config={channelConfig} className="h-[240px] w-full">
                <BarChart data={salesByChannel} layout="vertical">
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => inr(Number(v))} />
                  <YAxis type="category" dataKey="channel" tickLine={false} axisLine={false} fontSize={11} width={90} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} maxBarThickness={24} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by payment mode (pie) */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Payment Mode</CardTitle></CardHeader>
          <CardContent>
            {revenueByMode.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No invoice data.</p>
            ) : (
              <ChartContainer config={modeConfig} className="h-[240px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="total" />} />
                  <Pie data={revenueByMode} dataKey="total" nameKey="mode" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {revenueByMode.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign leads by channel */}
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Campaign Leads by Channel</CardTitle></CardHeader>
        <CardContent>
          {campaignLeads.length === 0 ? (
            <p className="text-sm text-stone-500 py-6 text-center">No campaign data.</p>
          ) : (
            <ChartContainer config={{ leads: { label: 'Leads', color: '#3b7ea1' } }} className="h-[220px] w-full">
              <BarChart data={campaignLeads}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="channel" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} maxBarThickness={40} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
