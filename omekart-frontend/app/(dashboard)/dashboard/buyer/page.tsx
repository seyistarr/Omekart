'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

export default function BuyerDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [activeOrders, setActiveOrders] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserAndStats = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // Count total orders
      const { count: total } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', session.user.id)

      setOrderCount(total || 0)

      // Count active orders (not completed, cancelled, refunded)
      const { count: active } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', session.user.id)
        .not('status', 'in', '("completed","cancelled","refunded")')

      setActiveOrders(active || 0)
      setLoading(false)
    }

    getUserAndStats()
  }, [router])

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Welcome back, {user?.email?.split('@')[0] || 'User'}
      </h2>
      <p className="text-gray-500 mt-1">Here's what's happening with your orders.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <p className="text-sm text-gray-500">Active Orders</p>
          <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <p className="text-sm text-gray-500">Wishlist Items</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/shop/explore"
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition"
        >
          Explore Products
        </Link>
        <Link
          href="/shop/orders"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition"
        >
          View All Orders
        </Link>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <div className="mt-3 bg-white rounded-xl shadow-card p-5 text-center text-gray-400 text-sm">
          No recent orders. Start shopping!
        </div>
      </div>
    </div>
  )
}