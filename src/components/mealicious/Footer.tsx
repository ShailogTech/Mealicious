'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Leaf, Mail, MapPin, Instagram, Youtube, MessageCircle } from 'lucide-react'

export default function Footer() {
  const navigate = useAppStore((s) => s.navigate)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Subscription failed')
        return
      }
      setSubscribed(true)
      setEmail('')
      toast.success(data.message ?? 'Subscribed!')
      setTimeout(() => setSubscribed(false), 3000)
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    { label: 'Home', page: 'home' as const },
    { label: 'Shop', page: 'shop' as const },
    { label: 'About Us', page: 'about' as const },
    { label: 'Contact Us', page: 'contact' as const },
    { label: 'Blog', page: 'blog' as const },
    { label: 'FAQ', page: 'faq' as const },
  ]

  const policyLinks = [
    { label: 'Privacy Policy', page: 'privacy' as const },
    { label: 'Terms & Conditions', page: 'terms' as const },
    { label: 'Shipping Policy', page: 'shipping-policy' as const },
    { label: 'Refund Policy', page: 'refund-policy' as const },
    { label: 'Track Order', page: 'track-order' as const },
  ]

  const socialLinks = [
    { icon: MessageCircle, label: 'WhatsApp', href: 'https://api.whatsapp.com/send/?phone=916379858978&text&type=phone_number&app_absent=0' },
    { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/mealicious.store?igsh=MXJ3aTM3bG1rOHYxYg==' },
    { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@mealiciousstore' },
  ]

  return (
    <footer className="mt-auto bg-stone-950 text-muted-foreground/50">
      {/* Newsletter Section */}
      <div className="border-b border-stone-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-white">Subscribe to Our Newsletter</h3>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Get the latest updates on new products, exclusive deals & healthy snacking tips.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full max-w-sm gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-700 bg-stone-800 text-stone-200 placeholder:text-muted-foreground focus:border-orange-400 focus:ring-orange-400"
              />
              <Button
                type="submit"
                disabled={loading}
                className="shrink-0 bg-orange-400 hover:bg-orange-400 text-white"
              >
                {loading ? 'Subscribing…' : subscribed ? 'Subscribed!' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Leaf className="h-7 w-7 text-orange-400" />
              <span className="text-xl font-extrabold tracking-wide text-white">MEALICIOUS</span>
            </div>
            <p className="mt-1 text-sm font-medium text-blue-400">
              Premium Health Snacks &amp; Dry Fruits
            </p>
            <p className="mt-1 text-xs text-orange-400 font-medium">
              Happiness for You. Nature's Goodness in Every Bite.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground/70">
              Explore our range of flavoured makhana, millet-based chips, premium dry fruits, and wholesome snacks—made with quality ingredients, full of flavour, and perfect for healthy everyday snacking.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 text-muted-foreground/70 transition-colors hover:bg-orange-400 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ label, page }) => (
                <li key={page}>
                  <button
                    onClick={() => navigate(page)}
                    className="text-sm text-muted-foreground/70 transition-colors hover:text-blue-400"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Policies
            </h4>
            <ul className="space-y-2.5">
              {policyLinks.map(({ label, page }) => (
                <li key={page}>
                  <button
                    onClick={() => navigate(page)}
                    className="text-sm text-muted-foreground/70 transition-colors hover:text-blue-400"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <span className="text-sm text-muted-foreground/70">support@mealicious.store</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <span className="text-sm text-muted-foreground/70">
                  Mealicious Ventures Private Limited,
                  <br />
                  1/108, Elappankadu, Malankadu,
                  <br />
                  Uthamasolapuram, Salem - 636010,
                  <br />
                  Tamil Nadu, India
                </span>
              </li>
            </ul>

            {/* Compliance Info */}
            <div className="mt-5 text-xs text-muted-foreground space-y-1 font-mono">
              <p>FSSAI: 22426193000120</p>
              <p>GST: 33AAUCM2609Q1ZT</p>
              <p>CIN: U10799TZ2025PTC037179</p>
            </div>

            {/* Payment Icons */}
            <div className="mt-6">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                We Accept
              </p>
              <div className="flex flex-wrap gap-2">
                {['Visa', 'Mastercard', 'UPI', 'PayPal', 'RuPay'].map((method) => (
                  <span
                    key={method}
                    className="inline-flex items-center rounded bg-stone-800 px-2 py-1 text-[10px] font-semibold text-muted-foreground/50"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            &copy; 2025 Mealicious Ventures Private Limited. All rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
