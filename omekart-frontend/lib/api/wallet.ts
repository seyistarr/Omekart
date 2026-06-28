import { createClient } from '@/lib/supabase/client'

export async function getSellerWallet() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/get-seller-wallet`,
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