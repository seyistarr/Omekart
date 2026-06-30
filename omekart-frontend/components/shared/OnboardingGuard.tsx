'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')
  const isCallbackRoute = pathname.startsWith('/auth/callback')
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isPublicRoute = isAuthRoute || isCallbackRoute || isOnboardingRoute
  const [loading, setLoading] = useState(!isPublicRoute)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let active = true

    const checkOnboarding = async () => {
      if (isPublicRoute && active) {
        setLoading(false)
        return
      }

      setLoading(true)

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
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (profileError) {
          console.warn('Could not load onboarding profile status:', {
            code: profileError.code,
            message: profileError.message,
          })
        }

        const hasCompletedOnboarding = profile?.onboarding_completed === true

        if (!hasCompletedOnboarding && !isAuthRoute && !isCallbackRoute && !isOnboardingRoute) {
          router.push('/onboarding')
        }

        if (hasCompletedOnboarding && isOnboardingRoute) {
          router.push('/home')
        }
      } catch (error) {
        console.error('Onboarding guard error:', error)
      } finally {
        if (active && !isPublicRoute) {
          setLoading(false)
        }
      }
    }

    checkOnboarding()

    return () => {
      active = false
    }
  }, [isAuthRoute, isCallbackRoute, isOnboardingRoute, isPublicRoute, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
