import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Define route types
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/signup')
  const isCallbackRoute = request.nextUrl.pathname.startsWith('/auth/callback')
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  const isProtected = !isAuthRoute && !isCallbackRoute && !isOnboardingRoute

  // If not authenticated and trying to access protected route → redirect to login
  if (!session && isProtected) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and trying to access login/signup → redirect to home
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // ---- ONBOARDING ENFORCEMENT ----
  if (session) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const hasCompletedOnboarding = profile?.onboarding_completed === true

    // If not on onboarding or callback, and onboarding is incomplete → redirect
    if (!isOnboardingRoute && !isCallbackRoute && !isAuthRoute && !hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // If on onboarding route and already completed → redirect to home
    if (isOnboardingRoute && hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)']
}