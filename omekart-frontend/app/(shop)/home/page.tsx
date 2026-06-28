import { createClient } from '@/lib/supabase/server' // This is now read-only
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('catalog_items')
    .select('id, name, price, images, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error loading products:', error)
    return <div className="p-4">Failed to load products. Please try again later.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Explore Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products?.length === 0 && (
          <p className="col-span-full text-gray-500">No products available yet.</p>
        )}
        {products?.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <div className="border rounded p-4 hover:shadow-lg transition">
              <div className="h-40 bg-gray-100 rounded mb-2 flex items-center justify-center">
                {product.images?.[0] ? (
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