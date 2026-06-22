'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

interface CartItem {
  id: string
  cart_id: string
  catalog_item_id: string
  quantity: number
  unit_price: number
  currency: string
  created_at: string
  catalog_items?: {
    id: string
    name: string
    price: number
    images: string[]
    product_type: 'product' | 'food' | 'service'
    business_id: string
  }
}

interface Cart {
  id: string
  buyer_id: string
  vertical: string
  items: CartItem[]
  total_items: number
  subtotal: number
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        // Get the user's cart (assuming they only have one cart per vertical, but we'll get all)
        // For MVP, we'll get the first cart with items
        const { data: carts, error: cartsError } = await supabase
          .from('carts')
          .select(`
            id,
            buyer_id,
            vertical,
            items:cart_items (
              id,
              cart_id,
              catalog_item_id,
              quantity,
              unit_price,
              currency,
              created_at
            )
          `)
          .eq('buyer_id', session.user.id)
          .maybeSingle()

        if (cartsError) throw cartsError

        if (!carts) {
          setCart(null)
          setLoading(false)
          return
        }

        // Fetch catalog item details for each cart item
        const itemsWithDetails = await Promise.all(
          (carts.items || []).map(async (item: CartItem) => {
            const { data: catalogItem } = await supabase
              .from('catalog_items')
              .select('id, name, price, images, product_type, business_id')
              .eq('id', item.catalog_item_id)
              .single()

            return {
              ...item,
              catalog_items: catalogItem || undefined,
            }
          })
        )

        const totalItems = itemsWithDetails.reduce((sum, i) => sum + i.quantity, 0)
        const subtotal = itemsWithDetails.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

        setCart({
          ...carts,
          items: itemsWithDetails,
          total_items: totalItems,
          subtotal: subtotal,
        })
      } catch (err) {
        console.error('Error fetching cart:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [router])

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdating(itemId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/add-to-cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            catalog_item_id: cart?.items.find(i => i.id === itemId)?.catalog_item_id,
            quantity: newQuantity,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update cart')
      }

      // Refresh cart
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession) {
        const { data: updatedCart } = await supabase
          .from('carts')
          .select(`
            id,
            buyer_id,
            vertical,
            items:cart_items (
              id,
              cart_id,
              catalog_item_id,
              quantity,
              unit_price,
              currency,
              created_at
            )
          `)
          .eq('buyer_id', newSession.user.id)
          .maybeSingle()

        if (updatedCart) {
          const itemsWithDetails = await Promise.all(
            (updatedCart.items || []).map(async (item: CartItem) => {
              const { data: catalogItem } = await supabase
                .from('catalog_items')
                .select('id, name, price, images, product_type, business_id')
                .eq('id', item.catalog_item_id)
                .single()
              return {
                ...item,
                catalog_items: catalogItem || undefined,
              }
            })
          )

          const totalItems = itemsWithDetails.reduce((sum, i) => sum + i.quantity, 0)
          const subtotal = itemsWithDetails.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

          setCart({
            ...updatedCart,
            items: itemsWithDetails,
            total_items: totalItems,
            subtotal: subtotal,
          })
        }
      }
    } catch (err) {
      console.error('Error updating cart:', err)
      alert('Could not update cart. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return

    setUpdating(itemId)
    try {
      // For removal, we set quantity to 0 (the Edge Function will handle it)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const item = cart?.items.find(i => i.id === itemId)
      if (!item) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/add-to-cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            catalog_item_id: item.catalog_item_id,
            quantity: -item.quantity, // Negative quantity removes the item
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove item')
      }

      // Refresh cart (same as update)
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession) {
        const { data: updatedCart } = await supabase
          .from('carts')
          .select(`
            id,
            buyer_id,
            vertical,
            items:cart_items (
              id,
              cart_id,
              catalog_item_id,
              quantity,
              unit_price,
              currency,
              created_at
            )
          `)
          .eq('buyer_id', newSession.user.id)
          .maybeSingle()

        if (updatedCart) {
          const itemsWithDetails = await Promise.all(
            (updatedCart.items || []).map(async (item: CartItem) => {
              const { data: catalogItem } = await supabase
                .from('catalog_items')
                .select('id, name, price, images, product_type, business_id')
                .eq('id', item.catalog_item_id)
                .single()
              return {
                ...item,
                catalog_items: catalogItem || undefined,
              }
            })
          )

          const totalItems = itemsWithDetails.reduce((sum, i) => sum + i.quantity, 0)
          const subtotal = itemsWithDetails.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

          setCart({
            ...updatedCart,
            items: itemsWithDetails,
            total_items: totalItems,
            subtotal: subtotal,
          })
        }
      }
    } catch (err) {
      console.error('Error removing item:', err)
      alert('Could not remove item. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  const deliveryFee = 1500 // Placeholder – will be dynamic later
  const total = (cart?.subtotal || 0) + deliveryFee

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Your Cart</h1>
        {cart && cart.items.length > 0 && (
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {cart.total_items} items
          </span>
        )}
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
          <p className="text-gray-500 mt-1.5 text-sm">Looks like you haven't added anything yet.</p>
          <Link
            href="/shop/home"
            className="mt-6 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="px-5 pt-4 space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-card overflow-hidden flex gap-4 p-4"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={item.catalog_items?.images?.[0] || '/placeholder.png'}
                    alt={item.catalog_items?.name || 'Item'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                      {item.catalog_items?.name || 'Unknown Item'}
                    </h3>
                    <p className="text-primary font-bold text-base mt-1">
                      ₦{item.unit_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 active:scale-95 transition"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-50 active:scale-95 transition"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={updating === item.id}
                      className="text-red-400 hover:text-red-600 text-xs font-medium transition disabled:opacity-50"
                    >
                      {updating === item.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="px-5 mt-6">
            <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
              <h4 className="font-semibold text-gray-800 text-sm">Order Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₦{cart.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-medium">₦{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="fixed bottom-20 left-0 right-0 px-5 py-3 bg-white border-t border-gray-100">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}