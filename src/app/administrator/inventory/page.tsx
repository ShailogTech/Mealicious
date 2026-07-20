export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { requireErpPageUser } from '@/lib/administrator/page-auth'
import { InventoryClient } from './InventoryClient'

async function getData() {
  const items = await db.erpInventoryItem.findMany({ orderBy: { createdAt: 'desc' } })
  return {
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      hsn: i.hsn ?? '',
      sku: i.sku ?? '',
      stock: i.stock,
      reorderLevel: i.reorderLevel,
      price: i.price,
      gstPct: i.gstPct,
    })),
  }
}

export default async function InventoryPage() {
  await requireErpPageUser()
  const { items } = await getData()
  return <InventoryClient items={items} />
}
