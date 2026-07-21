'use client'

import { useReducer, useMemo, useCallback } from 'react'
import {
  Filter,
  Grid3X3,
  List,
  SortAsc,
  X,
  ChevronDown,
  SlidersHorizontal,
  Star,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  PackageSearch,
  Heart,
  ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAppStore } from '@/lib/store'
import { useCatalogStore } from '@/lib/catalog-store'
import ProductCard from '@/components/mealicious/ProductCard'
import type { Product } from '@/lib/data'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'
type ViewMode = 'grid' | 'list'

const ITEMS_PER_PAGE = 12

const POPULAR_TAGS = [
  'Premium',
  'Organic',
  'Gluten-Free',
  'Protein-Rich',
  'No Sugar',
  'Vegan',
  'Gifting',
  'Bestseller',
  'Energy',
  'Roasted',
]

const RATING_OPTIONS = [4, 3, 2, 1]

// --- State managed via useReducer to atomically reset page on filter changes ---
interface ShopState {
  selectedCategories: string[]
  priceRange: [number, number]
  minRating: number
  selectedTags: string[]
  sortOption: SortOption
  currentPage: number
  viewMode: ViewMode
  mobileFiltersOpen: boolean
}

type ShopAction =
  | { type: 'SET_CATEGORIES'; payload: string[] }
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'SET_PRICE_RANGE'; payload: [number, number] }
  | { type: 'SET_MIN_RATING'; payload: number }
  | { type: 'TOGGLE_TAG'; payload: string }
  | { type: 'SET_SORT'; payload: SortOption }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_MOBILE_FILTERS'; payload: boolean }
  | { type: 'CLEAR_ALL' }

function shopReducer(state: ShopState, action: ShopAction): ShopState {
  switch (action.type) {
    case 'SET_CATEGORIES':
      return { ...state, selectedCategories: action.payload, currentPage: 1 }
    case 'TOGGLE_CATEGORY': {
      const slug = action.payload
      const selected = state.selectedCategories.includes(slug)
        ? state.selectedCategories.filter((c) => c !== slug)
        : [...state.selectedCategories, slug]
      return { ...state, selectedCategories: selected, currentPage: 1 }
    }
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.payload, currentPage: 1 }
    case 'SET_MIN_RATING':
      return { ...state, minRating: action.payload, currentPage: 1 }
    case 'TOGGLE_TAG': {
      const tag = action.payload
      const selected = state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag]
      return { ...state, selectedTags: selected, currentPage: 1 }
    }
    case 'SET_SORT':
      return { ...state, sortOption: action.payload, currentPage: 1 }
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_MOBILE_FILTERS':
      return { ...state, mobileFiltersOpen: action.payload }
    case 'CLEAR_ALL':
      return {
        ...state,
        selectedCategories: [],
        priceRange: [0, 3000],
        minRating: 0,
        selectedTags: [],
        sortOption: 'featured',
        currentPage: 1,
      }
    default:
      return state
  }
}

// --- FilterSidebar: extracted as a proper component ---
interface FilterSidebarProps {
  selectedCategories: string[]
  priceRange: [number, number]
  minRating: number
  selectedTags: string[]
  activeFilterCount: number
  categories: { id: string; name: string; slug: string }[]
  categoryCounts: Record<string, number>
  onToggleCategory: (slug: string) => void
  onSetPriceRange: (range: [number, number]) => void
  onSetMinRating: (rating: number) => void
  onToggleTag: (tag: string) => void
  onClearAll: () => void
  onClose?: () => void
}

