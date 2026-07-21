'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, Page } from '@/lib/store'
import Header from '@/components/mealicious/Header'
import Footer from '@/components/mealicious/Footer'
import HomePage from '@/components/mealicious/HomePage'
import ShopPage from '@/components/mealicious/ShopPage'
import ProductDetail from '@/components/mealicious/ProductDetail'
import CartSidebar from '@/components/mealicious/CartSidebar'
import CheckoutPage from '@/components/mealicious/CheckoutPage'
import { LoginPage, RegisterPage } from '@/components/mealicious/AuthPages'
import AboutPage from '@/components/mealicious/AboutPage'
import ContactPage from '@/components/mealicious/ContactPage'
import FAQPage from '@/components/mealicious/FAQPage'
import BlogPage from '@/components/mealicious/BlogPage'
import { PrivacyPolicyPage, TermsPage, RefundPolicyPage } from '@/components/mealicious/PolicyPages'
import ShippingPolicyPage from '@/components/mealicious/ShippingPolicyPage'
import TrackOrderPage from '@/components/mealicious/TrackOrderPage'
import WishlistPage from '@/components/mealicious/WishlistPage'
import ProfilePage from '@/components/mealicious/ProfilePage'
import NotificationsPage from '@/components/mealicious/NotificationsPage'
import { AIChatWidget } from '@/components/AIChatWidget'

function PageRenderer({ page }: { page: Page }) {
  switch (page) {
    case 'home':
      return <HomePage />
    case 'shop':
      return <ShopPage />
    case 'product':
      return <ProductDetail />
    case 'checkout':
      return <CheckoutPage />
    case 'about':
      return <AboutPage />
    case 'contact':
      return <ContactPage />
    case 'faq':
      return <FAQPage />
    case 'blog':
      return <BlogPage />
    case 'blog-post':
      return <BlogPage />
    case 'privacy':
      return <PrivacyPolicyPage />
    case 'terms':
      return <TermsPage />
    case 'shipping-policy':
      return <ShippingPolicyPage />
    case 'refund-policy':
      return <RefundPolicyPage />
    case 'track-order':
      return <TrackOrderPage />
    case 'login':
      return <LoginPage />
    case 'register':
      return <RegisterPage />
    case 'wishlist':
      return <WishlistPage />
    case 'cart':
      return <CheckoutPage />
    case 'profile':
      return <ProfilePage />
    case 'notifications':
      return <NotificationsPage />
    default:
      return <HomePage />
  }
}

export default function MealiciousStore() {
  const { currentPage } = useAppStore()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Capture referral code from ?ref= and persist for signup
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ref = new URL(window.location.href).searchParams.get('ref')
    if (ref) {
      try { localStorage.setItem('mealicious-ref', ref.toUpperCase()) } catch {}
    }
  }, [])

  // Cashfree return-URL handler: after the user pays, Cashfree redirects to
  // `/?cashfree_order_id=...#payment-return`. Verify the order server-side and notify the user.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const cfOrderId = url.searchParams.get('cashfree_order_id')
    if (!cfOrderId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/payments/cashfree/verify?orderId=${encodeURIComponent(cfOrderId)}`)
        const data = await res.json()
        if (data.paid) {
          const { clearCart, navigate, cartItems } = useAppStore.getState()
          // Purchase conversion event (online payment)
          const orderValue = cartItems.reduce((s, i) => s + (i.salePrice ?? i.price) * i.quantity, 0)
          import('@/lib/track').then(({ trackPurchase }) => trackPurchase({
            orderId: cfOrderId,
            value: orderValue,
            items: cartItems.map(i => ({ id: i.productId, name: i.name, quantity: i.quantity, price: i.salePrice ?? i.price })),
          })).catch(() => {})
          clearCart()
          alert(`Payment successful! Order ${cfOrderId} confirmed.`)
          navigate('track-order', { orderId: cfOrderId })
        } else {
          alert(`Payment status: ${data.status ?? 'unknown'}. If you were charged, please contact support.`)
        }
      } catch {
        alert('Could not verify payment. Please contact support if you were charged.')
      } finally {
        url.searchParams.delete('cashfree_order_id')
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
      }
    })()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Seed initial history entry
    if (!window.history.state?.page) {
      window.history.replaceState(
        { page: useAppStore.getState().currentPage, params: useAppStore.getState().pageParams },
        '',
        '#' + useAppStore.getState().currentPage,
      )
    }
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as { page?: Page; params?: Record<string, string> } | null
      if (state?.page) {
        useAppStore.setState({
          currentPage: state.page,
          pageParams: state.params ?? {},
          mobileMenuOpen: false,
        })
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <PageRenderer page={currentPage} />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CartSidebar />

      {/* AI Chat support widget */}
      <AIChatWidget />

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/916379858978"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg hover:bg-[#20ba5a] transition-colors"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
          <path d="M16 0C7.164 0 0 7.163 0 16c0 2.824.738 5.482 2.031 7.789L0 32l8.457-2.012A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.784-1.856l-.487-.289-5.02 1.195 1.22-4.884-.317-.5A13.27 13.27 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.398-.199-2.356-1.162-2.72-1.295-.364-.133-.629-.199-.894.2-.265.398-1.029 1.295-1.261 1.56-.232.265-.464.298-.862.1-.398-.2-1.681-.62-3.203-1.977-1.184-1.057-1.982-2.362-2.215-2.76-.232-.398-.025-.613.175-.812.18-.179.398-.464.597-.696.199-.232.265-.398.398-.663.133-.265.066-.497-.033-.696-.1-.199-.894-2.155-1.225-2.95-.322-.773-.649-.668-.894-.68l-.762-.013c-.265 0-.696.1-.1061.497-.364.398-1.392 1.36-1.392 3.316s1.425 3.848 1.624 4.113c.199.265 2.804 4.28 6.793 6.003.95.41 1.691.655 2.268.838.953.303 1.82.26 2.506.158.764-.114 2.356-.963 2.688-1.894.333-.93.333-1.727.232-1.894-.099-.166-.364-.265-.762-.464z"/>
        </svg>
      </a>
    </div>
  )
}
