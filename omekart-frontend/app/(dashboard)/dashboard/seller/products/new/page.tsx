'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type ProductType = 'product' | 'food' | 'service'

export default function NewProductPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [productType, setProductType] = useState<ProductType>('product')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
  // Food-specific
  const [prepTime, setPrepTime] = useState(0)
  // Service-specific
  const [duration, setDuration] = useState(0)
  const [bufferBefore, setBufferBefore] = useState(0)
  const [bufferAfter, setBufferAfter] = useState(0)
  // Product-specific
  const [weight, setWeight] = useState('')
  const [dimensions, setDimensions] = useState('')

  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        // Get business
        const { data: biz, error: bizError } = await supabase
          .from('businesses')
          .select('id, business_type, name')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (bizError || !biz) {
          router.push('/onboarding')
          return
        }
        setBusiness(biz)

        // Set product type based on business type
        const typeMap: Record<string, ProductType> = {
          products: 'product',
          food: 'food',
          services: 'service',
        }
        setProductType(typeMap[biz.business_type] || 'product')

        // Fetch categories for this vertical
        const { data: cats } = await supabase
          .from('taxonomy_nodes')
          .select('id, name')
          .eq('vertical', biz.business_type)
          .eq('level', 2)
          .eq('is_active', true)
          .order('name')

        setCategories(cats || [])
      } catch (err) {
        console.error(err)
        setError('Failed to load data')
      } finally {
        setCategoriesLoading(false)
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleAddImage = () => {
    if (imageInput && images.length < 5) {
      setImages([...images, imageInput])
      setImageInput('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!name || !price || !categoryId) {
      setError('Name, price, and category are required.')
      setSubmitting(false)
      return
    }

    const payload: any = {
      product_type: productType,
      node_id: categoryId,
      name,
      price: parseFloat(price),
      description,
      images,
      status: 'draft',
    }

    // Add vertical-specific fields
    if (productType === 'food') {
      payload.prep_time_minutes = prepTime || 0
    } else if (productType === 'service') {
      payload.duration_minutes = duration || 0
      payload.buffer_before = bufferBefore || 0
      payload.buffer_after = bufferAfter || 0
    } else {
      if (weight) payload.weight_kg = parseFloat(weight)
      if (dimensions) payload.dimensions = dimensions
    }

    try {
      // Call the Edge Function directly using fetch
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL}/create-catalog-item`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create item')
      }

      const result = await response.json()
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/seller')
        }, 1500)
      } else {
        setError(result.error || 'Failed to create item')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>
  }

  if (!business) {
    return <div className="p-6 text-red-500">No business found. Please complete onboarding.</div>
  }

  const verticalLabel =
    business.business_type === 'products'
      ? 'Product'
      : business.business_type === 'food'
      ? 'Food Item'
      : 'Service'

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900">Add New {verticalLabel}</h2>
      <p className="text-gray-500 text-sm mt-1">For your {business.business_type} store</p>

      {success ? (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
          ✅ {verticalLabel} created successfully! Redirecting...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            {categoriesLoading ? (
              <div className="text-gray-400">Loading categories...</div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Images (max 5 URLs)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="Image URL"
                className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={images.length >= 5}
                className="px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {productType === 'food' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (minutes)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          )}

          {productType === 'service' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Before (min)</label>
                  <input
                    type="number"
                    value={bufferBefore}
                    onChange={(e) => setBufferBefore(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buffer After (min)</label>
                  <input
                    type="number"
                    value={bufferAfter}
                    onChange={(e) => setBufferAfter(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {productType === 'product' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (cm)</label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="e.g., 30x20x10"
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dark transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/seller')}
              className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}