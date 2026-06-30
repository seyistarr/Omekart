'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        Processing your sign-in...
      </div>
    </div>
  )
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const reference = searchParams.get('reference')
      const order_id = searchParams.get('order_id')
      const supabase = createClient()

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Supabase auth callback failed:', error)
            router.replace('/home')
            return
          }
          router.replace('/home')
          return
        }

        if (reference && order_id) {
          const { data: order, error } = await supabase
            .from('orders')
            .select('payment_status')
            .eq('id', order_id)
            .single()

          if (error) {
            console.error('Payment callback lookup failed:', error)
            router.replace('/checkout?status=error')
            return
          }

          if (order?.payment_status === 'paid') {
            router.replace('/orders')
          } else {
            router.replace('/checkout?status=pending')
          }
          return
        }

        router.replace('/home')
      } catch (err) {
        console.error('Callback processing failed:', err)
        router.replace('/home')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return <CallbackLoading />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
