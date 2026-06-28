import { createClient } from '@/lib/supabase/client'

export async function createCheckout(payload: {
  vertical: string
  buyer_address?: string
  buyer_lat?: number
  buyer_lng?: number
  delivery_method?: 'home_delivery' | 'pickup'
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/create-checkout`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function paystackInit(checkout_session_id: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/paystack-init`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checkout_session_id }),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}