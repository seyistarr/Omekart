import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function callEdgeFunction<T>(
  functionName: string,
  payload?: any
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload || {}),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API call failed')
  }

  return response.json()
}