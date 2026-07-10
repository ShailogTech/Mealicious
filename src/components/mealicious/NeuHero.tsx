'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Leaf, Sparkles, Star, Search, Bell, User, ShoppingBag, LayoutGrid, CheckSquare, MessageSquare } from 'lucide-react'

interface NeuHeroProps {
  title?: string
  subtitle?: string
  onShop?: () => void
}

export default function NeuHero({
  title = 'Premium dry fruits & healthy snacks',
  subtitle = "Experience nature's premium harvest — clean, nutrient-dense snacking sourced from elite farms and delivered fresh to your door.",
  onShop,
}: NeuHeroProps) {
  return (
    <section className="hero-orange-theme overflow-hidden bg-[#fffdf6] border-b-2 border-stone-950">
      {/* Hero container */}
      <div className="relative flex flex-col items-center justify-center px-12 pb-48 pt-20 md:pt-28 max-w-7xl mx-auto">
        
        {/* Tilting Badge Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 rounded-full bg-stone-950 p-0.5"
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onShop) onShop();
            }}
            className="flex origin-top-left items-center rounded-full border border-stone-950 bg-[#fffcf0] px-3.5 py-1 text-xs md:text-sm font-semibold text-stone-950 transition-transform hover:-rotate-2 duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span className="rounded-full bg-orange-500 border border-stone-950 px-2 py-0.5 font-bold text-white flex items-center gap-1 mr-2 text-[10px]">
              <Sparkles className="h-3 w-3" /> NEW!
            </span>
            <span>Free Shipping on Orders above ₹499! Shop Now</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </motion.div>

        {/* Heading - Bold Sans-Serif font-black */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl text-center text-4xl font-black leading-[1.15] text-stone-950 md:text-6xl md:leading-[1.15] font-sans tracking-tight"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto my-4 max-w-3xl text-center text-stone-600 text-base md:text-xl leading-relaxed font-sans font-medium"
        >
          {subtitle}
        </motion.p>

        {/* Neubrutalist Call to Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={onShop}
            className="group relative rounded-lg border-2 border-stone-950 bg-[#fffcf0] hover:bg-orange-500 hover:text-white px-7 py-3.5 font-bold uppercase tracking-wider text-orange-600 shadow-[4px_4px_0px_0px_rgba(12,10,9,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(12,10,9,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <span className="flex items-center gap-2">
              Shop Fresh Collection
              <ShoppingBag className="h-5 w-5 transition-transform group-hover:scale-110 text-orange-600 group-hover:text-white" />
            </span>
          </button>
        </motion.div>

        {/* Neubrutalist Mock Browser Mockup Card */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-0 left-1/2 h-36 w-[calc(100vw_-_56px)] max-w-[1100px] -translate-x-1/2 overflow-hidden rounded-t-xl bg-stone-900 p-0.5 border-t-2 border-x-2 border-stone-950"
        >
          {/* Browser Header Bar */}
          <div className="flex items-center justify-between px-2.5 py-1">
            {/* Window controls */}
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400"></span>
              <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
            </div>
            
            {/* URL input bar */}
            <span className="rounded bg-stone-700 px-3 py-0.5 text-[10px] text-stone-200 font-mono">
              mealicious.store
            </span>

            {/* Address dropdown arrow */}
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Browser main content (Neubrutalist Grid) */}
          <div className="relative z-0 grid h-full w-full grid-cols-[100px,_1fr] overflow-hidden rounded-t-lg bg-white border border-stone-950 md:grid-cols-[150px,_1fr]">
            
            {/* Left Sidebar */}
            <div className="h-full border-r border-stone-300 p-2 select-none">
              {/* Logo icon */}
              <svg width="24" height="auto" viewBox="0 0 50 39" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-fit fill-zinc-950">
                <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" fill="#f97316"></path>
                <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" fill="#f59e0b"></path>
              </svg>
              
              {/* Navigation Items */}
              <div className="mt-3 space-y-1">
                <span className="flex items-center gap-1.5 text-[9px] md:text-[11px] text-orange-600 font-bold">
                  <MessageSquare className="h-2.5 w-2.5 text-orange-600" />
                  <span>Messages</span>
                </span>
                <span className="flex items-center gap-1.5 text-[9px] md:text-[11px] text-stone-400 font-semibold">
                  <CheckSquare className="h-2.5 w-2.5" />
                  <span>Tasks</span>
                </span>
                <span className="flex items-center gap-1.5 text-[9px] md:text-[11px] text-stone-400 font-semibold">
                  <LayoutGrid className="h-2.5 w-2.5" />
                  <span>Board</span>
                </span>
              </div>
            </div>

            {/* Main view content (Fixed layout overflow with flex-col) */}
            <div className="relative z-0 p-2 flex flex-col h-full pb-8">
              <div className="mb-2 flex items-center justify-between shrink-0">
                <span className="rounded bg-stone-100 px-2 py-0.5 pr-8 text-[9px] text-stone-400 border border-stone-200">Search...</span>
                <div className="flex items-center gap-1.5 text-stone-400">
                  <Bell className="h-3 w-3" />
                  <User className="h-3 w-3" />
                </div>
              </div>
              
              {/* Dashed placeholder container */}
              <div className="flex-1 rounded-lg border border-dashed border-stone-300 bg-stone-50"></div>
            </div>

            {/* Gradient Overlay for bottom transition fade */}
            <div className="absolute bottom-0 left-0 right-0 top-0 z-10 bg-gradient-to-b from-white/0 to-white/95 pointer-events-none"></div>
          </div>
        </motion.div>
      </div>

      {/* Slanted Marquee of product selling points - Framer Motion Smooth Animation */}
      <div className="relative -mt-2 -rotate-1 scale-[1.01] border-y-2 border-stone-950 bg-orange-500 py-3 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)] select-none">
        <div className="flex overflow-hidden">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-50%" }}
            transition={{ ease: "linear", duration: 25, repeat: Infinity }}
            className="flex whitespace-nowrap gap-12 shrink-0 pr-12 text-white font-mono font-black uppercase text-xs md:text-sm tracking-widest items-center"
          >
            <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 fill-white text-orange-500" /> 100% Organic & Farm Fresh</span>
            <span>★</span>
            <span>No Added Preservatives</span>
            <span>★</span>
            <span>Vacuum-Sealed Freshness</span>
            <span>★</span>
            <span>Free Express Shipping</span>
            <span>★</span>
            <span>Handpicked Elite Quality</span>
            <span>★</span>

            {/* Seamless duplicate loop */}
            <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 fill-white text-orange-500" /> 100% Organic & Farm Fresh</span>
            <span>★</span>
            <span>No Added Preservatives</span>
            <span>★</span>
            <span>Vacuum-Sealed Freshness</span>
            <span>★</span>
            <span>Free Express Shipping</span>
            <span>★</span>
            <span>Handpicked Elite Quality</span>
            <span>★</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
