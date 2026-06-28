'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AddToCartButton from '@/components/buyer/AddToCartButton'
import { createClient } from '@/lib/supabase/client'

export default function ProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) {
      router.replace('/')
      return
    }

    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('catalog_items')
        .select('*, business:business_id(name)')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Product not found.')
      } else {
        setProduct(data)
      }
      setLoading(false)
    }

    fetchProduct()
  }, [router, searchParams, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading product…</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>{error || 'Unable to load product.'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p>{product.description}</p>
      <p className="text-xl font-semibold">₦{product.price}</p>
      <p className="text-sm text-gray-600">Sold by: {product.business?.name}</p>
      <AddToCartButton catalog_item_id={product.id} />
    </div>
  )
}
