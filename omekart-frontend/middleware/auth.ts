import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes (no auth required)
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback']

// Role-based dashboard paths
const ROLE_DASHBOARD: Record<string, string> = {
  buyer: '/dashboard/buyer',
  seller: '/dashboard/seller',
  customer_care: '/dashboard/support',
  regional_manager: '/dashboard/regional-manager',
  country_manager: '/dashboard/country-manager',
  supreme_admin: '/dashboard/supreme-admin',
}

const ROLE_HIERARCHY = ['supreme_admin', 'country_manager', 'regional_manager', 'customer_care', 'seller', 'buyer']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => path.startsWith(route))) {
    return NextResponse.next()
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {},
        remove(name: string, options: any) {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Fetch user roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)

  const userRoles = roles?.map((r) => r.role) || []

  // If user tries to access root, redirect to appropriate dashboard
  if (path === '/') {
    for (const role of ROLE_HIERARCHY) {
      if (userRoles.includes(role)) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARD[role] || '/dashboard/buyer', request.url))
      }
    }
    return NextResponse.redirect(new URL('/dashboard/buyer', request.url))
  }

  // If user tries to access a route that requires a role they don't have
  // (we'll implement route-level role protection later)
  // For now, just allow all authenticated users to access any dashboard
  // (they'll see menus based on their role)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}