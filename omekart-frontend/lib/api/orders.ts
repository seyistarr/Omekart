import { createClient } from '@/lib/supabase/client'

export async function getBuyerOrders(status?: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/get-buyer-orders`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function getSellerOrders(status?: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/get-seller-orders`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function updateOrderStatus(order_id: string, new_status: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/update-order-status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id, new_status }),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}