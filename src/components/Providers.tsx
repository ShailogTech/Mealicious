'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { useAppStore } from '@/lib/store'
import { useCatalogStore } from '@/lib/catalog-store'

function PublicDataBridge() {
  const loadPublicProducts = useCatalogStore((s) => s.loadPublicProducts)
  useEffect(() => {
    loadPublicProducts()
  }, [loadPublicProducts])
  return null
}

function AuthBridge() {
  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) return
    let syncedFromFirebase = false
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser || !fbUser.email) {
        // Only wipe store if this session previously synced a Firebase user
        // (i.e. an explicit Firebase sign-out happened). Otherwise leave
        // persisted stub/admin login alone — null on refresh is normal until
        // Firebase rehydrates.
        if (syncedFromFirebase) {
          syncedFromFirebase = false
          useAppStore.setState({ isLoggedIn: false, user: null })
        }
        return
      }
      syncedFromFirebase = true
      const email = fbUser.email
      const isAdmin = email.toLowerCase() === 'admin@mealicious.com'
      const state = useAppStore.getState()
      const alreadyThisUser = state.isLoggedIn && state.user?.email === email
      useAppStore.setState({
        isLoggedIn: true,
        user: {
          name: fbUser.displayName ?? email.split('@')[0],
          email,
          phone: fbUser.phoneNumber ?? '',
          role: isAdmin ? 'admin' : 'user',
        },
        // Only redirect on fresh sign-in, not on every rehydrate
        ...(alreadyThisUser ? {} : { currentPage: isAdmin ? 'admin' : 'home' }),
      })
    })
    return () => unsub()
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PublicDataBridge />
      <AuthBridge />
      {children}
    </ThemeProvider>
  )
}
