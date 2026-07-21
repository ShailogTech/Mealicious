'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, Heart, ShoppingCart, PackageSearch, Minus, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import type { Product } from '@/lib/data'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useAppStore((s) => s.navigate)
  const addToCart = useAppStore((s) => s.addToCart)
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const isInWishlist = useAppStore((s) => s.isInWishlist)
  const cartItems = useAppStore((s) => s.cartItems)
  const removeFromCart = useAppStore((s) => s.removeFromCart)
  const updateQuantity = useAppStore((s) => s.updateQuantity)

  const [imgError, setImgError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const wishlisted = isInWishlist(product.id)

  // Calculate pricing based on first variant if it contains weight values with prices.
  // Declared BEFORE cartItem below, which reads activePricing.variantVal —
  // declaring them in the other order hits the Temporal Dead Zone and throws
  // a ReferenceError on every render (the Add to Cart Application Error).
  const activePricing = (() => {
    const firstVariant = product.variants?.[0]
    if (firstVariant && firstVariant.options?.[0] && typeof firstVariant.options[0] === 'object') {
      const opt = firstVariant.options[0] as any
      return {
        price: opt.price ?? product.price,
        salePrice: opt.salePrice !== undefined ? opt.salePrice : product.salePrice,
        variantVal: opt.value
      }
    }
    return {
      price: product.price,
      salePrice: product.salePrice,
      variantVal: firstVariant?.options?.[0]
    }
  })()

  const cartItem = cartItems.find(
    (ci) => ci.productId === product.id && (ci.variant || 'default') === (activePricing.variantVal || 'default')
  )

  const discountPercent = activePricing.salePrice
    ? Math.round(((activePricing.price - activePricing.salePrice) / activePricing.price) * 100)
    : 0

  const displayPrice = activePricing.salePrice ?? activePricing.price

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    const firstVariant = product.variants?.[0]
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: activePricing.price,
      salePrice: activePricing.salePrice,
      quantity: 1,
      variant: activePricing.variantVal,
      variantType: firstVariant?.type,
      maxStock: product.stock,
      gstPct: product.gstPct,
    })
  }

  function handleWishlist(e: React.MouseEvent) {
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  return (
    <>
      <motion.div
        layoutId={`card-${product.id}`}
        className="h-full"
      >
        <Card
          className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200/60 bg-white hover:shadow-lg hover:border-stone-300 transition-all duration-300 h-full flex flex-col justify-between"
          onClick={() => setIsExpanded(true)}
        >
          {/* Image container */}
          <div className="relative aspect-square overflow-hidden bg-[#faf9f6] p-4 flex items-center justify-center">
            {!imgError ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-stone-50">
                <PackageSearch className="h-10 w-10" />
              </div>
            )}

            {/* Discount badge - Farmley style green tag */}
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-[#10b981] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
                {discountPercent}% OFF
              </span>
            )}

            {/* Rating badge - Farmley style inline on image */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-stone-900 shadow-sm z-10">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-medium">({product.reviewCount})</span>
            </div>

            {/* Wishlist button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm z-10"
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </Button>
          </div>

          <CardContent className="p-3 sm:p-4 space-y-3 flex-1 flex flex-col justify-between bg-white">
            <div className="space-y-1.5">
              {/* Category */}
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                {product.category}
              </span>

              {/* Name - sans serif modern font */}
              <h3 className="font-sans text-xs sm:text-sm font-semibold leading-snug line-clamp-2 min-h-[2.2rem] text-stone-900">
                {product.name}
              </h3>
            </div>

            <div className="space-y-3">
              {/* Price block - bold black, original with strike-through and green text percentage */}
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-stone-900">
                  ₹{displayPrice}
                </span>
                {product.salePrice && (
                  <>
                    <span className="text-xs text-stone-400 line-through">
                      ₹{product.price}
                    </span>
                    <span className="text-[11px] font-bold text-green-600">
                      ({discountPercent}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-stone-400">
                Incl. of all taxes{product.gstPct ? ` · GST ${product.gstPct}%` : ''}
              </p>

              {/* Add to Cart / Quantity Manager */}
              {cartItem ? (
                <div className="flex items-center gap-1.5 w-full">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 sm:h-9 w-8 sm:w-9 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newQty = cartItem.quantity - 1
                      if (newQty <= 0) {
                        removeFromCart(product.id, activePricing.variantVal)
                      } else {
                        updateQuantity(product.id, newQty, activePricing.variantVal)
                      }
                    }}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex-1 flex items-center justify-center text-xs sm:text-sm font-bold text-stone-900 bg-stone-50 h-8 sm:h-9 rounded-xl border border-stone-100">
                    {cartItem.quantity}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 sm:h-9 w-8 sm:w-9 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateQuantity(product.id, cartItem.quantity + 1, activePricing.variantVal)
                    }}
                    disabled={cartItem.quantity >= product.stock}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 sm:h-9 w-8 sm:w-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromCart(product.id, activePricing.variantVal)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-stone-900 hover:bg-stone-850 text-white text-xs sm:text-sm h-8 sm:h-9 rounded-xl font-semibold shadow-sm transition-all duration-200 border-0"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                  Add to Cart
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              layoutId={`card-${product.id}`}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors"
                onClick={() => setIsExpanded(false)}
              >
                <span className="text-xl font-bold">×</span>
              </button>

              <div className="grid md:grid-cols-2">
                {/* Left Side: Product Image */}
                <div className="relative aspect-square md:aspect-auto md:h-full bg-[#faf9f6] min-h-[300px] p-6 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                      unoptimized
                      sizes="400px"
                    />
                  </div>
                </div>

                {/* Right Side: Product Details */}
                <div className="p-6 flex flex-col justify-between space-y-4 bg-white">
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {product.category}
                    </span>
                    <h2 className="font-sans text-lg sm:text-xl font-semibold text-stone-900 leading-tight">
                      {product.name}
                    </h2>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(product.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-muted text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-stone-900">
                        {product.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount} reviews)
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-h-[140px] overflow-y-auto font-sans">
                      {product.description || product.shortDesc}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Price block */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-stone-900">
                        ₹{displayPrice}
                      </span>
                      {product.salePrice && (
                        <>
                          <span className="text-base text-stone-400 line-through">
                            ₹{product.price}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            ({discountPercent}% OFF)
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {cartItem ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newQty = cartItem.quantity - 1
                              if (newQty <= 0) {
                                removeFromCart(product.id, activePricing.variantVal)
                              } else {
                                updateQuantity(product.id, newQty, activePricing.variantVal)
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 flex items-center justify-center text-sm font-bold text-stone-900 bg-stone-50 h-11 rounded-xl border border-stone-100">
                            {cartItem.quantity} in Cart
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(product.id, cartItem.quantity + 1, activePricing.variantVal)
                            }}
                            disabled={cartItem.quantity >= product.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-xl text-red-500 hover:text-red-650 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromCart(product.id, activePricing.variantVal)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="flex-1 bg-stone-900 hover:bg-stone-850 text-white font-bold h-11 rounded-xl text-xs sm:text-sm border-0"
                          onClick={(e) => {
                            handleAddToCart(e)
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="border-stone-900 hover:bg-stone-50 text-stone-950 font-bold h-11 rounded-xl text-xs sm:text-sm"
                        onClick={() => {
                          setIsExpanded(false)
                          navigate('product', { id: product.id })
                        }}
                      >
                        Full Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
