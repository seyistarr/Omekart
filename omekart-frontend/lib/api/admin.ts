import { createClient } from '@/lib/supabase/client'

export async function adminGetAnalytics() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/admin-get-analytics`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function adminGetUsers(filters?: { role?: string; email?: string; limit?: number; offset?: number }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/admin-get-users`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters || {}),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

export async function adminGetOrders(filters?: { status?: string; vertical?: string; date_from?: string; date_to?: string; limit?: number; offset?: number }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/admin-get-orders`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters || {}),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}