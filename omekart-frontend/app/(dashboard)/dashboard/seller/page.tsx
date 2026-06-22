'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

export default function SellerDashboardPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Get seller's business
      const { data: biz } = await supabase
        .from('businesses')
        .select('id, business_type, name')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (!biz) {
        // If no business, redirect to onboarding (we'll build later)
        router.push('/onboarding')
        return
      }
      setBusiness(biz)

      // Fetch products for this business
      const { data: items } = await supabase
        .from('catalog_items')
        .select('id, name, price, product_type, status, images, created_at')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })

      setProducts(items || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          Your Products ({business?.name})
        </h2>
        <Link
          href="/dashboard/seller/products/new"
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition"
        >
          + Add New
        </Link>
      </div>

      <p className="text-gray-500 text-sm mt-1">
        Vertical: <span className="capitalize font-medium">{business?.business_type}</span>
      </p>

      {products.length === 0 ? (
        <div className="mt-6 text-center py-10 bg-white rounded-xl shadow-card">
          <p className="text-gray-400">No products yet. Click "Add New" to list your first item.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-card p-4 flex gap-4 items-center">
              <img
                src={item.images?.[0] || '/placeholder.png'}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">₦{item.price.toLocaleString()} · {item.product_type}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}