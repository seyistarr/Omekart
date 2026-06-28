'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('catalog_items')
        .select('id, name, price, images, status')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading products:', error)
        setError('Failed to load products. Please try again later.')
      } else {
        setProducts(data ?? [])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading products…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Explore Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.length === 0 && (
          <p className="col-span-full text-gray-500">No products available yet.</p>
        )}
        {products.map((product) => (
          <Link key={product.id} href={`/product?id=${product.id}`}>
            <div className="border rounded p-4 hover:shadow-lg transition cursor-pointer">
              <div className="h-40 bg-gray-100 rounded mb-2 flex items-center justify-center">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.name} className="object-cover h-full w-full" />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </div>
              <h2 className="font-semibold">{product.name}</h2>
              <p className="text-lg font-bold">₦{product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
