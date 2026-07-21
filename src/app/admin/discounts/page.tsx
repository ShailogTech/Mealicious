export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DiscountsClient } from './DiscountsClient'

async function getData() {
  const discounts = await db.discount.findMany({ orderBy: { createdAt: 'asc' } })
  return {
    discounts: discounts.map((d) => ({
      id: d.id,
      code: d.code,
      type: d.type,
      value: d.value,
      minOrder: d.minOrder,
      maxDiscount: d.maxDiscount,
      isActive: d.isActive,
      description: d.description ?? '',
    })),
  }
}

export default async function DiscountsPage() {
  const { discounts } = await getData()
  return (
    <div>
      <AdminHeader title="Discounts" />
      <DiscountsClient discounts={discounts} />
    </div>
  )
}
