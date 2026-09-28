'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, Heart, ShoppingCart, PackageSearch, Eye, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { useCatalogStore } from '@/lib/catalog-store'
import { adminFetch } from '@/lib/admin-fetch'
import type { Product } from '@/lib/data'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useAppStore((s) => s.navigate)
  const addToCart = useAppStore((s) => s.addToCart)
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const isInWishlist = useAppStore((s) => s.isInWishlist)
  const user = useAppStore((s) => s.user)
  const deleteProduct = useCatalogStore((s) => s.deleteProduct)
  const loadPublicProducts = useCatalogStore((s) => s.loadPublicProducts)

  const isAdmin = user?.role === 'admin'

  const [imgError, setImgError] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bogoActive, setBogoActive] = useState(false)
  const wishlisted = isInWishlist(product.id)

  // BOGO offer flag — public endpoint, browser-cached across cards
  useEffect(() => {
    let active = true
    fetch('/api/offers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setBogoActive(!!data.bogoActive)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

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

  function handleOpenProduct(e: React.MouseEvent) {
    e.stopPropagation()
    navigate('product', { id: product.id })
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete product "${product.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      // deleteProduct handles auth + reloads the catalog. Fall back to a raw
      // admin DELETE + public refresh if the store action is unavailable.
      if (typeof deleteProduct === 'function') {
        await deleteProduct(product.id)
      } else {
        await adminFetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
      }
      if (typeof loadPublicProducts === 'function') {
        await loadPublicProducts()
      }
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert('Failed to delete product. Make sure you are logged in as admin.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden rounded-xl py-0 gap-0 border-border hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      onClick={handleCardClick}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-muted rounded-t-xl">
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
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted">
            <PackageSearch className="h-10 w-10" />
          </div>
        )}

        {/* Discount badge */}
        {discountPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground hover:bg-primary border-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full">
            -{discountPercent}% Off
          </Badge>
        )}

        {/* BOGO badge */}
        {bogoActive && (
          <Badge
            className={`absolute left-2 bg-green-500 text-white hover:bg-green-500 border-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full shadow-sm animate-pulse ${
              discountPercent > 0 ? 'top-9' : 'top-2'
            }`}
          >
            BOGO
          </Badge>
        )}

        {/* New badge */}
        {product.isNew && (
          <Badge className="absolute top-2 right-10 bg-foreground text-background hover:bg-foreground border-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full">
            New
          </Badge>
        )}

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm border border-border hover:bg-card shadow-sm"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              wishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
            }`}
          />
        </Button>

        {/* Open product page (eye) */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-11 right-2 h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm border border-border hover:bg-card shadow-sm"
          onClick={handleOpenProduct}
          aria-label="Open product page"
          title="Open product page"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Admin-only delete */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-2 left-2 h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm border border-border hover:bg-destructive/10 shadow-sm"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete product"
            title="Delete product"
          >
            <Trash2 className={`h-4 w-4 text-destructive ${deleting ? 'animate-pulse' : ''}`} />
          </Button>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 space-y-2">
        {/* Category label */}
        <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {product.category}
        </span>

        {/* Name */}
        <h3 className="text-sm sm:text-base font-black uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.5rem] text-foreground">
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
                    ? 'fill-primary text-primary'
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
          <span className="text-lg font-black text-primary">
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
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-black tracking-wide text-xs h-9 rounded-full"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  )
}
