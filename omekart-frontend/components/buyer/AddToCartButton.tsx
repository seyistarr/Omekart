'use client'

import { useCartStore } from '@/store/cartStore'

export default function AddToCartButton({ catalog_item_id }: { catalog_item_id: string }) {
  const { addItem } = useCartStore()

  return (
    <button
      onClick={() => addItem({ catalog_item_id, quantity: 1 })}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Add to Cart
    </button>
  )
}