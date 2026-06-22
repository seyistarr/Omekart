'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  product_type: 'product' | 'food' | 'service'
  business_id: string
  stock_quantity: number
  status: string
  prep_time_minutes?: number
  duration_minutes?: number
  buffer_before?: number
  buffer_after?: number
  weight_kg?: number
  dimensions?: string
  business?: {
    name: string
    business_type: string
  }
  category?: {
    name: string
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  const productId = params.id as string

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetch product with business info
        const { data, error } = await supabase
          .from('catalog_items')
          .select(`
            *,
            business:business_id (
              id,
              name,
              business_type
            )
          `)
          .eq('id', productId)
          .single()

        if (error) throw error

        // Fetch category name from taxonomy_nodes
        if (data.node_id) {
          const { data: category } = await supabase
            .from('taxonomy_nodes')
            .select('name')
            .eq('id', data.node_id)
            .single()

          data.category = category
        }

        setProduct(data)
      } catch (err: any) {
        console.error('Error fetching product:', err)
        setError(err.message || 'Product not found')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleAddToCart = async () => {
    if (!product) return

    setAddingToCart(true)
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
            catalog_item_id: product.id,
            quantity: quantity,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add to cart')
      }

      const result = await response.json()
      if (result.success) {
        alert('Added to cart! 🎉')
      } else {
        throw new Error(result.error || 'Failed to add to cart')
      }
    } catch (err: any) {
      console.error('Error adding to cart:', err)
      alert('Could not add to cart. Please try again.')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
          <p className="text-gray-500 mt-2">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            href="/shop/home"
            className="mt-4 inline-block bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dark transition"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  const verticalColor =
    product.product_type === 'product'
      ? 'bg-primary'
      : product.product_type === 'food'
      ? 'bg-food'
      : 'bg-service'

  const verticalLabel =
    product.product_type === 'product'
      ? 'Product'
      : product.product_type === 'food'
      ? 'Food'
      : 'Service'

  const renderVerticalDetails = () => {
    if (product.product_type === 'food' && product.prep_time_minutes) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">⏱ Preparation Time:</span>
          <span>{product.prep_time_minutes} minutes</span>
        </div>
      )
    }

    if (product.product_type === 'service') {
      return (
        <>
          {product.duration_minutes && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">⏱ Duration:</span>
              <span>{product.duration_minutes} minutes</span>
            </div>
          )}
          {product.buffer_before !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">⏳ Buffer Before:</span>
              <span>{product.buffer_before} minutes</span>
            </div>
          )}
          {product.buffer_after !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">⏳ Buffer After:</span>
              <span>{product.buffer_after} minutes</span>
            </div>
          )}
        </>
      )
    }

    if (product.product_type === 'product') {
      return (
        <>
          {product.weight_kg && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">⚖️ Weight:</span>
              <span>{product.weight_kg} kg</span>
            </div>
          )}
          {product.dimensions && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">📐 Dimensions:</span>
              <span>{product.dimensions}</span>
            </div>
          )}
        </>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-3 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Product Details</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Images */}
        <div className="bg-white p-5">
          <div className="bg-gray-100 rounded-2xl overflow-hidden h-80 relative">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto hide-scroll">
              {product.images.slice(1, 5).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border-2 border-transparent hover:border-primary transition"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white mt-3 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${verticalColor}`}>
                  {verticalLabel}
                </span>
                {product.category?.name && (
                  <span className="text-xs text-gray-500">{product.category.name}</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-3xl font-bold text-gray-900 mt-3">
            ₦{product.price.toLocaleString()}
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">🏪 Store:</span>
              <span>{product.business?.name || 'Unknown'}</span>
            </div>
            {renderVerticalDetails()}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900">Description</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Stock */}
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Stock: {product.stock_quantity !== undefined ? product.stock_quantity : 'Unlimited'}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mt-5">
            <span className="text-sm font-medium text-gray-700">Quantity</span>
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-1 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 disabled:opacity-40 hover:bg-gray-50 active:scale-95 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className={`w-full mt-6 py-3.5 rounded-2xl text-white font-semibold text-sm ${verticalColor} hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50`}
          >
            {addingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Adding to cart...
              </span>
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}