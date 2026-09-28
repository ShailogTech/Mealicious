'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion'
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
  Users,
} from 'lucide-react'
import { CategoryIcon } from '@/lib/category-icons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
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

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

/* ─────────────────────── section heading helper ─────────────────────── */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  right,
  center = false,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  right?: React.ReactNode
  center?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-4 ${
        center ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      } mb-10`}
    >
      <div className={center ? 'max-w-2xl' : ''}>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </span>
        <h2 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-none">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

/* ─────────────────────── stat items ─────────────────────── */

const stats = [
  { label: 'Happy Customers', value: '10,000+', icon: Users },
  { label: 'Premium Snacks', value: '50+', icon: Package },
  { label: 'Fresh Quality', value: '100%', icon: Leaf },
  { label: 'Free Shipping', value: '₹499+', icon: Truck },
]

/* ─────────────────────── why choose us items ─────────────────────── */

const whyChooseItems = [
  {
    icon: Leaf,
    title: 'Farm Fresh Quality',
    desc: 'Directly sourced from premium farms, eliminating middlemen and stale warehousing delays.',
    tag: 'Grade A Selection',
  },
  {
    icon: ShieldCheck,
    title: 'No Preservatives',
    desc: '100% natural, zero artificial additives, colours or palm oil substitutes.',
    tag: 'Clean Label Verified',
  },
  {
    icon: Package,
    title: 'Secure Packaging',
    desc: 'Vacuum-sealed for maximum freshness — moisture out, crunch locked in.',
    tag: 'Air-Tight Flush',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'Dispatched within 24 hours. Express 3-7 days tracked delivery across India.',
    tag: 'Pan India Transit',
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
    const accentClasses =
      'text-transparent bg-clip-text bg-gradient-to-r from-primary via-[var(--brand-orange)] to-[var(--brand-deep)]'
    if (!activeBanner) {
      return (
        <>
          Premium Dry Fruits
          <br />
          <span className={accentClasses}>&amp; Healthy Snacks</span>
        </>
      )
    }
    const words = heroTitle.split(' ')
    if (words.length <= 2) {
      return <span className={accentClasses}>{heroTitle}</span>
    }
    const mainText = words.slice(0, -2).join(' ')
    const gradientText = words.slice(-2).join(' ')
    return (
      <>
        {mainText}{' '}
        <br className="hidden sm:inline" />
        <span className={accentClasses}>{gradientText}</span>
      </>
    )
  }

  return (
    <div className="flex flex-col">
      {/* ──────── 1. Hero Section ──────── */}
      <section className="relative overflow-hidden bg-background border-b border-border">
        {/* Ambient brand glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-[130px]" />
        <div className="pointer-events-none absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-[140px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left — text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 text-center lg:text-left space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  100% Organic &amp; Handpicked
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] text-foreground min-h-[120px] sm:min-h-[150px] md:min-h-auto">
                {renderTitle()}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed min-h-[60px] md:min-h-auto">
                {heroSubtitle}
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-black tracking-wide rounded-full px-8 shadow-lg shadow-primary/25 hover:scale-[1.02]"
                  onClick={handleBannerClick}
                >
                  {activeBanner ? 'Shop Now' : 'Shop Collection'}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="uppercase font-bold tracking-wide rounded-full px-8 border-2 border-foreground/80 text-foreground hover:bg-foreground hover:text-background bg-transparent"
                  onClick={() => navigate('shop', { category: 'combo-packs' })}
                >
                  Explore Combos
                </Button>
              </div>

              {/* Mini trust chips */}
              <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg mx-auto lg:mx-0">
                <div className="bg-card p-3 rounded-xl border border-border shadow-sm text-left">
                  <div className="flex items-center gap-1 text-primary mb-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-xs font-bold text-foreground">4.9 / 5</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">10k+ Reviews</p>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border shadow-sm text-left">
                  <p className="text-lg font-black text-primary leading-none mb-1">10,000+</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Happy Snackers</p>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border shadow-sm text-left">
                  <div className="flex items-center gap-1 text-primary mb-1">
                    <Truck className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold text-foreground">FREE</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Orders Over ₹499</p>
                </div>
              </div>
            </motion.div>

            {/* Right — Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 hidden lg:block relative"
            >
              <div className="relative w-full h-[450px] flex justify-center items-center">
                {/* Float Card 1: Organic Badge */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute top-8 left-0 z-10 flex items-center gap-3 bg-card/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-border"
                >
                  <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sourced</p>
                    <p className="text-sm font-black uppercase text-foreground">100% Organic</p>
                  </div>
                </motion.div>

                {/* Float Card 2: Happy Customers */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="absolute bottom-8 right-0 z-10 flex items-center gap-3 bg-card/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-border"
                >
                  <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ratings</p>
                    <p className="text-sm font-black text-foreground">4.9/5 (10k+ Reviews)</p>
                  </div>
                </motion.div>

                {/* Main Hero Product Image / Carousel */}
                <div className="relative w-[380px] h-[380px] xl:w-[420px] xl:h-[420px] rounded-2xl overflow-hidden shadow-xl border border-border bg-muted group">
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border hover:border-primary transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border hover:border-primary transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}

                  {/* Dot Indicators */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
                      {banners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentBannerIndex(idx)}
                          className={`h-2 w-2 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-primary w-4' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}`}
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
      </section>

      {/* ──────── 2. Trust Stats Bar ──────── */}
      <section className="w-full bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
            {stats.map((stat) => {
              const StatIcon = stat.icon
              return (
                <div key={stat.label} className="flex items-center gap-3.5 lg:justify-center lg:px-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <StatIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-foreground leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary mt-1">
                      {stat.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ──────── 3. Category Section ──────── */}
      <section className="py-16 bg-background" id="categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <SectionHeading
              eyebrow="[ Made for Everyday Snacking ]"
              title="Shop by Category"
              subtitle="Explore our curated collection of premium grade-A dry fruits, artisanal nuts & slow-roasted snacks."
              right={
                <span className="hidden md:inline-block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {categories.length} Curated Harvests
                </span>
              }
            />
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={staggerChild}>
                <Card
                  className="group relative cursor-pointer overflow-hidden rounded-xl py-0 gap-0 aspect-[4/5] justify-end border-border hover:border-primary hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  onClick={() => navigate('shop', { category: cat.slug })}
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative z-10 space-y-1.5 p-4 sm:p-5">
                    <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                      {cat.productCount} Products
                    </span>
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        name={cat.icon}
                        className="h-5 w-5 text-white drop-shadow"
                      />
                      <h3 className="text-base sm:text-lg font-black uppercase text-white leading-tight tracking-tight">
                        {cat.name}
                      </h3>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 4. Best Sellers Section ──────── */}
      <section className="py-16 bg-muted/40" id="bestsellers">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <SectionHeading
              eyebrow="[ Most Wanted Drops ]"
              title="Our Bestsellers"
              right={
                <button
                  onClick={() => navigate('shop')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.15em] text-primary hover:underline underline-offset-4"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </button>
              }
            />
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

      {/* ──────── 5. Featured Products Section ──────── */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <SectionHeading
              eyebrow="[ Handpicked For You ]"
              title="Featured Products"
              right={
                <button
                  onClick={() => navigate('shop')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.15em] text-primary hover:underline underline-offset-4"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </button>
              }
            />
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

      {/* ──────── 6. Brand Story Section ──────── */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible className="relative overflow-hidden rounded-2xl border border-border bg-muted p-8 lg:p-14 shadow-sm">
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-primary/10 blur-[130px]" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-block bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full">
                  The Mealicious Philosophy
                </span>
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-[0.95] text-foreground">
                  Khul Ke Khao.
                  <br />
                  <span className="text-primary">Unapologetic Raw Nutrition.</span>
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
                  Break free from stale grocery aisles and hydrogenated oils. Real fitness
                  demands unfiltered energy. We partner directly with elite regional growers
                  to handpick dry fruits, roast in micro-batches, and deliver raw crunch to
                  fuel your lifestyle.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                    <span className="block text-base font-black uppercase text-primary mb-1">
                      0% Palm Oil
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Slow roasted using dry heat and pure mineral sea salt crystals.
                    </p>
                  </div>
                  <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                    <span className="block text-base font-black uppercase text-primary mb-1">
                      Nitro Sealed
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Zero oxidation, multi-layer UV blocking pouches locked at harvest.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-black tracking-wide rounded-full px-8 shadow-lg shadow-primary/25 hover:scale-[1.02]"
                    onClick={() => navigate('shop')}
                  >
                    Explore Clean Crunch
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border shadow-xl">
                  <Image
                    src="/images/products/almonds-premium.png"
                    alt="Mealicious premium handpicked almonds"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-card/95 border border-border backdrop-blur-md p-4 rounded-xl shadow-lg">
                      <p className="text-lg font-black uppercase text-foreground leading-tight">
                        &ldquo;Goodbye Old School Snacking&rdquo;
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-1">
                        #KhulKeKhao Movement
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ──────── 7. New Arrivals Section ──────── */}
      <section className="py-16 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <SectionHeading
              eyebrow="[ Fresh Off The Roast ]"
              title="New Arrivals"
              right={
                <button
                  onClick={() => navigate('shop')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.15em] text-primary hover:underline underline-offset-4"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </button>
              }
            />
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

      {/* ──────── 8. Why Choose Us Section ──────── */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <SectionHeading
              center
              eyebrow="[ Purity Over Compromise ]"
              title="Why Choose Mealicious?"
              subtitle="We take pride in delivering the uncompromising best straight from the soil to your table."
            />
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {whyChooseItems.map((item) => {
              const Icon = item.icon
              return (
                <motion.div key={item.title} variants={staggerChild}>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col space-y-4 hover:border-primary hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-primary pt-2">
                      <span>{item.tag}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 9. Testimonials Section ──────── */}
      <section className="py-16 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible>
            <SectionHeading
              eyebrow="[ Verified Harvest Testimonials ]"
              title="What Our Customers Say"
              subtitle="Real reviews verbatim from real customers nationwide."
              right={
                <span className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                    10,000+ Verified Purchases
                  </span>
                </span>
              }
            />
          </FadeInWhenVisible>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <motion.div key={t.id} variants={staggerChild}>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col space-y-4 hover:border-primary hover:shadow-md transition-all duration-300">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating
                            ? 'fill-primary text-primary'
                            : 'fill-muted text-muted'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-foreground/90 italic leading-relaxed">
                    &ldquo;{t.comment}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-sm">
                      {t.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase tracking-wide text-foreground truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.location} • Verified Buyer
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ──────── 10. Newsletter Section ──────── */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 lg:p-14 shadow-md">
            <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-primary/10 blur-[110px]" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                [ VIP Harvest Access ]
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none text-foreground">
                Join the Mealicious Family
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Subscribe for exclusive offers, fresh seasonal crop alerts, chef recipes, and
                healthy snacking tips. No spam, unsubscribe anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Input
                  type="email"
                  placeholder="Enter your email address..."
                  className="h-12 flex-1 bg-muted border-border rounded-full px-5 text-sm focus-visible:border-primary"
                />
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-black tracking-wide rounded-full px-8 h-12 shrink-0 shadow-lg shadow-primary/25"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Join Now
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                We respect your privacy. Zero third-party sharing.
              </p>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
    </div>
  )
}
