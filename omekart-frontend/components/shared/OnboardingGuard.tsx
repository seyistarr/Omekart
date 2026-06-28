'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        return
      }

      // Check if user has a default address
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_address')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const hasDefaultAddress = !!profile?.default_address

      // Redirect logic (only on protected pages)
      const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
      const isCallbackRoute = pathname.startsWith('/auth/callback')
      const isOnboardingRoute = pathname.startsWith('/onboarding')

      // If no address and not on auth/callback/onboarding, redirect to onboarding
      if (!hasDefaultAddress && !isAuthRoute && !isCallbackRoute && !isOnboardingRoute) {
        router.push('/onboarding')
      }

      // If has address and on onboarding, redirect to home
      if (hasDefaultAddress && isOnboardingRoute) {
        router.push('/home')
      }

      setLoading(false)
    }

    checkOnboarding()
  }, [pathname, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
