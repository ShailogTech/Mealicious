import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Public offers endpoint. Returns active storefront offers (BOGO, free gift,
 * free shipping threshold) for the storefront to consume. No auth — these are
 * display-facing flags, not secrets.
 */
export async function GET(_req: NextRequest) {
  try {
    const discounts = await db.discount.findMany({ where: { isActive: true } })
    const bogo = discounts.find((d) => d.type === 'bogo')
    const freeGift = discounts.find((d) => d.type === 'freegift')
    return NextResponse.json({
      bogoActive: !!bogo,
      freeGiftActive: !!freeGift,
      freeGiftMinOrder: freeGift?.minOrder ?? 0,
      freeShippingThreshold: 499,
    })
  } catch {
    // On DB failure, return safe defaults.
    return NextResponse.json({
      bogoActive: false,
      freeGiftActive: false,
      freeGiftMinOrder: 0,
      freeShippingThreshold: 499,
    })
  }
}
