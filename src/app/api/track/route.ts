import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['view_product', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'search']

/**
 * Public user-activity tracking endpoint (CRM). The storefront fires these
 * fire-and-forget from the client — no auth. userId comes from the body
 * (the store's user state; email when logged in) or 'anonymous'.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const activityType = String(body.activityType || '')
    if (!VALID_TYPES.includes(activityType)) {
      return NextResponse.json({ error: 'Invalid activityType' }, { status: 400 })
    }
    const userId = String(body.userId || 'anonymous').slice(0, 256) || 'anonymous'
    await db.userActivity.create({
      data: {
        userId,
        activityType,
        productId: body.productId ? String(body.productId).slice(0, 64) : null,
        productName: body.productName ? String(body.productName).slice(0, 256) : null,
        metadata: JSON.parse(
          JSON.stringify(
            body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
              ? body.metadata
              : {}
          )
        ),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Fire-and-forget: never surface tracking failures to the client.
    console.error('track error:', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
