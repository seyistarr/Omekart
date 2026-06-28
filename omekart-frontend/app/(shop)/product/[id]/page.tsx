import { createClient } from '@/lib/supabase/server'
import AddToCartButton from '@/components/buyer/AddToCartButton'
import { notFound } from 'next/navigation'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }> // Next.js 15+ uses Promise for params
}) {
  const { id } = await params // Await it

  const supabase = await createClient() // createClient is async now

  const { data: product, error } = await supabase
    .from('catalog_items')
    .select('*, business:business_id(name)')
    .eq('id', id)
    .single()

  if (error || !product) return notFound()

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