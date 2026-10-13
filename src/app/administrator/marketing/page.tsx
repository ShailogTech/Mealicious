export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getErpSessionUser } from '@/lib/erp-session'
import { redirect } from 'next/navigation'
import { MarketingClient } from './MarketingClient'

async function getData() {
  const [leads, campaigns, socialCampaigns, loyaltyMembers, launches, customers, invoices, retailOrders] = await Promise.all([
    db.erpLead.findMany({ select: { id: true, stage: true, value: true } }),
    db.erpCampaign.findMany({ select: { id: true, status: true, budget: true, leads: true, roi: true, channel: true } }),
    db.erpSocialCampaign.findMany({ select: { id: true, platform: true, status: true, budget: true, spent: true, impressions: true, clicks: true, conversions: true } }),
    db.erpLoyaltyMember.findMany({ select: { id: true, tier: true, points: true, totalSpent: true, referrals: true } }),
    db.erpProductLaunch.findMany({ select: { id: true, productName: true, status: true, launchDate: true } }),
    db.erpCustomer.findMany({ select: { id: true, totalOrders: true, lifetimeValue: true, city: true, segment: true } }),
    db.erpInvoice.findMany({ select: { grandTotal: true, date: true }, take: 100, orderBy: { date: 'desc' } }),
    db.erpSalesOrder.findMany({ select: { amount: true, channel: true, status: true } }),
  ])

  // Marketing KPIs
  const wonDeals = leads.filter((l) => l.stage === 'Won')
  const totalPipelineValue = leads.reduce((s, l) => s + l.value, 0)
  const wonValue = wonDeals.reduce((s, l) => s + l.value, 0)
  const totalCampaignBudget = campaigns.reduce((s, c) => s + c.budget, 0)
  const totalCampaignLeads = campaigns.reduce((s, c) => s + c.leads, 0)
  const totalSocialSpend = socialCampaigns.reduce((s, c) => s + c.spent, 0)
  const totalImpressions = socialCampaigns.reduce((s, c) => s + c.impressions, 0)
  const totalClicks = socialCampaigns.reduce((s, c) => s + c.clicks, 0)
  const loyaltyPoints = loyaltyMembers.reduce((s, m) => s + m.points, 0)
  const loyaltyRevenue = loyaltyMembers.reduce((s, m) => s + m.totalSpent, 0)
  const totalCustomers = customers.length
  const avgLTV = totalCustomers > 0 ? customers.reduce((s, c) => s + c.lifetimeValue, 0) / totalCustomers : 0

  // Sales by channel (from retail orders)
  const salesByChannel: Record<string, number> = {}
  for (const o of retailOrders) { salesByChannel[o.channel] = (salesByChannel[o.channel] || 0) + o.amount }

  // Customer segments
  const segmentCounts: Record<string, number> = {}
  for (const c of customers) { segmentCounts[c.segment] = (segmentCounts[c.segment] || 0) + 1 }

  return {
    kpis: [
      { label: 'Pipeline Value', value: totalPipelineValue, format: 'inr' as const },
      { label: 'Won Deals Value', value: wonValue, format: 'inr' as const },
      { label: 'Campaign Budget', value: totalCampaignBudget, format: 'inr' as const },
      { label: 'Total Customers', value: totalCustomers, format: 'count' as const },
      { label: 'Avg Customer LTV', value: avgLTV, format: 'inr' as const },
      { label: 'Loyalty Members', value: loyaltyMembers.length, format: 'count' as const },
      { label: 'Social Impressions', value: totalImpressions, format: 'count' as const },
      { label: 'Social Spend', value: totalSocialSpend, format: 'inr' as const },
    ],
    leadsByStage: (['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'] as const).map((stage) => ({
      stage, count: leads.filter((l) => l.stage === stage).length,
    })),
    campaigns: campaigns.map((c) => ({ id: c.id, status: c.status, budget: c.budget, leads: c.leads, roi: c.roi, channel: c.channel })),
    socialCampaigns: socialCampaigns.map((c) => ({
      id: c.id, platform: c.platform, status: c.status, budget: c.budget, spent: c.spent,
      impressions: c.impressions, clicks: c.clicks, conversions: c.conversions,
    })),
    loyaltyMembers: loyaltyMembers.map((m) => ({
      id: m.id, tier: m.tier, points: m.points, totalSpent: m.totalSpent, referrals: m.referrals,
    })),
    launches: launches.map((l) => ({
      id: l.id, productName: l.productName, status: l.status,
      launchDate: l.launchDate ? l.launchDate.toISOString().slice(0, 10) : '',
    })),
    salesByChannel: Object.entries(salesByChannel).map(([channel, total]) => ({ channel, total })),
    segmentCounts: Object.entries(segmentCounts).map(([segment, count]) => ({ segment, count })),
    totalCampaignLeads,
    loyaltyPoints,
    loyaltyRevenue,
  }
}

export default async function MarketingPage() {
  const user = await getErpSessionUser()
  if (!user) redirect('/administrator/login')
  const data = await getData()
  return <MarketingClient {...data} />
}
