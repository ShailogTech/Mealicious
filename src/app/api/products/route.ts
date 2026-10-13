import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeProduct } from '@/lib/admin-helpers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categorySlug = searchParams.get('category')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')
  const bestSeller = searchParams.get('bestSeller')
  const isNew = searchParams.get('new')

  const where: Record<string, unknown> = { isActive: true }
  if (categorySlug) where.category = { slug: categorySlug }
  if (featured === 'true') where.featured = true
  if (bestSeller === 'true') where.bestSeller = true
  if (isNew === 'true') where.isNew = true
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [rows, cats] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  // #4: ERP Inventory as primary source. For products linked to an ERP
  // inventory item, override the stock from the ERP side (live sync).
  const linkedIds = rows.filter((p) => p.erpInventoryItemId).map((p) => p.erpInventoryItemId!) as string[]
  const erpItems = linkedIds.length > 0
    ? new Map((await db.erpInventoryItem.findMany({ where: { id: { in: linkedIds } }, select: { id: true, stock: true } })).map((i) => [i.id, i.stock]))
    : new Map<string, number>()

  const products = rows.map((p) => ({
    ...serializeProduct(p as unknown as Record<string, unknown>),
    category: p.category?.name,
    categorySlug: p.category?.slug,
    // Override stock from ERP if linked.
    ...(p.erpInventoryItemId && erpItems.has(p.erpInventoryItemId)
      ? { stock: erpItems.get(p.erpInventoryItemId)! }
      : {}),
  }))

  return NextResponse.json({
    success: true,
    products,
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      icon: c.icon,
    })),
    total: products.length,
  })
}
