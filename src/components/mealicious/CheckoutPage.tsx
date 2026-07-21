'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type CartItem } from '@/lib/store'
import { trackInitiateCheckout, trackPurchase } from '@/lib/track'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ChevronRight,
  CreditCard,
  Truck,
  Shield,
  Check,
  MapPin,
  Package,
  ShoppingBag,
  Tag,
  X,
  Loader2,
  Banknote,
  ArrowRight,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const COUPON_CODES: Record<string, { discount: number; type: 'percent' | 'flat'; minOrder: number; maxDiscount?: number }> = {
  'MEAL10': { discount: 10, type: 'percent', minOrder: 499 },
  'SNACK20': { discount: 20, type: 'percent', minOrder: 999 },
  'FLAT50': { discount: 50, type: 'flat', minOrder: 599 },
  'WELCOME': { discount: 15, type: 'percent', minOrder: 399 },
  'IBUU50': { discount: 49, type: 'flat', minOrder: 0 },
}

function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `ML-${result}`
}

function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

function getEstimatedDelivery(): string {
  const date = new Date()
  date.setDate(date.getDate() + 5 + Math.floor(Math.random() * 3))
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function CheckoutPage() {
  const { cartItems, clearCart, navigate, removeFromCart, updateQuantity } = useAppStore()

  // Form state
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')

  // Coupon
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')

  // Order
  const [orderPlacing, setOrderPlacing] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.salePrice ?? item.price) * item.quantity,
    0
  )
  const shippingBase = subtotal >= 499 ? 0 : 49
  const codFee = 0
  const shippingTotal = shippingBase + codFee

  // Coupon discount
  let couponDiscount = 0
  if (appliedCoupon && COUPON_CODES[appliedCoupon]) {
    const coupon = COUPON_CODES[appliedCoupon]
    if (subtotal >= coupon.minOrder) {
      couponDiscount =
        coupon.type === 'percent'
          ? Math.round((subtotal * coupon.discount) / 100)
          : coupon.discount
      if (coupon.maxDiscount != null) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount)
    }
  }

  // Prepaid discount: 10% on prepaid orders
  const prepaidDiscount = paymentMethod === 'online' ? Math.round((subtotal - couponDiscount) * 0.10) : 0
  const discount = couponDiscount + prepaidDiscount

  const afterDiscount = subtotal - discount
  const gst = 0
  const total = afterDiscount + shippingTotal + gst

  // Empty cart redirect - derived state
  const isEmpty = cartItems.length === 0 && !orderDialogOpen

  // Fire InitiateCheckout conversion event once when checkout loads with items
  useEffect(() => {
    if (cartItems.length > 0) {
      trackInitiateCheckout(subtotal, cartItems.reduce((s, i) => s + i.quantity, 0))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Record abandoned cart for WhatsApp recovery once phone is valid (debounced)
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length !== 10 || cartItems.length === 0 || orderDialogOpen) return
    const t = setTimeout(() => {
      fetch('/api/whatsapp/abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          name: fullName || undefined,
          email: email || undefined,
          items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          cartValue: subtotal,
        }),
      }).catch(() => {})
    }, 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, fullName, email, cartItems.length])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format'

    if (!phone.trim()) newErrors.phone = 'Phone is required'
    else if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) newErrors.phone = 'Enter valid 10-digit phone'

    if (!fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!address1.trim()) newErrors.address1 = 'Address is required'
    if (!city.trim()) newErrors.city = 'City is required'
    if (!state) newErrors.state = 'State is required'
    if (!pincode.trim()) newErrors.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(pincode)) newErrors.pincode = 'Enter valid 6-digit pincode'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleApplyCoupon = () => {
    setCouponError('')
    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code')
      return
    }
    const code = couponCode.toUpperCase().trim()
    if (COUPON_CODES[code]) {
      if (subtotal >= COUPON_CODES[code].minOrder) {
        setAppliedCoupon(code)
        setCouponError('')
      } else {
        setCouponError(`Minimum order of ${formatPrice(COUPON_CODES[code].minOrder)} required`)
      }
    } else {
      setCouponError('Invalid coupon code')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const loadCashfreeSdk = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const w = window as any
      if (w.Cashfree) {
        console.log('[loadCashfreeSdk] Cashfree already exists on window')
        resolve(w.Cashfree)
        return
      }
      const existing = document.getElementById('cashfree-sdk') as HTMLScriptElement | null
      if (existing) {
        console.log('[loadCashfreeSdk] Cashfree script tag exists, polling/listening')
        const timer = setInterval(() => {
          if (w.Cashfree) {
            clearInterval(timer)
            resolve(w.Cashfree)
          }
        }, 100)

        existing.addEventListener('load', () => {
          clearInterval(timer)
          resolve((window as any).Cashfree)
        })
        existing.addEventListener('error', () => {
          clearInterval(timer)
          reject(new Error('Failed to load Cashfree SDK'))
        })

        // Safety timeout
        setTimeout(() => {
          clearInterval(timer)
          if (w.Cashfree) resolve(w.Cashfree)
          else reject(new Error('Cashfree SDK load timeout'))
        }, 10000)
        return
      }
      console.log('[loadCashfreeSdk] Appending new Cashfree script tag')
      const script = document.createElement('script')
      script.id = 'cashfree-sdk'
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
      script.async = true
      script.onload = () => {
        console.log('[loadCashfreeSdk] Cashfree script tag onload event')
        resolve((window as any).Cashfree)
      }
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK'))
      document.body.appendChild(script)
    })
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      const firstError = document.querySelector('[data-error="true"]')
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setOrderPlacing(true)
    const newOrderId = generateOrderId()

    if (paymentMethod === 'online') {
      try {
        const res = await fetch('/api/payments/cashfree/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              variant: it.variant ?? null,
            })),
            couponCode: appliedCoupon,
            paymentMethod: 'online',
            clientAmount: total,
            customerName: fullName,
            customerEmail: email,
            customerPhone: phone,
            orderNote: `Mealicious order`,
            shippingAddr: {
              fullName, email, phone,
              address1, address2, city, state, pincode,
            },
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.paymentSessionId) {
          if (data.code === 'PAYMENT_NOT_CONFIGURED') {
            alert(
              'Online payments are not configured yet.\n\nPlease select "Cash on Delivery" to complete your order, or contact support.'
            )
            setPaymentMethod('cod')
            setOrderPlacing(false)
            return
          }
          throw new Error(data.error || 'Failed to create payment order')
        }
        const Cashfree = await loadCashfreeSdk()
        const cashfree = Cashfree({ mode: data.mode === 'production' ? 'production' : 'sandbox' })
        await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_self',
        })
        // Browser will redirect; nothing else to do.
        return
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed'
        alert(`Payment could not be started: ${message}`)
        setOrderPlacing(false)
        return
      }
    }

    // COD flow — persist to server
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            variant: it.variant ?? null,
          })),
          couponCode: appliedCoupon,
          paymentMethod: 'cod',
          clientTotal: total,
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
          shippingAddr: {
            fullName, email, phone,
            address1, address2, city, state, pincode,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Order failed: ${data.error || 'unknown'}`)
        setOrderPlacing(false)
        return
      }
      const finalOrderId = data.order?.orderNumber ?? newOrderId
      setOrderId(finalOrderId)
      setEstimatedDelivery(getEstimatedDelivery())
      setOrderPlacing(false)
      setOrderDialogOpen(true)
      // Purchase conversion event (COD)
      trackPurchase({
        orderId: finalOrderId,
        value: total,
        items: cartItems.map(i => ({ id: i.productId, name: i.name, quantity: i.quantity, price: i.salePrice ?? i.price })),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Order failed: ${message}`)
      setOrderPlacing(false)
    }
  }

  const handleOrderComplete = () => {
    clearCart()
    setOrderDialogOpen(false)
  }

  // Empty cart state
  if (isEmpty && !orderDialogOpen) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6 max-w-md">
          Add some delicious snacks to your cart before heading to checkout.
        </p>
        <Button
          onClick={() => navigate('shop')}
          className="bg-orange-400 hover:bg-orange-400 text-white px-8"
          size="lg"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-gray-500 hover:text-orange-400"
                onClick={() => navigate('home')}
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-gray-500 hover:text-orange-400"
                onClick={() => navigate('cart')}
              >
                Cart
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-orange-400 font-medium">Checkout</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Checkout</h1>
          <p className="text-stone-500 mt-1">Complete your order details below</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-orange-400 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">We&apos;ll use this for order updates</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2" data-error={!!errors.email}>
                    <Label htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                      }}
                      className={errors.email ? 'border-red-400 focus-visible:ring-red-200' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2" data-error={!!errors.phone}>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        +91
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
                        }}
                        className={`pl-10 ${errors.phone ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-500 flex items-center gap-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Shipping Address */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-orange-400 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-400" />
                      Shipping Address
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">Where should we deliver your order?</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2" data-error={!!errors.fullName}>
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }))
                    }}
                    className={errors.fullName ? 'border-red-400 focus-visible:ring-red-200' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2" data-error={!!errors.address1}>
                  <Label htmlFor="address1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address1"
                    placeholder="House no., Building, Street"
                    value={address1}
                    onChange={(e) => {
                      setAddress1(e.target.value)
                      if (errors.address1) setErrors((prev) => ({ ...prev, address1: '' }))
                    }}
                    className={errors.address1 ? 'border-red-400 focus-visible:ring-red-200' : ''}
                  />
                  {errors.address1 && (
                    <p className="text-xs text-red-500">{errors.address1}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    placeholder="Area, Landmark (Optional)"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2" data-error={!!errors.city}>
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value)
                        if (errors.city) setErrors((prev) => ({ ...prev, city: '' }))
                      }}
                      className={errors.city ? 'border-red-400 focus-visible:ring-red-200' : ''}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2" data-error={!!errors.state}>
                    <Label>
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={state}
                      onValueChange={(val) => {
                        setState(val)
                        if (errors.state) setErrors((prev) => ({ ...prev, state: '' }))
                      }}
                    >
                      <SelectTrigger
                        className={`w-full ${errors.state ? 'border-red-400' : ''}`}
                      >
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <p className="text-xs text-red-500">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2" data-error={!!errors.pincode}>
                    <Label htmlFor="pincode">
                      Pincode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pincode"
                      placeholder="6-digit pincode"
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }))
                      }}
                      className={errors.pincode ? 'border-red-400 focus-visible:ring-red-200' : ''}
                    />
                    {errors.pincode && (
                      <p className="text-xs text-red-500">{errors.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="saveDefault"
                    checked={saveAsDefault}
                    onCheckedChange={(checked) => setSaveAsDefault(checked === true)}
                    className="data-[state=checked]:bg-orange-400 data-[state=checked]:border-orange-400"
                  />
                  <Label htmlFor="saveDefault" className="cursor-pointer text-sm font-normal text-gray-600">
                    Save as default address for future orders
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Payment Method */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-orange-400 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-orange-400" />
                      Payment Method
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">Choose how you want to pay</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  {/* COD Option */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-orange-400 bg-blue-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <RadioGroupItem
                      value="cod"
                      className="mt-0.5 data-[state=checked]:border-orange-400 [&>span>svg]:fill-orange-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-gray-900">Cash on Delivery (COD)</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Pay when your order arrives at your doorstep
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 border-0 text-xs font-semibold"
                        >
                          FREE
                        </Badge>
                      </div>
                    </div>
                    {paymentMethod === 'cod' && (
                      <Check className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    )}
                  </label>

                  {/* Online Payment Option */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'online'
                        ? 'border-orange-400 bg-blue-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <RadioGroupItem
                      value="online"
                      className="mt-0.5 data-[state=checked]:border-orange-400 [&>span>svg]:fill-orange-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-gray-900">
                          Pay Online (UPI/Card/Net Banking)
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Secure payment via Cashfree — UPI, Cards & Net Banking
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                          <span className="text-xs font-bold text-orange-400">UPI</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                          <span className="text-xs font-bold text-orange-400">Visa</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                          <span className="text-xs font-bold text-red-600">MC</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                          <span className="text-xs font-bold text-indigo-600">NB</span>
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'online' && (
                      <Check className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    )}
                  </label>
                </RadioGroup>

                {/* Security badge */}
                <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button - Mobile */}
            <div className="lg:hidden">
              <Button
                onClick={handlePlaceOrder}
                disabled={orderPlacing}
                className="w-full bg-orange-400 hover:bg-orange-400 text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all"
                size="lg"
              >
                {orderPlacing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order • {formatPrice(total)}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-400" />
                    Order Summary
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-orange-400 border-0">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items - Compact */}
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {cartItems.map((item, idx) => (
                      <div
                        key={`${item.productId}-${item.variant || 'default'}-${idx}`}
                        className="flex gap-3"
                      >
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </p>
                              {item.variant && (
                                <p className="text-xs text-gray-400">{item.variant}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId, item.variant)}
                              className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <p className="text-sm font-semibold text-orange-400">
                              {formatPrice((item.salePrice ?? item.price) * item.quantity)}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                disabled={item.quantity <= 1}
                                className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                disabled={item.quantity >= item.maxStock}
                                className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    {appliedCoupon ? (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <Tag className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-orange-400 flex-1">
                          {appliedCoupon}
                        </span>
                        <span className="text-xs text-orange-400">
                          -{formatPrice(discount)}
                        </span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Coupon code"
                              value={couponCode}
                              onChange={(e) => {
                                setCouponCode(e.target.value.toUpperCase())
                                setCouponError('')
                              }}
                              className="pl-9 h-9 text-sm uppercase"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleApplyCoupon()
                              }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleApplyCoupon}
                            className="border-blue-200 text-orange-400 hover:bg-blue-50 h-9 px-4"
                          >
                            Apply
                          </Button>
                        </div>
                        {couponError && (
                          <p className="text-xs text-red-500">{couponError}</p>
                        )}
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-medium">
                        {shippingBase === 0 ? (
                          <span className="text-orange-400">FREE</span>
                        ) : (
                          formatPrice(shippingBase)
                        )}
                      </span>
                    </div>

                    {codFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">COD Fee</span>
                        <span className="font-medium">{formatPrice(codFee)}</span>
                      </div>
                    )}

                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Coupon Discount</span>
                        <span className="font-medium text-orange-400">-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}

                    {prepaidDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Prepaid Discount (10%)</span>
                        <span className="font-medium text-orange-400">-{formatPrice(prepaidDiscount)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-orange-400">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* Free shipping message */}
                  {subtotal < 499 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-start gap-2">
                      <Truck className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-orange-400">
                        Add {formatPrice(499 - subtotal)} more for <strong>FREE shipping</strong>!
                      </p>
                    </div>
                  )}

                  {subtotal >= 499 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-orange-400 shrink-0" />
                      <p className="text-xs text-orange-400 font-medium">
                        You qualify for FREE shipping!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Place Order Button - Desktop */}
              <Button
                onClick={handlePlaceOrder}
                disabled={orderPlacing}
                className="hidden lg:flex w-full bg-orange-400 hover:bg-orange-400 text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all"
                size="lg"
              >
                {orderPlacing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order • {formatPrice(total)}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
                  <Shield className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-500 leading-tight">Secure<br />Payment</p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
                  <Truck className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-500 leading-tight">Free Shipping<br />₹499+</p>
                </div>
                <div className="text-center p-3 bg-white rounded-xl border border-gray-100">
                  <Check className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-500 leading-tight">100%<br />Genuine</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col items-center text-center py-4">
            {/* Success Animation */}
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-orange-400 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>

            <DialogTitle className="text-2xl font-bold text-gray-900">
              Thank you for your order!
            </DialogTitle>
            <DialogDescription className="text-gray-500 mt-2 text-base">
              Your order has been placed successfully
            </DialogDescription>

            {/* Order ID */}
            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
              <p className="text-xs text-orange-400 font-medium mb-0.5">Order Number</p>
              <p className="text-lg font-bold text-orange-400 tracking-wider">{orderId}</p>
            </div>

            {/* Estimated Delivery */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Truck className="w-4 h-4 text-orange-400" />
              <span>Estimated delivery: <strong>{estimatedDelivery}</strong></span>
            </div>

            {/* Payment Method */}
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              {paymentMethod === 'cod' ? (
                <Banknote className="w-4 h-4 text-orange-400" />
              ) : (
                <CreditCard className="w-4 h-4 text-orange-400" />
              )}
              <span>
                Payment:{' '}
                <strong>
                  {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                </strong>
              </span>
            </div>

            {/* Total */}
            <div className="mt-4 text-sm text-gray-500">
              Total Paid: <span className="font-bold text-orange-400 text-lg">{formatPrice(total)}</span>
            </div>
          </div>

          <Separator />

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                handleOrderComplete()
                navigate('track-order')
              }}
              className="flex-1 border-blue-200 text-orange-400 hover:bg-blue-50"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Track Order
            </Button>
            <Button
              onClick={() => {
                handleOrderComplete()
                navigate('shop')
              }}
              className="flex-1 bg-orange-400 hover:bg-orange-400 text-white"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
