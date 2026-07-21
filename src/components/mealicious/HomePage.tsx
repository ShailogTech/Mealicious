'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Leaf,
  ShieldCheck,
  Package,
  Truck,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Send,
  Nut,
  Grape,
  Soup,
} from 'lucide-react'
import { CategoryIcon } from '@/lib/category-icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { useCatalogStore } from '@/lib/catalog-store'
import { testimonials } from '@/lib/data'
import ProductCard from '@/components/mealicious/ProductCard'

/* ─────────────────────── animation helpers ─────────────────────── */

function FadeInWhenVisible({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

/* ─────────────────────── stat items ─────────────────────── */

const stats = [
  { label: 'Happy Customers', value: '10,000+' },
  { label: 'Products', value: '50+' },
  { label: 'Natural', value: '100%' },
  { label: 'Free Shipping', value: '₹499+' },
]

/* ─────────────────────── why choose us items ─────────────────────── */

const whyChooseItems = [
  {
    icon: Leaf,
    title: 'Farm Fresh Quality',
    desc: 'Directly sourced from premium farms',
    color: 'text-orange-400',
    bg: 'bg-blue-50',
  },
  {
    icon: ShieldCheck,
    title: 'No Preservatives',
    desc: '100% natural, no artificial additives',
    color: 'text-orange-400',
    bg: 'bg-blue-50',
  },
  {
    icon: Package,
    title: 'Secure Packaging',
    desc: 'Vacuum-sealed for maximum freshness',
    color: 'text-orange-400',
    bg: 'bg-blue-50',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: '3-7 days delivery across India',
    color: 'text-orange-400',
    bg: 'bg-blue-50',
  },
]

/* ═══════════════════════ HOME PAGE ═══════════════════════ */

export default function HomePage() {
  const navigate = useAppStore((s) => s.navigate)
  const products = useCatalogStore((s) => s.products)
  const categories = useCatalogStore((s) => s.categories)
  const featuredProducts = products.filter((p) => p.featured)
  const bestSellers = products.filter((p) => p.bestSeller)
  const newArrivals = products.filter((p) => p.isNew)

  interface PublicBanner {
    id: string
    title: string
    subtitle?: string
    image: string
    link?: string
  }

  const [banners, setBanners] = useState<PublicBanner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  useEffect(() => {
    fetch('/api/banners?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.banners) && data.banners.length > 0) {
          setBanners(data.banners)
        }
      })
      .catch(err => console.error('Error loading home banners:', err))
  }, [])

  const nextSlide = () => {
    if (banners.length <= 1) return
    setCurrentBannerIndex(prev => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    if (banners.length <= 1) return
    setCurrentBannerIndex(prev => (prev - 1 + banners.length) % banners.length)
  }

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners, currentBannerIndex])

  const hasBanners = banners.length > 0
  const activeBanner = hasBanners ? banners[currentBannerIndex] : null

  const heroTitle = (activeBanner && typeof activeBanner.title === 'string') ? activeBanner.title.trim() : 'Premium Dry Fruits & Healthy Snacks'
  const heroSubtitle = (activeBanner && typeof activeBanner.subtitle === 'string') ? activeBanner.subtitle : "Experience nature's premium harvest. Indulge in clean, nutrient-dense snacking sourced from elite farms."
  const heroLink = activeBanner ? activeBanner.link : null

  const handleBannerClick = () => {
    if (!heroLink) {
      navigate('shop')
      return
    }
    const cleanLink = heroLink.replace(/^\//, '').toLowerCase().trim()
    if (cleanLink === 'shop') {
      navigate('shop')
    } else if (cleanLink.startsWith('shop?category=')) {
      const cat = cleanLink.split('=')[1]
      navigate('shop', { category: cat })
    } else if (cleanLink === 'about') {
      navigate('about')
    } else if (cleanLink === 'contact') {
      navigate('contact')
    } else if (cleanLink === 'blog') {
      navigate('blog')
    } else {
      if (heroLink.startsWith('http://') || heroLink.startsWith('https://')) {
        window.open(heroLink, '_blank')
      } else {
        navigate('shop')
      }
    }
  }

  const renderTitle = () => {
    if (!activeBanner) {
      return (
        <>
          Premium Dry Fruits
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
            &amp; Healthy Snacks
          </span>
        </>
      )
    }
    const words = heroTitle.split(' ')
    if (words.length <= 2) {
      return (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
          {heroTitle}
        </span>
      )
    }
    const mainText = words.slice(0, -2).join(' ')
    const gradientText = words.slice(-2).join(' ')
    return (
      <>
        {mainText}{' '}
        <br className="hidden sm:inline" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
          {gradientText}
        </span>
      </>
    )
  }

  return (
    <div className="flex flex-col">
      {/* ──────── 1. Hero Section ──────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border-b border-white/5">
        {/* Glow ambient blurs */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-orange-600/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center lg:text-left space-y-6"
            >
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2 text-sm px-3 py-1 inline-flex items-center gap-1.5 rounded-full">
                <Leaf className="h-3.5 w-3.5" /> 100% Organic & Handpicked
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight min-h-[120px] sm:min-h-[150px] md:min-h-auto font-serif">
                {renderTitle()}
              </h1>
              <p className="text-base sm:text-lg text-stone-400 max-w-lg mx-auto lg:mx-0 leading-relaxed min-h-[60px] md:min-h-auto">
                {heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 transition-all rounded-xl px-8"
                  onClick={handleBannerClick}
                >
                  {activeBanner ? 'Shop Now' : 'Shop Collection'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 font-semibold rounded-xl px-8 transition-all"
                  onClick={() => navigate('shop', { category: 'combo-packs' })}
                >
                  Explore Combos
                </Button>
              </div>
            </motion.div>

            {/* Right — Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block relative"
            >
              <div className="relative w-full h-[450px] flex justify-center items-center">
                {/* Backdrop ambient blur glow */}
                <div className="absolute -inset-10 rounded-full bg-amber-500/10 blur-3xl opacity-70 animate-pulse" />
                
                {/* Float Card 1: Organic Badge */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute top-8 left-0 z-10 flex items-center gap-3 bg-stone-950/80 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-white/5"
                >
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-medium">Sourced</p>
                    <p className="text-sm font-bold text-white">100% Organic</p>
                  </div>
                </motion.div>

                {/* Float Card 2: Happy Customers */}
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute bottom-8 right-0 z-10 flex items-center gap-3 bg-stone-950/80 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-white/5"
                >
                  <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-medium">Ratings</p>
                    <p className="text-sm font-bold text-white">4.9/5 (10k+ Reviews)</p>
                  </div>
                </motion.div>

                {/* Main Hero Product Image / Carousel */}
                <div className="relative w-[380px] h-[380px] xl:w-[420px] xl:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-tr from-stone-900 to-stone-950 group">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentBannerIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <Image
                        src={activeBanner && activeBanner.image ? activeBanner.image : "/images/banners/hero-banner.png"}
                        alt={activeBanner ? activeBanner.title : "Premium dry fruits composition"}
                        fill
                        priority
                        unoptimized
                        sizes="(max-w-768px) 100vw, 450px"
                        className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Carousel Left/Right controls */}
                  {banners.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-stone-950/60 hover:bg-stone-950/80 text-white backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-stone-950/60 hover:bg-stone-950/80 text-white backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                    </>
                  )}

                  {/* Dot Indicators */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-stone-950/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      {banners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentBannerIndex(idx)}
                          className={`h-2 w-2 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-amber-400 w-4' : 'bg-white/40 hover:bg-white/60'}`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-orange-400/60 backdrop-blur-sm border-t border-orange-400/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-200">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────── 2. Category Section ──────── */}
      <section className="py-14 sm:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-serif">
                Shop by Category
              </h2>
              <p className="mt-2 text-muted-foreground">
                Explore our curated collection of premium dry fruits &amp; snacks
              </p>
            </div>
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={staggerChild}>
                <Card
                  className="group cursor-pointer overflow-hidden py-0 gap-0 border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  onClick={() => navigate('shop', { category: cat.slug })}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2">
                      <CategoryIcon name={cat.icon} className="h-6 w-6 text-white drop-shadow" />
                      <div>
                        <h3 className="font-semibold text-white text-sm leading-tight drop-shadow">
                          {cat.name}
                        </h3>
                        <span className="text-xs text-white/80">
                          {cat.productCount} Products
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 3. Featured Products Section ──────── */}
      <section className="py-14 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-serif">
                  Featured Products
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Our handpicked favorites just for you
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-orange-400 hover:text-orange-400 font-semibold"
                onClick={() => navigate('shop')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <motion.div key={product.id} variants={staggerChild}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 4. Best Sellers Section ──────── */}
      <section className="py-14 sm:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-serif">
                  Best Sellers
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Loved by thousands of our customers
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-orange-400 hover:text-orange-400 font-semibold"
                onClick={() => navigate('shop')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </FadeInWhenVisible>

          {/* Horizontal scrollable row */}
          <FadeInWhenVisible>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              {bestSellers.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[220px] sm:min-w-[260px] snap-start shrink-0"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ──────── 5. Why Choose Us Section ──────── */}
      <section className="py-14 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-serif">
                Why Choose Mealicious?
              </h2>
              <p className="mt-2 text-muted-foreground">
                We take pride in delivering the best to your table
              </p>
            </div>
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {whyChooseItems.map((item) => {
              const Icon = item.icon
              return (
                <motion.div key={item.title} variants={staggerChild}>
                  <Card className="text-center py-6 hover:shadow-md transition-shadow border-border/50 h-full">
                    <CardContent className="p-4 sm:p-6 space-y-3 flex flex-col items-center">
                      <div
                        className={`rounded-full ${item.bg} p-3 sm:p-4`}
                      >
                        <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${item.color}`} />
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 6. New Arrivals Section ──────── */}
      <section className="py-14 sm:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-serif">
                  New Arrivals
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Fresh additions to our collection
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-orange-400 hover:text-orange-400 font-semibold"
                onClick={() => navigate('shop')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <motion.div key={product.id} variants={staggerChild}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 7. Testimonials Section ──────── */}
      <section className="py-14 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-serif">
                What Our Customers Say
              </h2>
              <p className="mt-2 text-muted-foreground">
                Real reviews from real customers
              </p>
            </div>
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <motion.div key={t.id} variants={staggerChild}>
                <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-orange-400 font-bold text-sm">
                        {t.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.location}
                        </p>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < t.rating
                              ? 'fill-orange-400 text-orange-400'
                              : 'fill-muted text-muted'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      &ldquo;{t.comment}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 8. Newsletter Section ──────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-400 to-orange-400">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <FadeInWhenVisible>
            <div className="text-center max-w-xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
                Join the Mealicious Family
              </h2>
              <p className="text-blue-100">
                Subscribe for exclusive offers and health tips
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="h-11 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus-visible:border-white/50 focus-visible:ring-white/30"
                />
                <Button
                  size="lg"
                  className="bg-white text-orange-400 hover:bg-blue-50 font-semibold shrink-0"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-blue-200/80 mt-2">
                No spam, unsubscribe anytime. We respect your privacy.
              </p>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
    </div>
  )
}
