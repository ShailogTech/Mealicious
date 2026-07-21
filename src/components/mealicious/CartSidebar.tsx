'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  ArrowRight,
} from 'lucide-react'

export default function CartSidebar() {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    navigate,
  } = useAppStore()

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')

  // Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.salePrice ?? item.price) * item.quantity,
    0
  )
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = subtotal >= 499 ? 0 : 49
  const discount = (() => {
    if (!appliedCoupon) return 0
    if (appliedCoupon === 'IBUU50') return Math.min(49, subtotal)
    return Math.round(subtotal * 0.1)
  })()
  const total = subtotal + shipping - discount

  // GST breakdown (inclusive — derived from each line's gstPct + inclusive price).
  const gstBreakdown = cartItems.reduce((acc, item) => {
    const gstPct = item.gstPct ?? 0
    if (gstPct <= 0) return acc
    const lineInclusive = (item.salePrice ?? item.price) * item.quantity
    const taxable = lineInclusive / (1 + gstPct / 100)
    const gstAmount = lineInclusive - taxable
    acc.gstTotal += gstAmount
    acc.cgst += gstAmount / 2
    acc.sgst += gstAmount / 2
    return acc
  }, { gstTotal: 0, cgst: 0, sgst: 0 })

  const handleApplyCoupon = () => {
    setCouponError('')
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }
    if (appliedCoupon) {
      setCouponError('A coupon is already applied')
      return
    }
    // Simulate coupon validation
    const code = couponCode.trim().toUpperCase()
    if (code === 'WELCOME10' || code === 'SAVE10' || code === 'IBUU50') {
      setAppliedCoupon(code)
      setCouponCode('')
    } else {
      setCouponError('Invalid coupon code')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const handleCheckout = () => {
    setCartOpen(false)
    navigate('checkout')
  }

  const handleContinueShopping = () => {
    setCartOpen(false)
    navigate('shop')
  }

  const handleStartShopping = () => {
    setCartOpen(false)
    navigate('shop')
  }

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold">
              <ShoppingBag className="size-5 text-orange-400" />
              Your Cart
              {totalItems > 0 && (
                <span className="ml-1 inline-flex size-6 items-center justify-center rounded-full bg-orange-400 text-xs font-semibold text-white">
                  {totalItems}
                </span>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Your shopping cart items and summary
          </SheetDescription>
        </SheetHeader>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-blue-50">
              <ShoppingBag className="size-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Your cart is empty
            </h3>
            <p className="text-center text-sm text-gray-500">
              Looks like you haven&apos;t added anything to your cart yet.
              Explore our delicious snacks and dry fruits!
            </p>
            <Button
              onClick={handleStartShopping}
              className="mt-2 bg-orange-400 hover:bg-orange-400"
              size="lg"
            >
              Start Shopping
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <ScrollArea className="flex-1 px-6">
              <div className="flex flex-col gap-4 py-4">
                {cartItems.map((item) => {
                  const itemKey = `${item.productId}-${item.variant || 'default'}`
                  const effectivePrice = item.salePrice ?? item.price
                  const lineTotal = effectivePrice * item.quantity

                  return (
                    <div
                      key={itemKey}
                      className="flex gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* Product Image */}
                      <div className="size-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold text-gray-900">
                              {item.name}
                            </h4>
                            {item.variant && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {item.variantType
                                  ? `${item.variantType}: ${item.variant}`
                                  : item.variant}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 flex-shrink-0 text-gray-400 hover:text-red-500"
                            onClick={() =>
                              removeFromCart(item.productId, item.variant)
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-0.5 rounded-md border border-gray-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-none rounded-l-md text-gray-600 hover:bg-gray-100"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1,
                                  item.variant
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="flex h-7 w-8 items-center justify-center text-sm font-medium text-gray-900">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-none rounded-r-md text-gray-600 hover:bg-gray-100"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                  item.variant
                                )
                              }
                              disabled={item.quantity >= item.maxStock}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            {item.salePrice !== undefined &&
                            item.salePrice < item.price ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-orange-400">
                                  ₹{lineTotal}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{item.price * item.quantity}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-gray-900">
                                ₹{lineTotal}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Cart Summary - Fixed Bottom */}
            <div className="border-t bg-white px-6 pb-6 pt-4">
              {/* Coupon Code */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="size-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-400">
                        {appliedCoupon}
                      </span>
                      <span className="text-xs text-orange-400">
                        -10% applied
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-gray-500 hover:text-red-500"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          setCouponError('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApplyCoupon()
                        }}
                        className="h-9 pl-8 text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-blue-200 text-orange-400 hover:bg-blue-50 hover:text-orange-400"
                      onClick={handleApplyCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1 text-xs text-red-500">{couponError}</p>
                )}
              </div>

              <Separator className="mb-3" />

              {/* Price Breakdown */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ₹{subtotal}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  {shipping === 0 ? (
                    <span className="font-medium text-orange-400">Free</span>
                  ) : (
                    <span className="font-medium text-gray-900">₹{shipping}</span>
                  )}
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-orange-400">
                      -₹{discount}
                    </span>
                  </div>
                )}
                {gstBreakdown.gstTotal > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <span>Incl. CGST ₹{gstBreakdown.cgst.toFixed(2)} · SGST ₹{gstBreakdown.sgst.toFixed(2)}</span>
                  </div>
                )}
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">
                    Add ₹{499 - subtotal} more for free shipping
                  </p>
                )}
              </div>

              <Separator className="mb-3" />

              {/* Total */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">
                  ₹{total}
                </span>
              </div>

              {/* Action Buttons */}
              <Button
                className="h-11 w-full bg-orange-400 text-base font-semibold hover:bg-orange-400"
                size="lg"
                onClick={handleCheckout}
              >
                Proceed to Checkout
                <ArrowRight className="ml-1 size-4" />
              </Button>

              <Button
                variant="ghost"
                className="mt-2 w-full text-sm text-gray-500 hover:text-orange-400"
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
