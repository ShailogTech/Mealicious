export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { AnalyticsClient } from './AnalyticsClient'

async function getData() {
  const [sales, invoices, campaigns, transactions, retail, distributors] = await Promise.all([
    db.erpSalesOrder.findMany({ select: { channel: true, amount: true, status: true } }),
    db.erpInvoice.findMany({ select: { grandTotal: true, paymentMode: true, date: true } }),
    db.erpCampaign.findMany({ select: { channel: true, budget: true, leads: true, status: true } }),
    db.erpTransaction.findMany({ select: { type: true, amount: true } }),
    db.erpRetailStore.findMany({ select: { monthlySales: true, city: true } }),
    db.erpDistributor.findMany({ select: { targetAchieved: true, status: true } }),
  ])

  // Sales by channel
  const byChannel: Record<string, number> = {}
  for (const s of sales) byChannel[s.channel] = (byChannel[s.channel] || 0) + s.amount
  const salesByChannel = Object.entries(byChannel).map(([channel, total]) => ({ channel, total }))

  // Revenue by payment mode
  const byMode: Record<string, number> = {}
  for (const i of invoices) byMode[i.paymentMode] = (byMode[i.paymentMode] || 0) + i.grandTotal
  const revenueByMode = Object.entries(byMode).map(([mode, total]) => ({ mode, total }))

  // Campaign leads by channel
  const leadsByChannel: Record<string, number> = {}
  for (const c of campaigns) leadsByChannel[c.channel] = (leadsByChannel[c.channel] || 0) + c.leads
  const campaignLeads = Object.entries(leadsByChannel).map(([channel, leads]) => ({ channel, leads }))

  const totalRevenue = invoices.reduce((s, i) => s + i.grandTotal, 0)
  const totalSales = sales.filter((s) => s.status === 'Completed').reduce((s, x) => s + x.amount, 0)
  const totalCampaignLeads = campaigns.reduce((s, c) => s + c.leads, 0)
  const totalCampaignBudget = campaigns.reduce((s, c) => s + c.budget, 0)
  const activeRetail = retail.length
  const avgDistributorTarget = distributors.length
    ? Math.round(distributors.reduce((s, d) => s + d.targetAchieved, 0) / distributors.length)
    : 0

  return {
    kpis: [
      { label: 'Total Invoice Revenue', value: totalRevenue },
      { label: 'Total Sales (completed)', value: totalSales },
      { label: 'Campaign Leads', value: totalCampaignLeads },
      { label: 'Active Retail Stores', value: activeRetail },
    ],
    salesByChannel,
    revenueByMode,
    campaignLeads,
    totalCampaignBudget,
    avgDistributorTarget,
  }
}

export default async function AnalyticsPage() {
  await requireErpPageUser()
  const data = await getData()
  return <AnalyticsClient {...data} />
}
