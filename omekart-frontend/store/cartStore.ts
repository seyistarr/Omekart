import { create } from 'zustand'
import { addToCart } from '@/lib/api/cart'

export type CartItem = {
  id: string
  catalog_item_id: string
  quantity: number
  unit_price: number
  name: string
  images: string[]
}

type CartState = {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (params: { catalog_item_id: string; quantity?: number }) => Promise<void>
  loadCart: (items: CartItem[]) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,

  addItem: async ({ catalog_item_id, quantity = 1 }) => {
    try {
      const result = await addToCart({ catalog_item_id, quantity })
      // result.cart.items has the updated cart items
      const items = result.cart.items.map((i: any) => ({
        id: i.id,
        catalog_item_id: i.catalog_item_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        name: i.catalog_items.name,
        images: i.catalog_items.images || [],
      }))
      const totalItems = items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0)
      const totalPrice = items.reduce((sum: number, i: CartItem) => sum + i.quantity * i.unit_price, 0)
      set({ items, totalItems, totalPrice })
    } catch (error) {
      console.error('Failed to add item to cart:', error)
    }
  },

  loadCart: (items) => {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
    const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    set({ items, totalItems, totalPrice })
  },

  clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
}))