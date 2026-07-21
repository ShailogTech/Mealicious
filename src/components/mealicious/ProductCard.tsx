'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, Heart, ShoppingCart, PackageSearch } from 'lucide-react'
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

  const [imgError, setImgError] = useState(false)
  const wishlisted = isInWishlist(product.id)

  // Calculate pricing based on first variant if it contains weight values with prices
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

  const discountPercent = activePricing.salePrice
    ? Math.round(((activePricing.price - activePricing.salePrice) / activePricing.price) * 100)
    : 0

  const displayPrice = activePricing.salePrice ?? activePricing.price

  function handleCardClick() {
    navigate('product', { id: product.id })
  }

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
    <Card
      className="group cursor-pointer overflow-hidden py-0 gap-0 border-border/50 hover:shadow-lg transition-all duration-300"
      onClick={handleCardClick}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imgError ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-blue-50">
            <PackageSearch className="h-10 w-10" />
          </div>
        )}

        {/* Discount badge */}
        {discountPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white hover:bg-red-600 border-0 text-[11px] font-semibold px-1.5 py-0.5">
            -{discountPercent}%
          </Badge>
        )}

        {/* New badge */}
        {product.isNew && (
          <Badge className="absolute top-2 right-10 bg-orange-400 text-white hover:bg-orange-400 border-0 text-[11px] font-semibold px-1.5 py-0.5">
            NEW
          </Badge>
        )}

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
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

      <CardContent className="p-3 sm:p-4 space-y-2">
        {/* Category badge */}
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium">
          {product.category}
        </Badge>

        {/* Name */}
        <h3 className="font-serif text-sm sm:text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem] text-stone-900 dark:text-stone-100">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= Math.round(product.rating)
                    ? 'fill-orange-400 text-orange-400'
                    : 'fill-muted text-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-orange-400">
            ₹{displayPrice}
          </span>
          {product.salePrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.price}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Incl. of all taxes{product.gstPct ? ` · GST ${product.gstPct}%` : ''}
        </p>

        {/* Add to Cart */}
        <Button
          className="w-full bg-orange-400 hover:bg-orange-400 text-white text-xs sm:text-sm h-8 sm:h-9"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  )
}
