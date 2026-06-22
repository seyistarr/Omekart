'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { IconPhone, IconCrosshair, IconAlert, IconPackage, IconFood, IconService } from '@/components/icons'
import { BuyerAvatar, SellerAvatar } from '@/components/illustrations'

const supabase = createClient()

type Role = 'buyer' | 'seller' | 'customer_care' | 'regional_manager' | 'country_manager' | 'supreme_admin'

// Presentational metadata only — does not affect businessType state or submit logic
const businessTypeMeta = {
  products: {
    label: 'Products',
    helper: 'Gadgets, fashion, supplies',
    icon: IconPackage,
    activeClasses: 'border-primary bg-primary/5',
    iconClasses: 'bg-primary/10 text-primary',
  },
  food: {
    label: 'Food',
    helper: 'Meals, snacks, drinks',
    icon: IconFood,
    activeClasses: 'border-food bg-food-light',
    iconClasses: 'bg-food-light text-food',
  },
  services: {
    label: 'Services',
    helper: 'Repairs, tutoring, errands',
    icon: IconService,
    activeClasses: 'border-service bg-service-light',
    iconClasses: 'bg-service-light text-service',
  },
} as const

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userRoles, setUserRoles] = useState<Role[]>([])
  const [primaryRole, setPrimaryRole] = useState<Role>('buyer')

  // Buyer fields
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Seller fields
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<'products' | 'food' | 'services'>('products')
  const [deliveryFee, setDeliveryFee] = useState(1500)
  const [deliveryRadius, setDeliveryRadius] = useState(10)

  useEffect(() => {
    const fetchUserAndRoles = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Check if onboarding already completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .single()

      if (profile?.onboarding_completed) {
        router.push('/dashboard/buyer')
        return
      }

      // Fetch user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)

      const roleNames = (roles || []).map((r) => r.role) as Role[]
      setUserRoles(roleNames)

      // Determine primary role (highest in hierarchy)
      const hierarchy: Role[] = ['supreme_admin', 'country_manager', 'regional_manager', 'customer_care', 'seller', 'buyer']
      let primary: Role = 'buyer'
      for (const role of hierarchy) {
        if (roleNames.includes(role)) {
          primary = role
          break
        }
      }
      setPrimaryRole(primary)

      // If user is admin role, they don't need onboarding
      if (['supreme_admin', 'country_manager', 'regional_manager', 'customer_care'].includes(primary)) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('user_id', session.user.id)

        const roleMap: Record<string, string> = {
          buyer: '/dashboard/buyer',
          seller: '/dashboard/seller',
          customer_care: '/dashboard/support',
          regional_manager: '/dashboard/regional-manager',
          country_manager: '/dashboard/country-manager',
          supreme_admin: '/dashboard/supreme-admin',
        }
        router.push(roleMap[primary] || '/dashboard/buyer')
        return
      }

      setLoading(false)
    }

    fetchUserAndRoles()
  }, [router])

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!displayName.trim()) {
      setError('Display name is required.')
      setSubmitting(false)
      return
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          phone: phone.trim() || null,
          onboarding_completed: true,
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      if (location) {
        await supabase.from('user_locations').insert({
          user_id: user.id,
          label: 'Home',
          latitude: location.lat,
          longitude: location.lng,
          address_text: address,
          is_default: true,
        })
      }

      router.push('/dashboard/buyer')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setSubmitting(false)
    }
  }

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!businessName.trim()) {
      setError('Business name is required.')
      setSubmitting(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/register-business`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            business_type: businessType,
            name: businessName.trim(),
            delivery_config: {
              fee_type: 'fixed',
              base_fee: deliveryFee,
              radius_km: deliveryRadius,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to register business')
      }

      await response.json()

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id)

      router.push('/dashboard/seller')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setSubmitting(false)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setAddress(`${position.coords.latitude}, ${position.coords.longitude}`)
      },
      () => {
        alert('Unable to get location. Please enter your address manually.')
      }
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-card mx-auto mb-5">
            <Image src="/images/Omekart.jpg" alt="Omekart" width={48} height={48} className="w-full h-full object-cover" />
          </div>
          <div className="w-9 h-9 border-[3px] border-primary-light border-t-primary rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-ink-soft text-sm">Setting things up…</p>
        </div>
      </div>
    )
  }

  // Buyer Onboarding
  if (primaryRole === 'buyer') {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="bg-mesh bg-dot-grid px-6 pt-8 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1 ring-white/30 shadow-card">
              <Image src="/images/Omekart.jpg" alt="Omekart" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-lg font-bold text-white">Omekart</span>
          </div>

          <div className="relative z-10 flex items-center gap-4 mt-6">
            <BuyerAvatar className="w-20 h-20 shrink-0 animate-float" />
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Welcome aboard</h1>
              <p className="text-white/80 text-sm mt-1">Let&apos;s set up your buyer profile.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-7 pb-10 -mt-4">
          <form onSubmit={handleBuyerSubmit} className="space-y-5 bg-surface rounded-3xl shadow-card p-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-4 py-3 border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-ink placeholder:text-ink-soft"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Phone number <span className="text-ink-soft text-xs font-normal">(optional)</span>
              </label>
              <div className="relative">
                <IconPhone className="w-5 h-5 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 80 1234 5678"
                  className="w-full pl-12 pr-4 py-3 border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-ink placeholder:text-ink-soft"
                />
              </div>
              <p className="text-xs text-ink-soft mt-1.5">We won&apos;t send SMS — just for seller payouts.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Your location</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary-dark transition"
                >
                  <IconCrosshair className="w-4 h-4" />
                  Use my location
                </button>
                <span className="text-sm text-ink-soft">or enter manually</span>
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Allen Avenue, Ikeja, Lagos"
                className="w-full px-4 py-3 border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none mt-3 text-ink placeholder:text-ink-soft"
              />
              <p className="text-xs text-ink-soft mt-1.5">
                Used to calculate delivery fees. You can change this later.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <IconAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl shadow-glow-primary hover:bg-primary-dark active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Saving…' : 'Complete setup'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Seller Onboarding
  if (primaryRole === 'seller') {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="bg-mesh bg-dot-grid px-6 pt-8 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1 ring-white/30 shadow-card">
              <Image src="/images/Omekart.jpg" alt="Omekart" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-lg font-bold text-white">Omekart</span>
          </div>

          <div className="relative z-10 flex items-center gap-4 mt-6">
            <SellerAvatar className="w-20 h-20 shrink-0 animate-float" />
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Set up your store</h1>
              <p className="text-white/80 text-sm mt-1">Choose your vertical and register your business.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-7 pb-10 -mt-4">
          <form onSubmit={handleSellerSubmit} className="space-y-5 bg-surface rounded-3xl shadow-card p-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Business name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Jane's Store"
                className="w-full px-4 py-3 border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-ink placeholder:text-ink-soft"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Business type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(businessTypeMeta) as Array<keyof typeof businessTypeMeta>).map((type) => {
                  const meta = businessTypeMeta[type]
                  const Icon = meta.icon
                  const isActive = businessType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBusinessType(type)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition ${
                        isActive ? meta.activeClasses : 'border-hairline hover:border-ink-soft/30'
                      }`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? meta.iconClasses : 'bg-bg text-ink-soft'}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className={`text-sm font-semibold ${isActive ? 'text-ink' : 'text-ink-soft'}`}>{meta.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-ink-soft mt-2">{businessTypeMeta[businessType].helper} — this can&apos;t be changed after registration.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Delivery fee (₦)</label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Delivery radius (km)</label>
                <input
                  type="number"
                  value={deliveryRadius}
                  onChange={(e) => setDeliveryRadius(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-hairline rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-ink"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <IconAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl shadow-glow-primary hover:bg-primary-dark active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Registering…' : 'Register business'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-9 h-9 border-[3px] border-primary-light border-t-primary rounded-full animate-spin" />
    </div>
  )
}