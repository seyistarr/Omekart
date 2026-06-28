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
    let active = true

    const checkOnboarding = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Error checking Supabase session:', sessionError)
          return
        }

        if (!session) {
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('default_address')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error loading profile:', profileError)
        }

        const hasDefaultAddress = !!profile?.default_address

        const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
        const isCallbackRoute = pathname.startsWith('/auth/callback')
        const isOnboardingRoute = pathname.startsWith('/onboarding')

        if (!hasDefaultAddress && !isAuthRoute && !isCallbackRoute && !isOnboardingRoute) {
          router.push('/onboarding')
        }

        if (hasDefaultAddress && isOnboardingRoute) {
          router.push('/home')
        }
      } catch (error) {
        console.error('Onboarding guard error:', error)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    checkOnboarding()

    return () => {
      active = false
    }
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
