'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Megaphone, Users, TrendingUp, Target, Rocket, Star, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { ErpPageHeader } from '@/components/administrator/ErpPageHeader'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'

interface Kpi { label: string; value: number; format: 'inr' | 'count' }
interface LeadStage { stage: string; count: number }
interface CampaignRow { id: string; status: string; budget: number; leads: number; roi: string; channel: string }
interface SocialRow { id: string; platform: string; status: string; budget: number; spent: number; impressions: number; clicks: number; conversions: number }
interface LoyaltyRow { id: string; tier: string; points: number; totalSpent: number; referrals: number }
interface LaunchRow { id: string; productName: string; status: string; launchDate: string }
interface ChannelDatum { channel: string; total: number }
interface SegmentDatum { segment: string; count: number }

interface Props {
  kpis: Kpi[]
  leadsByStage: LeadStage[]
  campaigns: CampaignRow[]
  socialCampaigns: SocialRow[]
  loyaltyMembers: LoyaltyRow[]
  launches: LaunchRow[]
  salesByChannel: ChannelDatum[]
  segmentCounts: SegmentDatum[]
  totalCampaignLeads: number
  loyaltyPoints: number
  loyaltyRevenue: number
}

const PIE_COLORS = ['#1b4332', '#d97706', '#3b7ea1', '#c1573b', '#78716c', '#e8a93b']
const channelConfig = { total: { label: 'Sales', color: '#d97706' } } satisfies ChartConfig
const leadsConfig = { count: { label: 'Leads', color: '#3b7ea1' } } satisfies ChartConfig

function inr(n: number) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
function fmtCount(n: number) { return Number(n || 0).toLocaleString('en-IN') }

const TIER_COLOR: Record<string, string> = { Bronze: '#a3690f', Silver: '#78716c', Gold: '#d97706', Platinum: '#6d5bd0' }
const STATUS_VARIANT: Record<string, 'secondary' | 'destructive' | 'outline'> = {
  New: 'outline', Live: 'secondary', Completed: 'secondary', Planned: 'outline',
}

