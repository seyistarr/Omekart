import { createClient } from '@/lib/supabase/client'

export async function addToCart({
  catalog_item_id,
  quantity = 1,
}: {
  catalog_item_id: string
  quantity?: number
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/add-to-cart`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ catalog_item_id, quantity }),
    }
  )
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}