import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-server'
import { serializeProduct } from '@/lib/admin-helpers'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const rows = await db.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    products: rows.map((p) => ({
      ...serializeProduct(p as unknown as Record<string, unknown>),
      category: p.category?.name,
      categorySlug: p.category?.slug,
    })),
  })
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const body = await req.json()
  let cat = null
  if (body.categorySlug) cat = await db.category.findUnique({ where: { slug: body.categorySlug } })
  if (!cat && body.category) {
    cat = await db.category.findFirst({ where: { name: String(body.category) } })
  }
  if (!cat) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  const slug = (body.slug || String(body.name || 'product').toLowerCase().replace(/\s+/g, '-')).slice(0, 80)
  const created = await db.product.create({
    data: {
      name: body.name,
      slug,
      description: body.description ?? '',
      shortDesc: body.shortDesc ?? '',
      price: Number(body.price) || 0,
      salePrice: body.salePrice != null ? Number(body.salePrice) : null,
      images: JSON.stringify(body.images ?? []),
      categoryId: cat.id,
      variants: JSON.stringify(body.variants ?? []),
      tags: JSON.stringify(body.tags ?? []),
      nutrition: JSON.stringify(body.nutrition ?? {}),
      stock: Number(body.stock) || 0,
      sku: body.sku ?? null,
      gstPct: Number(body.gstPct) || 0,
      featured: !!body.featured,
      bestSeller: !!body.bestSeller,
      isNew: !!body.isNew,
      rating: Number(body.rating) || 0,
      reviewCount: Number(body.reviewCount) || 0,
    },
  })
  return NextResponse.json({ product: serializeProduct(created as unknown as Record<string, unknown>) })
}
