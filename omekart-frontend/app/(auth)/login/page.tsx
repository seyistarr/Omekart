'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { IconMail, IconLock, IconArrowRight, IconAlert } from '@/components/icons'
import { AuthIllustration } from '@/components/illustrations'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)

    const userRoles = roles?.map((r) => r.role) || []

    const hierarchy = ['supreme_admin', 'country_manager', 'regional_manager', 'customer_care', 'seller', 'buyer']
    let dashboardPath = '/dashboard/buyer'

    for (const role of hierarchy) {
      if (userRoles.includes(role)) {
        const roleMap: Record<string, string> = {
          buyer: '/dashboard/buyer',
          seller: '/dashboard/seller',
          customer_care: '/dashboard/support',
          regional_manager: '/dashboard/regional-manager',
          country_manager: '/dashboard/country-manager',
          supreme_admin: '/dashboard/supreme-admin',
        }
        dashboardPath = roleMap[role] || '/dashboard/buyer'
        break
      }
    }

    router.push(dashboardPath)
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-surface">
      {/* Brand / illustration panel */}
      <div className="hidden md:flex relative flex-col justify-between bg-mesh bg-dot-grid p-10 overflow-hidden">
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1 ring-white/30 shadow-card">
            <Image src="/images/Omekart.jpg" alt="Omekart" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-xl font-bold text-white">Omekart</span>
        </Link>

        <div className="relative z-10 flex items-center justify-center flex-1">
          <AuthIllustration className="w-full max-w-sm" />
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="font-display text-2xl font-bold text-white leading-snug">
            One marketplace for everything campus life needs.
          </h2>
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">Products</span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">Food</span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">Services</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 bg-bg md:bg-surface">
        <div className="w-full max-w-sm mx-auto animate-fade-up">
          <Link href="/" className="flex md:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-card ring-1 ring-black/5">
              <Image src="/images/Omekart.jpg" alt="Omekart" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-xl font-bold text-ink">Omekart</span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-ink-soft text-sm mt-1.5">Sign in to keep up with your orders and store.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="relative">
              <IconMail className="w-5 h-5 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-12 pr-4 py-3.5 bg-bg md:bg-surface border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-ink placeholder:text-ink-soft"
                required
              />
            </div>

            <div className="relative">
              <IconLock className="w-5 h-5 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3.5 bg-bg md:bg-surface border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-ink placeholder:text-ink-soft"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <IconAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl shadow-glow-primary hover:bg-primary-dark active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <IconArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-soft mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}