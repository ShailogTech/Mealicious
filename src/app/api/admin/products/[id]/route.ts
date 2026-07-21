import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-server'
import { serializeProduct } from '@/lib/admin-helpers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.shortDesc !== undefined) data.shortDesc = body.shortDesc
  if (body.price !== undefined) data.price = Number(body.price)
  if (body.salePrice !== undefined) data.salePrice = body.salePrice == null ? null : Number(body.salePrice)
  if (body.images !== undefined) data.images = JSON.stringify(body.images)
  if (body.variants !== undefined) data.variants = JSON.stringify(body.variants)
  if (body.tags !== undefined) data.tags = JSON.stringify(body.tags)
  if (body.nutrition !== undefined) data.nutrition = JSON.stringify(body.nutrition)
  if (body.stock !== undefined) data.stock = Number(body.stock)
  if (body.sku !== undefined) data.sku = body.sku
  if (body.gstPct !== undefined) data.gstPct = Number(body.gstPct) || 0
  if (body.featured !== undefined) data.featured = !!body.featured
  if (body.bestSeller !== undefined) data.bestSeller = !!body.bestSeller
  if (body.isNew !== undefined) data.isNew = !!body.isNew
  if (body.isActive !== undefined) data.isActive = !!body.isActive
  if (body.rating !== undefined) data.rating = Number(body.rating)
  if (body.reviewCount !== undefined) data.reviewCount = Number(body.reviewCount)
  if (body.categorySlug) {
    const cat = await db.category.findUnique({ where: { slug: body.categorySlug } })
    if (cat) data.categoryId = cat.id
  } else if (body.category) {
    const cat = await db.category.findFirst({ where: { name: String(body.category) } })
    if (cat) data.categoryId = cat.id
  }
  const updated = await db.product.update({ where: { id }, data })
  return NextResponse.json({ product: serializeProduct(updated as unknown as Record<string, unknown>) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  try {
    // Delete wishlists, reviews, and order items pointing to this product first
    await db.wishlist.deleteMany({ where: { productId: id } })
    await db.review.deleteMany({ where: { productId: id } })
    await db.orderItem.deleteMany({ where: { productId: id } })

    // Hard delete
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error deleting product:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 })
  }
}