function FilterSidebar({
  selectedCategories,
  priceRange,
  minRating,
  selectedTags,
  activeFilterCount,
  categories,
  categoryCounts,
  onToggleCategory,
  onSetPriceRange,
  onSetMinRating,
  onToggleTag,
  onClearAll,
  onClose,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">Categories</h3>
        <div className="space-y-2.5">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <Checkbox
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={() => onToggleCategory(cat.slug)}
                className="data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                {cat.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {categoryCounts[cat.slug] || 0}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">Price Range</h3>
        <div className="px-1">
          <Slider
            min={0}
            max={3000}
            step={50}
            value={priceRange}
            onValueChange={(val) => onSetPriceRange(val as [number, number])}
            className="mb-4 [&_[data-slot=slider-range]]:bg-[#10b981] [&_[data-slot=slider-thumb]]:border-[#10b981]"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Min</label>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  onSetPriceRange([Math.max(0, Number(e.target.value)), priceRange[1]])
                }
                className="h-8 text-sm"
                min={0}
                max={priceRange[1]}
              />
            </div>
            <span className="text-muted-foreground mt-5">-</span>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Max</label>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  onSetPriceRange([priceRange[0], Math.min(3000, Number(e.target.value))])
                }
                className="h-8 text-sm"
                min={priceRange[0]}
                max={3000}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            ₹{priceRange[0]} — ₹{priceRange[1]}
          </div>
        </div>
      </div>

      <Separator />

      {/* Rating Filter */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">Rating</h3>
        <div className="space-y-2">
          {RATING_OPTIONS.map((rating) => (
            <button
              key={rating}
              onClick={() => onSetMinRating(minRating === rating ? 0 : rating)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors ${
                minRating === rating
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                selectedTags.includes(tag)
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-background text-muted-foreground border-border hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          className="w-full text-sm"
          onClick={() => {
            onClearAll()
            onClose?.()
          }}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  )
}

// --- List view product card ---
function ListProductCard({ product }: { product: Product }) {
  const navigate = useAppStore((s) => s.navigate)
  const addToCart = useAppStore((s) => s.addToCart)
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const isInWishlist = useAppStore((s) => s.isInWishlist)
  const [imgError, setImgError] = useReducer((x: boolean) => !x, false)
  const wishlisted = isInWishlist(product.id)

  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0

  const displayPrice = product.salePrice ?? product.price

  return (
    <div
      className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border/50 hover:shadow-md transition-all duration-300 cursor-pointer bg-card"
      onClick={() => navigate('product', { id: product.id })}
    >
      {/* Image */}
      <div className="relative w-full sm:w-40 h-40 sm:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {!imgError ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={setImgError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-blue-50">
            <PackageSearch className="h-10 w-10" />
          </div>
        )}
        {discountPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white hover:bg-red-600 border-0 text-[11px] font-semibold px-1.5 py-0.5">
            -{discountPercent}%
          </Badge>
        )}
        {product.isNew && (
          <Badge className="absolute top-2 right-2 bg-[#10b981] text-white hover:bg-[#059669] border-0 text-[11px] font-semibold px-1.5 py-0.5">
            NEW
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium mb-1.5">
              {product.category}
            </Badge>
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">
              {product.name}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleWishlist(product.id)
            }}
            className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                wishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              }`}
            />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 hidden sm:block">
          {product.shortDesc}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= Math.round(product.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-muted text-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-[#10b981] border border-blue-100"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#10b981]">₹{displayPrice}</span>
            {product.salePrice && (
              <span className="text-sm text-muted-foreground line-through">₹{product.price}</span>
            )}
          </div>
          <Button
            className="bg-stone-900 hover:bg-stone-850 text-white text-xs sm:text-sm h-8 sm:h-9"
            onClick={(e) => {
              e.stopPropagation()
              const firstVariant = product.variants[0]
              addToCart({
                productId: product.id,
                name: product.name,
                image: product.images[0],
                price: product.price,
                salePrice: product.salePrice,
                quantity: 1,
                variant: firstVariant?.options[0],
                variantType: firstVariant?.type,
                maxStock: product.stock,
                gstPct: product.gstPct,
              })
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Main ShopPage ---
export default function ShopPage() {
  const pageParams = useAppStore((s) => s.pageParams)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const navigate = useAppStore((s) => s.navigate)
  const products = useCatalogStore((s) => s.products)
  const categories = useCatalogStore((s) => s.categories)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    categories.forEach((cat) => {
      counts[cat.slug] = products.filter((p) => p.categorySlug === cat.slug).length
    })
    return counts
  }, [categories, products])

  // Initial categories from pageParams
  const initialCategories = pageParams.category ? [pageParams.category] : []

  const [state, dispatch] = useReducer(shopReducer, {
    selectedCategories: initialCategories,
    priceRange: [0, 3000] as [number, number],
    minRating: 0,
    selectedTags: [],
    sortOption: 'featured' as SortOption,
    currentPage: 1,
    viewMode: 'grid' as ViewMode,
    mobileFiltersOpen: false,
  })

  const {
    selectedCategories,
    priceRange,
    minRating,
    selectedTags,
    sortOption,
    currentPage,
    viewMode,
    mobileFiltersOpen,
  } = state

  // If pageParams.category changes and differs from current selection, update it
  // We detect this by checking if pageParams.category is set and none of our categories are selected
  // This handles navigation from home page category clicks
  const effectiveCategories = useMemo(() => {
    if (pageParams.category && selectedCategories.length === 0) {
      return [pageParams.category]
    }
    return selectedCategories
  }, [pageParams.category, selectedCategories])

  // Filtered & sorted products
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Category filter
    if (effectiveCategories.length > 0) {
      result = result.filter((p) => effectiveCategories.includes(p.categorySlug))
    }

    // Price filter
    result = result.filter((p) => {
      const effectivePrice = p.salePrice ?? p.price
      return effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1]
    })

    // Rating filter
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating)
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter((p) =>
        selectedTags.some((tag) =>
          p.tags.some((pt) => pt.toLowerCase().includes(tag.toLowerCase()))
        )
      )
    }

    // Sort
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
        break
      case 'price-desc':
        result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price))
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        break
    }

    return result
  }, [searchQuery, effectiveCategories, priceRange, minRating, selectedTags, sortOption])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProducts, safePage])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (effectiveCategories.length > 0) count += effectiveCategories.length
    if (priceRange[0] > 0 || priceRange[1] < 3000) count += 1
    if (minRating > 0) count += 1
    if (selectedTags.length > 0) count += selectedTags.length
    return count
  }, [effectiveCategories, priceRange, minRating, selectedTags])

  // Stable callbacks
  const toggleCategory = useCallback(
    (slug: string) => dispatch({ type: 'TOGGLE_CATEGORY', payload: slug }),
    []
  )

  const setPriceRange = useCallback(
    (range: [number, number]) => dispatch({ type: 'SET_PRICE_RANGE', payload: range }),
    []
  )

  const setMinRating = useCallback(
    (rating: number) => dispatch({ type: 'SET_MIN_RATING', payload: rating }),
    []
  )

  const toggleTag = useCallback(
    (tag: string) => dispatch({ type: 'TOGGLE_TAG', payload: tag }),
    []
  )

  const clearAllFilters = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), [])

  // Active filter tags for display
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const activeFilterTags = useMemo(() => {
    const tags: { key: string; label: string; onRemove: () => void }[] = []

    effectiveCategories.forEach((slug) => {
      const cat = categories.find((c) => c.slug === slug)
      if (cat) {
        tags.push({
          key: `cat-${slug}`,
          label: cat.name,
          onRemove: () => toggleCategory(slug),
        })
      }
    })

    if (priceRange[0] > 0 || priceRange[1] < 3000) {
      tags.push({
        key: 'price',
        label: `₹${priceRange[0]} - ₹${priceRange[1]}`,
        onRemove: () => setPriceRange([0, 3000]),
      })
    }

    if (minRating > 0) {
      tags.push({
        key: 'rating',
        label: `${minRating}+ Stars`,
        onRemove: () => setMinRating(0),
      })
    }

    selectedTags.forEach((tag) => {
      tags.push({
        key: `tag-${tag}`,
        label: tag,
        onRemove: () => toggleTag(tag),
      })
    })

    return tags
  }, [effectiveCategories, priceRange, minRating, selectedTags, toggleCategory, setPriceRange, setMinRating, toggleTag])

  // Pagination rendering
  const paginationItems = useMemo(() => {
    const items: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      items.push(1)
      if (safePage > 3) items.push('ellipsis')
      const start = Math.max(2, safePage - 1)
      const end = Math.min(totalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) items.push(i)
      if (safePage < totalPages - 2) items.push('ellipsis')
      items.push(totalPages)
    }
    return items
  }, [totalPages, safePage])

  // Filter sidebar props
  const filterSidebarProps: FilterSidebarProps = {
    selectedCategories: effectiveCategories,
    priceRange,
    minRating,
    selectedTags,
    activeFilterCount,
    categories,
    categoryCounts,
    onToggleCategory: toggleCategory,
    onSetPriceRange: setPriceRange,
    onSetMinRating: setMinRating,
    onToggleTag: toggleTag,
    onClearAll: clearAllFilters,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Category banner (shown when a category is selected) */}
      {(() => {
        const activeSlug = selectedCategories[0] || pageParams.category
        const activeCat = activeSlug ? categories.find((c) => c.slug === activeSlug) : null
        if (!activeCat || !activeCat.image) return null
        return (
          <div className="relative w-full h-40 sm:h-56 overflow-hidden bg-muted">
            <img
              src={activeCat.image}
              alt={activeCat.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )
      })()}

      {/* Header Section */}
      <div className="bg-gradient-to-b from-blue-50 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <button
              onClick={() => navigate('home')}
              className="hover:text-[#10b981] transition-colors"
            >
              Home
            </button>
            <ChevronDown className="h-3 w-3 -rotate-90" />
            <span className="text-foreground font-medium">
              {selectedCategories[0] || pageParams.category
                ? categories.find((c) => c.slug === (selectedCategories[0] || pageParams.category))?.name || 'Shop'
                : 'Shop'}
            </span>
          </nav>

          {/* Title and count */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-foreground">
                {selectedCategories[0] || pageParams.category
                  ? categories.find((c) => c.slug === (selectedCategories[0] || pageParams.category))?.name || 'Shop'
                  : 'Shop Premium Dry Fruits & Snacks'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Showing {filteredProducts.length} of {products.length} products
                {searchQuery && (
                  <span>
                    {' '}
                    for &ldquo;<span className="text-[#10b981] font-medium">{searchQuery}</span>&rdquo;
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile filter button & Sort/View controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Mobile Filter Button */}
          <Sheet
            open={mobileFiltersOpen}
            onOpenChange={(open) => dispatch({ type: 'SET_MOBILE_FILTERS', payload: open })}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="bg-[#10b981] text-white border-0 h-5 w-5 p-0 text-[10px] flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#10b981]" />
                  Filters
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] px-4 pb-4">
                <div className="pt-2">
                  <FilterSidebar
                    {...filterSidebarProps}
                    onClose={() => dispatch({ type: 'SET_MOBILE_FILTERS', payload: false })}
                  />
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Sort dropdown */}
          <Select
            value={sortOption}
            onValueChange={(val) => dispatch({ type: 'SET_SORT', payload: val as SortOption })}
          >
            <SelectTrigger className="w-[180px] gap-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="ml-auto flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className={`h-8 w-8 rounded-none ${
                viewMode === 'grid' ? 'bg-stone-900 hover:bg-stone-850' : ''
              }`}
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className={`h-8 w-8 rounded-none ${
                viewMode === 'list' ? 'bg-stone-900 hover:bg-stone-850' : ''
              }`}
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filter tags */}
        {activeFilterTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground font-medium mr-1">Active Filters:</span>
            {activeFilterTags.map((tag) => (
              <Badge
                key={tag.key}
                variant="secondary"
                className="gap-1 pr-1 text-xs font-medium bg-blue-50 text-[#10b981] border-blue-200 hover:bg-blue-100"
              >
                {tag.label}
                <button
                  onClick={tag.onRemove}
                  className="ml-0.5 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-blue-200 transition-colors"
                  aria-label={`Remove ${tag.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-700 font-medium ml-2 underline underline-offset-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main content area */}
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-[#10b981]" />
                <h2 className="font-semibold text-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <Badge className="bg-[#10b981] text-white border-0 h-5 min-w-5 px-1.5 text-[10px] flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-[calc(100vh-160px)]">
                <FilterSidebar {...filterSidebarProps} />
              </ScrollArea>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <PackageSearch className="h-10 w-10 text-[#10b981]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mb-6">
                  We couldn&apos;t find any products matching your filters. Try adjusting your
                  selection or clearing some filters.
                </p>
                <Button
                  onClick={clearAllFilters}
                  className="bg-stone-900 hover:bg-stone-850 text-white"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedProducts.map((product) => (
                  <ListProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                role="navigation"
                aria-label="pagination"
                className="mt-8 sm:mt-10 flex justify-center"
              >
                <ul className="flex flex-row items-center gap-1">
                  <li>
                    <button
                      onClick={() => dispatch({ type: 'SET_PAGE', payload: Math.max(1, safePage - 1) })}
                      disabled={safePage === 1}
                      className="inline-flex items-center gap-1 px-2.5 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                  </li>
                  {paginationItems.map((item, i) =>
                    item === 'ellipsis' ? (
                      <li key={`ellipsis-${i}`}>
                        <span className="flex h-9 w-9 items-center justify-center">
                          <MoreHorizontal className="h-4 w-4" />
                        </span>
                      </li>
                    ) : (
                      <li key={item}>
                        <button
                          onClick={() => dispatch({ type: 'SET_PAGE', payload: item })}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            safePage === item
                              ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                          aria-current={safePage === item ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      </li>
                    )
                  )}
                  <li>
                    <button
                      onClick={() => dispatch({ type: 'SET_PAGE', payload: Math.min(totalPages, safePage + 1) })}
                      disabled={safePage === totalPages}
                      className="inline-flex items-center gap-1 px-2.5 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                      aria-label="Go to next page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

