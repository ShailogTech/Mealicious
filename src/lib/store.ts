import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Page = 
  | 'home' 
  | 'shop' 
  | 'product' 
  | 'cart' 
  | 'checkout' 
  | 'about' 
  | 'contact' 
  | 'faq' 
  | 'blog' 
  | 'blog-post'
  | 'privacy' 
  | 'terms' 
  | 'shipping-policy' 
  | 'refund-policy' 
  | 'track-order' 
  | 'login' 
  | 'register' 
  | 'profile'
  | 'wishlist'
  | 'notifications'

export interface CartItem {
  productId: string
  name: string
  image: string
  price: number
  salePrice?: number
  quantity: number
  variant?: string
  variantType?: string
  maxStock: number
  gstPct?: number // GST slab; prices are inclusive. Used for breakdown display.
}

export interface Address {
  id: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

interface AppStore {
  // Navigation
  currentPage: Page
  pageParams: Record<string, string>
  navigate: (page: Page, params?: Record<string, string>) => void

  // Cart
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string, variant?: string) => void
  updateQuantity: (productId: string, quantity: number, variant?: string) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void

  // Wishlist
  wishlistItems: string[]
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean

  // Auth
  isLoggedIn: boolean
  user: { name: string; email: string; phone: string; role: 'admin' | 'user' } | null
  adminSessionReady: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (name: string, email: string, phone: string, password: string) => Promise<string | null>
  logout: () => void
  updateProfile: (data: Partial<{ name: string; email: string; phone: string }>) => void

  // Addresses
  addresses: { id: string; label: string; fullName: string; phone: string; address1: string; address2: string; city: string; state: string; pincode: string; isDefault: boolean }[]
  saveAddress: (addr: { id: string; label: string; fullName: string; phone: string; address1: string; address2: string; city: string; state: string; pincode: string; isDefault: boolean }) => void
  deleteAddress: (id: string) => void
  setDefaultAddress: (id: string) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Mobile menu
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: 'home',
      pageParams: {},
      navigate: (page, params = {}) => {
        set({ currentPage: page, pageParams: params, mobileMenuOpen: false })
        if (typeof window !== 'undefined') {
          window.history.pushState({ page, params }, '', '#' + page)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      },

      // Cart
      cartItems: [],
      cartOpen: false,
      setCartOpen: (open) => set({ cartOpen: open }),
      addToCart: (item) => {
        const { cartItems } = get()
        const key = `${item.productId}-${item.variant || 'default'}`
        const existingIndex = cartItems.findIndex(
          (ci) => `${ci.productId}-${ci.variant || 'default'}` === key
        )
        if (existingIndex >= 0) {
          const updated = [...cartItems]
          const newQty = Math.min(updated[existingIndex].quantity + item.quantity, item.maxStock)
          updated[existingIndex] = { ...updated[existingIndex], quantity: newQty }
          set({ cartItems: updated, cartOpen: true })
        } else {
          set({ cartItems: [...cartItems, item], cartOpen: true })
        }
        // AddToCart conversion event
        if (typeof window !== 'undefined') {
          import('@/lib/track').then(({ trackAddToCart }) =>
            trackAddToCart({ id: item.productId, name: item.name, price: item.salePrice ?? item.price, quantity: item.quantity })
          ).catch(() => {})
        }
      },
      removeFromCart: (productId, variant) => {
        set({
          cartItems: get().cartItems.filter(
            (ci) => !(ci.productId === productId && (ci.variant || 'default') === (variant || 'default'))
          ),
        })
      },
      updateQuantity: (productId, quantity, variant) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variant)
          return
        }
        set({
          cartItems: get().cartItems.map((ci) =>
            ci.productId === productId && (ci.variant || 'default') === (variant || 'default')
              ? { ...ci, quantity: Math.min(quantity, ci.maxStock) }
              : ci
          ),
        })
      },
      clearCart: () => set({ cartItems: [] }),

      // Wishlist
      wishlistItems: [],
      toggleWishlist: (productId) => {
        const { wishlistItems } = get()
        if (wishlistItems.includes(productId)) {
          set({ wishlistItems: wishlistItems.filter((id) => id !== productId) })
        } else {
          set({ wishlistItems: [...wishlistItems, productId] })
        }
      },
      isInWishlist: (productId) => get().wishlistItems.includes(productId),

      // Auth
      isLoggedIn: false,
      user: null,
      adminSessionReady: false,
      login: async (email, password) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await res.json()
          if (!res.ok) return data.error || 'Login failed'
          const u = data.user

          if (u.role === 'admin') {
            // First authenticate the admin session context
            try {
              await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              })
            } catch (err) {
              console.error('Admin session authentication warning:', err)
            }
            
            set({
              isLoggedIn: true,
              adminSessionReady: true,
              user: { name: u.name, email: u.email, phone: u.phone, role: u.role }
            })
            
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/dashboard'
            }
            return null
          }

          set({
            isLoggedIn: true,
            adminSessionReady: false,
            user: { name: u.name, email: u.email, phone: u.phone, role: u.role },
            currentPage: 'home'
          })
          return null
        } catch {
          return 'Network error. Try again.'
        }
      },
      register: async (name, email, phone, password) => {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password }),
          })
          const data = await res.json()
          if (!res.ok) return data.error || 'Registration failed'
          const u = data.user
          set({ isLoggedIn: true, user: { name: u.name, email: u.email, phone: u.phone, role: 'user' }, currentPage: 'home' })
          // Record referral if a ref code was captured
          if (typeof window !== 'undefined') {
            try {
              const refCode = localStorage.getItem('mealicious-ref')
              if (refCode) {
                fetch('/api/referral', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: refCode, refereeEmail: email, refereePhone: phone }),
                }).then(() => localStorage.removeItem('mealicious-ref')).catch(() => {})
              }
            } catch {}
          }
          return null
        } catch {
          return 'Network error. Try again.'
        }
      },
      logout: () => {
        set({ isLoggedIn: false, user: null, currentPage: 'home', addresses: [], cartItems: [], wishlistItems: [] })
        if (typeof window !== 'undefined') {
          import('@/lib/firebase')
            .then(({ getFirebaseAuth }) => {
              const auth = getFirebaseAuth()
              if (auth) return import('firebase/auth').then(({ signOut }) => signOut(auth))
            })
            .catch(() => {})
        }
      },
      updateProfile: (data) => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, ...data } })
      },

      // Addresses
      addresses: [],
      saveAddress: (addr) => {
        const existing = get().addresses
        const idx = existing.findIndex(a => a.id === addr.id)
        if (idx >= 0) {
          const updated = [...existing]
          updated[idx] = addr
          set({ addresses: updated })
        } else {
          set({ addresses: [...existing, addr] })
        }
      },
      deleteAddress: (id) => {
        set({ addresses: get().addresses.filter(a => a.id !== id) })
      },
      setDefaultAddress: (id) => {
        set({ addresses: get().addresses.map(a => ({ ...a, isDefault: a.id === id })) })
      },

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'mealicious-store',
      partialize: (state) => ({
        cartItems: state.cartItems,
        wishlistItems: state.wishlistItems,
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        currentPage: state.currentPage,
        addresses: state.addresses,
      }),
    }
  )
)
