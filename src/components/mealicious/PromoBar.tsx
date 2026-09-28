'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Truck, Gift } from 'lucide-react'

interface Offers {
  bogoActive: boolean
  freeGiftActive: boolean
  freeGiftMinOrder: number
  freeShippingThreshold: number
}

/**
 * Sticky top promo bar showing active offers (BOGO / Free Gift / Free Shipping).
 * Fetches from /api/offers on mount. Hides if no offers are active.
 * Premium D2C-style: subtle gradient, small text, smooth slide-in.
 */
export function PromoBar() {
  // ALL hooks must be declared before any early return (React hooks order rule).
  const [offers, setOffers] = useState<Offers | null>(null)
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState(0)

  useEffect(() => {
    fetch('/api/offers').then((r) => r.json()).then(setOffers).catch(() => setOffers(null))
  }, [])

  if (!offers || !visible) return null

  const messages: { icon: React.ReactNode; text: string }[] = []
  if (offers.bogoActive) {
    messages.push({ icon: <Sparkles className="h-3.5 w-3.5" />, text: 'BOGO Live — Buy 1 Get 1 Free' })
  }
  if (offers.freeGiftActive) {
    messages.push({ icon: <Gift className="h-3.5 w-3.5" />, text: `Free Gift on orders above ₹${offers.freeGiftMinOrder}` })
  }
  messages.push({ icon: <Truck className="h-3.5 w-3.5" />, text: `Free Shipping over ₹${offers.freeShippingThreshold}` })

  // If only the evergreen free-shipping message remains and BOGO/gift are off,
  // still show it — it's a conversion driver.

  return (
    <div
      className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-emerald-50 text-xs font-medium sticky top-0 z-40 transition-transform duration-300"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 relative">
        <span className="flex items-center gap-1.5">
          {messages[active]?.icon}
          <span>{messages[active]?.text}</span>
        </span>
        {messages.length > 1 && (
          <button
            onClick={() => setActive((i) => (i + 1) % messages.length)}
            className="absolute right-3 text-emerald-300 hover:text-emerald-100 transition-colors text-[10px] underline underline-offset-2"
          >
            next offer
          </button>
        )}
      </div>
    </div>
  )
}
