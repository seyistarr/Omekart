'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

export default function ShopHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // Fetch products
      const { data } = await supabase
        .from('catalog_items')
        .select('id, name, price, images, product_type')
        .eq('status', 'published')
        .limit(10)

      setProducts(data || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  if (!user || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Hi, {user.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-gray-500 text-sm">What would you like to buy today?</p>
      </div>

      {/* Search */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-xl shadow-card px-4 py-3 flex items-center gap-3">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search products, foods, or services"
            className="flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {/* Products */}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended for You</h2>
        {products.length === 0 ? (
          <div className="text-gray-400 text-sm">No products available</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((item) => (
              <Link
                key={item.id}
                href={`/shop/product/${item.id}`}
                className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-lg transition"
              >
                <img
                  src={item.images?.[0] || '/placeholder.png'}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                  <p className="text-primary font-bold text-sm mt-1">₦{item.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}