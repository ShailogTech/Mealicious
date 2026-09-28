'use client'

import { useEffect, useState } from 'react'
import { Gift, Sparkles, Truck, Leaf } from 'lucide-react'

interface Offers {
  bogoActive: boolean
  freeGiftActive: boolean
  freeGiftMinOrder: number
  freeShippingThreshold: number
}

const STATIC_MESSAGES = [
  { icon: <Leaf className="h-3 w-3" />, text: '100% ORGANIC INGREDIENTS' },
  { icon: <Truck className="h-3 w-3" />, text: 'FREE SHIPPING ON ORDERS ABOVE ₹499' },
  { icon: <Sparkles className="h-3 w-3" />, text: 'TRUSTED BY 10,000+ CUSTOMERS' },
]

/**
 * Marquee announcement bar — continuously scrolling offers strip.
 * Dynamically includes BOGO / Free Gift when enabled in /admin/discounts.
 */
export function PromoBar() {
  const [offers, setOffers] = useState<Offers | null>(null)

  useEffect(() => {
    fetch('/api/offers').then((r) => r.json()).then(setOffers).catch(() => setOffers(null))
  }, [])

  const messages = [...STATIC_MESSAGES]
  if (offers?.bogoActive) {
    messages.unshift({ icon: <Sparkles className="h-3 w-3" />, text: 'BUY 1 GET 1 FREE — LIMITED TIME' })
  }
  if (offers?.freeGiftActive) {
    messages.unshift({ icon: <Gift className="h-3 w-3" />, text: `FREE GIFT ON ORDERS ABOVE ₹${offers.freeGiftMinOrder}` })
  }

  // Duplicate the sequence so the CSS marquee loops seamlessly.
  const strip = [...messages, ...messages]

  return (
    <div className="overflow-hidden bg-stone-950 text-stone-100 border-b border-white/5 select-none" role="banner">
      <div className="marquee-track flex w-max items-center gap-0 py-1.5">
        {strip.map((m, i) => (
          <span key={i} className="flex items-center gap-1.5 px-6 text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap">
            <span className="text-orange-400">{m.icon}</span>
            {m.text}
            <span className="ml-6 text-orange-500">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
