'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Star,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
  ChevronRight,
  ZoomIn,
  CheckCircle2,
  PackageSearch,
  Check,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore, trackActivity } from '@/lib/store'
import { useCatalogStore } from '@/lib/catalog-store'
import ProductCard from '@/components/mealicious/ProductCard'
import { ShippingBox } from '@/components/mealicious/ShippingBox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ProductDetail() {
  const navigate = useAppStore((s) => s.navigate)
  const pageParams = useAppStore((s) => s.pageParams)
  const addToCart = useAppStore((s) => s.addToCart)
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const isInWishlist = useAppStore((s) => s.isInWishlist)
  const allProducts = useCatalogStore((s) => s.products)

  const product = useMemo(
    () => allProducts.find((p) => p.id === (pageParams.id || '')),
    [pageParams.id, allProducts],
  )

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [imgError, setImgError] = useState<Record<number, boolean>>({})

  // Track the current product ID to reset state on navigation
  const [lastProductId, setLastProductId] = useState<string | null>(null)
  if (product && product.id !== lastProductId) {
    setLastProductId(product.id)
    setSelectedVariants({})
    setSelectedImage(0)
    setQuantity(1)
    setImgError({})
  }

  // Compute effective variants: user selection with fallback to first option
  const effectiveVariants = useMemo(() => {
    if (!product) return {}
    const result: Record<string, string> = {}
    product.variants.forEach((v) => {
      result[v.type] = selectedVariants[v.type] || v.options[0]
    })
    return result
  }, [product, selectedVariants])

  // Real reviews from DB — hooks MUST be before any early return
  const [productReviews, setProductReviews] = useState<{ id: string; name: string; rating: number; title: string; comment: string; date: string; verified: boolean }[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 0, title: '', comment: '' })
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let active = true
    const fetchReviews = async () => {
      if (!product?.id) return
      try {
        const res = await fetch(`/api/products/${product.id}/reviews`)
        if (res.ok && active) {
          const data = await res.json()
          setProductReviews(data.reviews)
        }
      } catch {}
      if (active) {
        setReviewsLoaded(true)
      }
    }
    fetchReviews()
    return () => {
      active = false
    }
  }, [product?.id])

  // CRM activity log — one view_product event per product page visit
  useEffect(() => {
    const p = product
    if (!p?.id) return
    trackActivity({
      activityType: 'view_product',
      productId: p.id,
      productName: p.name,
      metadata: { price: p.salePrice ?? p.price },
    })
  }, [product?.id])

  // Calculate dynamic variant-based price
  const activePricing = useMemo(() => {
    if (!product) return { price: 0, salePrice: null }
    const selectedWeight = effectiveVariants['Weight']
    if (selectedWeight && typeof selectedWeight === 'object' && selectedWeight) {
      const price = (selectedWeight as any).price ?? product.price
      const salePrice = (selectedWeight as any).salePrice !== undefined ? (selectedWeight as any).salePrice : product.salePrice
      return { price, salePrice }
    }
    return { price: product.price, salePrice: product.salePrice }
  }, [product, effectiveVariants])

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Product not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('shop')}
        >
          Back to Shop
        </Button>
      </div>
    )
  }

  const wishlisted = isInWishlist(product.id)

  const discountPercent = activePricing.salePrice
    ? Math.round(((activePricing.price - activePricing.salePrice) / activePricing.price) * 100)
    : 0
  const displayPrice = activePricing.salePrice ?? activePricing.price

  async function submitReview() {
    if (!reviewForm.name || !reviewForm.comment || !reviewForm.rating) {
      toast.error('Name, rating and comment are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${product!.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success('Review submitted! It will appear after moderation.')
      setSubmitted(true)
      setReviewForm({ name: '', email: '', rating: 0, title: '', comment: '' })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = productReviews.filter((r) => r.rating === star).length
    const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0
    return { star, count, percentage }
  })

  // Stock status
  const stockStatus = (() => {
    if (product.stock === 0) return { label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50' }
    if (product.stock <= 20) return { label: `Low Stock - Only ${product.stock} left!`, color: 'text-orange-400', bgColor: 'bg-orange-50' }
    return { label: 'In Stock', color: 'text-orange-400', bgColor: 'bg-blue-50' }
  })()

  const variantString = Object.entries(effectiveVariants)
    .map(([, val]) => typeof val === 'object' && val ? (val as any).value : val)
    .join(' / ')

  function handleAddToCart() {
    const firstVariant = product.variants[0]
    const firstOptionVal = typeof firstVariant?.options[0] === 'object' && firstVariant?.options[0] 
      ? (firstVariant?.options[0] as any).value 
      : firstVariant?.options[0]

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: activePricing.price,
      salePrice: activePricing.salePrice,
      quantity,
      variant: variantString || firstOptionVal,
      variantType: firstVariant?.type,
      maxStock: product.stock,
      gstPct: product.gstPct,
    })
  }

  function handleBuyNow() {
    handleAddToCart()
    navigate('checkout')
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap"
      >
        <button
          onClick={() => navigate('home')}
          className="hover:text-orange-400 transition-colors"
        >
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button
          onClick={() => navigate('shop')}
          className="hover:text-orange-400 transition-colors"
        >
          Shop
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button
          onClick={() => navigate('shop', { category: product.categorySlug })}
          className="hover:text-orange-400 transition-colors"
        >
          {product.category}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </motion.nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Left Column - Images */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Main Image */}
          <div
            className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-border/50 cursor-crosshair group"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            {!imgError[selectedImage] ? (
              <>
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-200"
                  style={
                    isZoomed
                      ? { transform: 'scale(2)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                      : {}
                  }
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  onError={() => setImgError((prev) => ({ ...prev, [selectedImage]: true }))}
                />
                {/* Zoom indicator */}
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-4 w-4 text-gray-600" />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-blue-50">
                <PackageSearch className="h-20 w-20" />
              </div>
            )}

            {/* Discount badge */}
            {discountPercent > 0 && (
              <Badge className="absolute top-3 left-3 bg-red-500 text-white hover:bg-red-600 border-0 text-xs font-bold px-2.5 py-1">
                -{discountPercent}%
              </Badge>
            )}

            {/* Bestseller badge */}
            {product.bestSeller && (
              <Badge className="absolute top-3 left-3 mt-9 bg-orange-400 text-white hover:bg-orange-400 border-0 text-xs font-bold px-2.5 py-1">
                Bestseller
              </Badge>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(idx)
                    setImgError((prev) => ({ ...prev, [idx]: false }))
                  }}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === idx
                      ? 'border-orange-400 shadow-md'
                      : 'border-border/50 hover:border-blue-300'
                  }`}
                >
                  {!imgError[idx] ? (
                    <Image
                      src={img}
                      alt={`${product.name} - Image ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      onError={() => setImgError((prev) => ({ ...prev, [idx]: true }))}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-50">
                      <PackageSearch className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right Column - Details */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col"
        >
          {/* Category Badge */}
          <Badge variant="secondary" className="w-fit text-xs font-medium mb-3">
            {product.category}
          </Badge>

          {/* Product Name */}
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-foreground leading-tight mb-3">
            {product.name}
          </h1>

          {/* Rating + Review Count + Write Review */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(product.rating)
                      ? 'fill-orange-400 text-orange-400'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm font-semibold text-foreground">
                {product.rating}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount} reviews)
            </span>
            <button className="text-sm text-orange-400 hover:text-orange-400 font-medium transition-colors">
              Write a Review
            </button>
          </div>

          {/* Price Display */}
          <div className="flex items-baseline gap-3 mb-4 flex-wrap">
            <span className="text-3xl font-bold text-orange-400">
              ₹{displayPrice}
            </span>
            {product.salePrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ₹{product.price}
                </span>
                <Badge className="bg-blue-100 text-orange-400 hover:bg-blue-100 border-0 text-xs font-bold px-2 py-0.5">
                  Save {discountPercent}%
                </Badge>
              </>
            )}
          </div>

          {/* Short Description */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-5">
            {product.shortDesc}
          </p>

          <Separator className="mb-5" />

          {/* Variant Selectors */}
          {product.variants.map((variant) => (
            <div key={variant.type} className="mb-4">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                {variant.type}:{' '}
                <span className="font-normal text-orange-400">
                  {(() => {
                    const sel = effectiveVariants[variant.type]
                    return typeof sel === 'object' && sel ? (sel as any).value : sel
                  })()}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => {
                  const optVal = typeof option === 'object' && option ? (option as any).value : option
                  const isSelected = (() => {
                    const sel = effectiveVariants[variant.type]
                    const selVal = typeof sel === 'object' && sel ? (sel as any).value : sel
                    return selVal === optVal
                  })()

                  return (
                    <button
                      key={optVal}
                      onClick={() =>
                        setSelectedVariants((prev) => ({ ...prev, [variant.type]: option }))
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-400 text-white border-orange-400 shadow-sm'
                          : 'bg-white text-foreground border-border hover:border-blue-400 hover:text-orange-400'
                      }`}
                    >
                      {optVal}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
              {product.stock > 0 && <CheckCircle2 className="h-3.5 w-3.5" />}
              {stockStatus.label}
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-5">
            <label className="text-sm font-semibold text-foreground">Quantity:</label>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="h-10 w-12 flex items-center justify-center text-sm font-semibold border-x border-border">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <Button
              size="lg"
              disabled={product.stock === 0}
              className="flex-1 min-w-[160px] bg-orange-400 hover:bg-orange-400 text-white h-12 text-base font-semibold"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={product.stock === 0}
              className="flex-1 min-w-[140px] border-orange-400 text-orange-400 hover:bg-blue-50 h-12 text-base font-semibold"
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-12 px-0 border-border hover:border-red-300"
              onClick={() => toggleWishlist(product.id)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'
                }`}
              />
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Truck className="h-5 w-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Free Delivery</p>
                <p className="text-[11px] text-muted-foreground">On orders ₹499+</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <RotateCcw className="h-5 w-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">3-7 Days Delivery</p>
                <p className="text-[11px] text-muted-foreground">Across India</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Food Safety</p>
                <p className="text-[11px] text-muted-foreground">No return policy</p>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <ShippingBox
            productPrice={product.price || 0}
            productWeight={0.5}
            declaredValue={product.price || 500}
          />

          {/* SKU */}
          <p className="text-xs text-muted-foreground mt-4">
            SKU: <span className="font-mono font-medium">{product.sku}</span>
          </p>
        </motion.div>
      </div>

      {/* Product Tabs */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-16"
      >
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full sm:w-auto flex justify-start overflow-x-auto">
            <TabsTrigger value="description" className="px-6">Description</TabsTrigger>
            <TabsTrigger value="nutrition" className="px-6">Nutrition Info</TabsTrigger>
            <TabsTrigger value="reviews" className="px-6">
              Reviews ({product.reviewCount})
            </TabsTrigger>
          </TabsList>

          {/* Description Tab */}
          <TabsContent value="description" className="mt-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {product.description}
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <h4 className="font-semibold text-orange-400 text-sm mb-2">Why Choose This Product?</h4>
                  <ul className="space-y-1.5 text-sm text-orange-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      Premium quality, handpicked selection
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      No artificial preservatives or colors
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      Freshness guaranteed with airtight packaging
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      FSSAI certified and quality tested
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                  <h4 className="font-semibold text-orange-400 text-sm mb-2">Storage Instructions</h4>
                  <ul className="space-y-1.5 text-sm text-orange-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      Store in a cool, dry place
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      Reseal the pack after opening
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      Best consumed within 30 days of opening
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      Keep away from direct sunlight
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="mt-6">
            <div className="max-w-lg">
              <h3 className="font-semibold text-foreground text-lg mb-4">
                Nutrition Information
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Approximate values per 100g serving
              </p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-orange-400">
                        Nutrient
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-orange-400">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Calories', value: product.nutrition.calories },
                      { label: 'Protein', value: product.nutrition.protein },
                      { label: 'Total Fat', value: product.nutrition.fat },
                      { label: 'Carbohydrates', value: product.nutrition.carbs },
                      { label: 'Dietary Fiber', value: product.nutrition.fiber },
                    ].map((row, idx) => (
                      <tr
                        key={row.label}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}
                      >
                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right font-semibold">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating Summary */}
              <div className="lg:col-span-1">
                <div className="p-6 rounded-xl border border-border bg-muted/30">
                  <div className="text-center mb-4">
                    <p className="text-5xl font-bold text-foreground">{product.rating}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(product.rating)
                              ? 'fill-orange-400 text-orange-400'
                              : 'fill-muted text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on {product.reviewCount} reviews
                    </p>
                  </div>

                  {/* Star Distribution */}
                  <div className="space-y-2 mt-4">
                    {ratingDistribution.map(({ star, count, percentage }) => (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-3 text-muted-foreground font-medium">{star}</span>
                        <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-400 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews List + Write Review */}
              <div className="lg:col-span-2 space-y-4">
                {/* Write Review Form */}
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/30">
                  <h4 className="font-semibold text-sm mb-3">Write a Review</h4>
                  {submitted ? (
                    <p className="text-sm text-green-600 font-medium">✓ Review submitted! It will appear after moderation.</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Star picker */}
                      <div>
                        <Label className="text-xs mb-1 block">Your Rating *</Label>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <button
                              key={s}
                              type="button"
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                            >
                              <Star className={`h-6 w-6 transition-colors ${s <= (hoverRating || reviewForm.rating) ? 'fill-orange-400 text-orange-400' : 'text-neutral-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Name *</Label><Input className="mt-1 h-8 text-sm" value={reviewForm.name} onChange={e => setReviewForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" /></div>
                        <div><Label className="text-xs">Email</Label><Input className="mt-1 h-8 text-sm" type="email" value={reviewForm.email} onChange={e => setReviewForm(p => ({ ...p, email: e.target.value }))} placeholder="Optional" /></div>
                      </div>
                      <div><Label className="text-xs">Title</Label><Input className="mt-1 h-8 text-sm" value={reviewForm.title} onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))} placeholder="Summary of your review" /></div>
                      <div><Label className="text-xs">Review *</Label><Textarea className="mt-1 text-sm" rows={3} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} placeholder="Share your experience…" /></div>
                      <Button size="sm" onClick={submitReview} disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
                        {submitting ? 'Submitting…' : 'Submit Review'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Reviews List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {!reviewsLoaded && <p className="text-sm text-muted-foreground">Loading reviews…</p>}
                  {reviewsLoaded && productReviews.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet. Be the first!</p>
                  )}
                  {productReviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl border border-border hover:border-blue-200 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{review.name}</span>
                            {review.verified && (
                              <Badge className="bg-blue-100 text-orange-400 hover:bg-blue-100 border-0 text-[10px] px-1.5 py-0 inline-flex items-center gap-0.5">
                                <Check className="h-3 w-3" /> Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-orange-400 text-orange-400' : 'fill-muted text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {review.title && <h4 className="font-semibold text-sm text-foreground mb-1">{review.title}</h4>}
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Related Products */}
      {(() => {
        const related = allProducts
          .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
          .slice(0, 4)
        if (related.length === 0) return null
        return (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Separator className="mb-10" />
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                You May Also Like
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Similar products you might enjoy
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </motion.section>
        )
      })()}

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}