export function MarketingClient({ kpis, leadsByStage, campaigns, socialCampaigns, loyaltyMembers, launches, salesByChannel, segmentCounts, totalCampaignLeads, loyaltyPoints, loyaltyRevenue }: Props) {
  return (
    <div>
      <ErpPageHeader
        title="Marketing Department"
        description="CRM, campaigns, customer insights, loyalty, and product launches."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link href="/administrator/crm">CRM / Leads</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href="/administrator/campaigns">Campaigns</Link></Button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = [Megaphone, Users, TrendingUp, Target, Rocket, Star, BarChart3, Megaphone][kpis.indexOf(kpi) % 8]
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{kpi.label}</p>
                  <Icon className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-lg font-black text-stone-900">
                  {kpi.format === 'inr' ? inr(kpi.value) : fmtCount(kpi.value)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Leads by stage */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Lead Pipeline by Stage</CardTitle></CardHeader>
          <CardContent>
            {leadsByStage.every((s) => s.count === 0) ? (
              <p className="text-sm text-stone-500 py-6 text-center">No leads yet.</p>
            ) : (
              <ChartContainer config={leadsConfig} className="h-[220px] w-full">
                <BarChart data={leadsByStage}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarThickness={32} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales by channel */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Sales by Channel</CardTitle></CardHeader>
          <CardContent>
            {salesByChannel.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No sales data.</p>
            ) : (
              <ChartContainer config={channelConfig} className="h-[220px] w-full">
                <BarChart data={salesByChannel} layout="vertical">
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => inr(Number(v))} />
                  <YAxis type="category" dataKey="channel" tickLine={false} axisLine={false} fontSize={10} width={90} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} maxBarThickness={24} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active campaigns */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Active Marketing Campaigns</CardTitle></CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-stone-500 py-4 text-center">No campaigns yet. <Link href="/administrator/campaigns" className="text-amber-600">Create one →</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  <th className="py-2 font-semibold">Channel</th><th className="font-semibold">Status</th>
                  <th className="font-semibold">Budget</th><th className="font-semibold">Leads</th><th className="font-semibold">ROI</th>
                </tr></thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-stone-100">
                      <td className="py-2">{c.channel}</td>
                      <td><Badge variant={STATUS_VARIANT[c.status] ?? 'secondary'}>{c.status}</Badge></td>
                      <td>{inr(c.budget)}</td>
                      <td>{c.leads}</td>
                      <td className="font-semibold">{c.roi || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Customer segments */}
        <Card>
          <CardHeader><CardTitle className="text-base">Customer Segmentation</CardTitle></CardHeader>
          <CardContent>
            {segmentCounts.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No customer data.</p>
            ) : (
              <ChartContainer config={{ count: { label: 'Customers', color: '#1b4332' } }} className="h-[200px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="count" />} />
                  <Pie data={segmentCounts} dataKey="count" nameKey="segment" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {segmentCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Loyalty program */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Loyalty Program</span>
            <span className="text-xs text-stone-500">{loyaltyMembers.length} members · {loyaltyPoints} pts</span>
          </CardTitle></CardHeader>
          <CardContent>
            {loyaltyMembers.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No loyalty members yet.</p>
            ) : (
              <div className="space-y-2">
                {loyaltyMembers.slice(0, 8).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: TIER_COLOR[m.tier] || '#78716c', color: '#fff' }}>{m.tier}</Badge>
                      <span>{m.points} pts</span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-500">{inr(m.totalSpent)} spent</span>
                      {m.referrals > 0 && <span className="ml-2 text-emerald-600">{m.referrals} refs</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product launches */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Rocket className="h-4 w-4" /> Product Launch Pipeline</CardTitle></CardHeader>
        <CardContent>
          {launches.length === 0 ? (
            <p className="text-sm text-stone-500 py-4 text-center">No product launches tracked yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {launches.map((l) => (
                <div key={l.id} className="border border-stone-200 rounded-lg p-3">
                  <p className="font-medium text-sm">{l.productName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={STATUS_VARIANT[l.status] ?? 'outline'}>{l.status}</Badge>
                    {l.launchDate && <span className="text-xs text-stone-400">{l.launchDate}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social campaigns */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" /> Social Media Campaigns</CardTitle></CardHeader>
        <CardContent>
          {socialCampaigns.length === 0 ? (
            <p className="text-sm text-stone-500 py-4 text-center">No social campaigns tracked yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  <th className="py-2 font-semibold">Platform</th><th className="font-semibold">Status</th>
                  <th className="font-semibold">Budget</th><th className="font-semibold">Spent</th>
                  <th className="font-semibold">Impressions</th><th className="font-semibold">Clicks</th><th className="font-semibold">Conv.</th>
                </tr></thead>
                <tbody>
                  {socialCampaigns.map((c) => (
                    <tr key={c.id} className="border-b border-stone-100">
                      <td className="py-2">{c.platform}</td>
                      <td><Badge variant={STATUS_VARIANT[c.status] ?? 'secondary'}>{c.status}</Badge></td>
                      <td>{inr(c.budget)}</td>
                      <td className="text-orange-600">{inr(c.spent)}</td>
                      <td>{fmtCount(c.impressions)}</td>
                      <td>{fmtCount(c.clicks)}</td>
                      <td className="font-semibold">{c.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card className="mt-6 bg-stone-50">
        <CardHeader><CardTitle className="text-base">Marketing Roadmap</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-stone-500">
            {[
              'Email/SMS/WhatsApp Marketing campaigns', 'Customer Reviews management', 'Marketing Analytics dashboard',
              'Market Research data collection', 'Real-time Reports & Dashboards', 'Sales Tracking integration',
              'Marketing Budget allocation', 'Promotions & Discount engine',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" /> {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3">These modules are on the roadmap. CRM, Campaigns, Social Campaigns, Loyalty, Segmentation, and Product Launches are live above.</p>
        </CardContent>
      </Card>
    </div>
  )
}
