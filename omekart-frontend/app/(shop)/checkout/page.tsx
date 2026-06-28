'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { createCheckout, paystackInit } from '@/lib/api/checkout'

export default function CheckoutPage() {
  const { items, totalPrice } = useCartStore()
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  // Determine vertical from first item (or pass as prop)
  const vertical = 'products' // you can make this dynamic later

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const checkout = await createCheckout({
        vertical,
        buyer_address: address,
        delivery_method: 'home_delivery',
      })
      const payment = await paystackInit(checkout.checkout.id)
      window.location.href = payment.authorization_url
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return <div className="p-4">Your cart is empty</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <div className="mb-4">
        <p>Total items: {items.reduce((s, i) => s + i.quantity, 0)}</p>
        <p className="text-xl">Total: ₦{totalPrice}</p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Delivery Address</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Enter your address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <button
        onClick={handleCheckout}
        disabled={loading || !address}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  )
}