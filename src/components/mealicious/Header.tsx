'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type Page } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  User,
  Menu,
  X,
  Leaf,
  ChevronRight,
  LogOut,
  UserCircle,
  Shield,
} from 'lucide-react'

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Shop', page: 'shop' },
  { label: 'About', page: 'about' },
  { label: 'Contact', page: 'contact' },
  { label: 'Blog', page: 'blog' },
  { label: 'FAQ', page: 'faq' },
]

export default function Header() {
  const {
    currentPage,
    navigate,
    cartItems,
    setCartOpen,
    wishlistItems,
    isLoggedIn,
    user,
    logout,
    searchQuery,
    setSearchQuery,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useAppStore()

  function openAdminPanel() {
    window.location.href = '/admin/dashboard'
  }

  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Track scroll position for sticky header style change
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync local search state with store
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setLocalSearch(searchQuery)
    })
    return () => cancelAnimationFrame(handle)
  }, [searchQuery])

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlistItems.length

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSearchQuery(localSearch)
      if (localSearch.trim()) {
        navigate('shop')
      }
      setSearchOpen(false)
    },
    [localSearch, setSearchQuery, navigate]
  )

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false)
    setLocalSearch('')
    setSearchQuery('')
  }, [setSearchQuery])

  const handleNavClick = useCallback(
    (page: Page) => {
      navigate(page)
    },
    [navigate]
  )

  const isActivePage = useCallback(
    (page: Page) => currentPage === page,
    [currentPage]
  )

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-stone-900 text-white text-xs py-2 px-4 text-center font-medium select-none tracking-wide">
        🎉 Free shipping on orders above ₹499! | Get 10% EXTRA discount on all Prepaid Orders!
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100'
            : 'bg-white backdrop-blur-sm border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 text-gray-700 hover:text-orange-400 hover:bg-blue-50"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  {/* Mobile Menu Header */}
                  <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100 bg-blue-50">
                    <Leaf className="h-6 w-6 text-orange-400" />
                    <span className="text-xl font-bold text-orange-400 tracking-tight">
                      MEALICIOUS
                    </span>
                  </div>

                  {/* Mobile Nav Links */}
                  <nav className="flex flex-col py-4" role="navigation" aria-label="Mobile navigation">
                    {NAV_LINKS.map((link) => (
                      <button
                        key={link.page}
                        onClick={() => handleNavClick(link.page)}
                        className={`flex items-center justify-between px-6 py-3.5 text-sm font-medium transition-colors ${
                          isActivePage(link.page)
                            ? 'text-orange-400 bg-blue-50 border-r-3 border-orange-400'
                            : 'text-gray-700 hover:text-orange-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </button>
                    ))}
                  </nav>

                  {/* Mobile Menu Footer */}
                  <div className="border-t border-gray-100 px-6 py-4 space-y-3 mt-auto">
                    {isLoggedIn && user ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 py-2">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleNavClick('profile')}
                          className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:text-orange-400 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          My Profile
                        </button>
                        {user.role === 'admin' && (
                          <button
                            onClick={openAdminPanel}
                            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                          >
                            Admin Panel
                          </button>
                        )}
                        <button
                          onClick={() => handleNavClick('wishlist')}
                          className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:text-orange-400 hover:bg-blue-50 rounded-md transition-colors flex items-center justify-between"
                        >
                          <span>Wishlist</span>
                          {wishlistCount > 0 && (
                            <Badge className="bg-orange-400 text-white text-[10px] h-5 min-w-[20px] px-1.5">
                              {wishlistCount}
                            </Badge>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            logout()
                            setMobileMenuOpen(false)
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleNavClick('login')}
                          className="w-full bg-orange-400 hover:bg-orange-400 text-white"
                        >
                          Sign In
                        </Button>
                        <Button
                          onClick={() => handleNavClick('register')}
                          variant="outline"
                          className="w-full border-orange-400 text-orange-400 hover:bg-blue-50"
                        >
                          Create Account
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-1.5 group shrink-0"
              aria-label="Go to homepage"
            >
              <div className="relative">
                <Leaf className="h-7 w-7 text-orange-400 group-hover:text-orange-400 transition-colors" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-orange-400 transition-colors">
                  MEALICIOUS
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium text-orange-400 tracking-[0.15em] uppercase">
                  Store
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-8" role="navigation" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.page}
                  onClick={() => handleNavClick(link.page)}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                    isActivePage(link.page)
                      ? 'text-orange-400 bg-blue-50'
                      : 'text-gray-600 hover:text-orange-400 hover:bg-blue-50/50'
                  }`}
                >
                  {link.label}
                  {isActivePage(link.page) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-orange-400 rounded-full" />
                  )}
                </button>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {/* Search Toggle */}
              <div className="relative">
                {searchOpen ? (
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center gap-2 animate-in slide-in-from-right-5 duration-200"
                  >
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-40 sm:w-56 h-9 pl-8 pr-3 text-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
                        autoFocus
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-500 hover:text-gray-700 shrink-0"
                      onClick={handleSearchClose}
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:text-orange-400 hover:bg-blue-50 h-9 w-9 sm:h-10 sm:w-10"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Open search"
                  >
                    <Search className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                  </Button>
                )}
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:text-orange-400 hover:bg-blue-50 h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => handleNavClick('notifications')}
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              </Button>

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:text-orange-400 hover:bg-blue-50 h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => handleNavClick('wishlist')}
                aria-label="Wishlist"
              >
                <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 bg-orange-400 text-white text-[10px] h-4 min-w-[16px] px-1 flex items-center justify-center border-0">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:text-orange-400 hover:bg-blue-50 h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setCartOpen(true)}
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 bg-orange-400 text-white text-[10px] h-4 min-w-[16px] px-1 flex items-center justify-center border-0">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {/* User / Account */}
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative text-gray-600 hover:text-orange-400 hover:bg-blue-50 h-9 w-9 sm:h-10 sm:w-10"
                      aria-label="Account menu"
                    >
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-semibold text-orange-400">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleNavClick('profile')}
                      className="cursor-pointer"
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <DropdownMenuItem
                        onClick={openAdminPanel}
                        className="cursor-pointer font-semibold text-orange-500 focus:text-orange-500"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleNavClick('wishlist')}
                      className="cursor-pointer"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                      {wishlistCount > 0 && (
                        <Badge className="ml-auto bg-orange-400 text-white text-[10px] h-5 min-w-[20px] px-1.5 border-0">
                          {wishlistCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:text-orange-400 hover:bg-blue-50 h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => handleNavClick('login')}
                  aria-label="Sign in"
                >
                  <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
