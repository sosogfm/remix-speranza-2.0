import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
  personalization?: string;
  key: string;
}

const itemKey = (productId: string, personalization?: string) =>
  `${productId}::${personalization ?? ""}`;

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, personalization?: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getSubtotalCents: () => number;
  getItemCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, personalization) => {
        const key = itemKey(product.id, personalization);
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          const max = Math.max(product.stock, 0);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key
                  ? { ...i, quantity: Math.min(i.quantity + quantity, max || 1) }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { product, quantity: Math.min(quantity, max || 1), personalization, key },
            ],
          };
        });
      },

      updateQuantity: (key, quantity) => {
        if (quantity < 1) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key
              ? { ...i, quantity: Math.min(quantity, Math.max(i.product.stock, 1)) }
              : i
          ),
        }));
      },

      removeItem: (key) => {
        set((state) => ({ items: state.items.filter((i) => i.key !== key) }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotalCents: () =>
        get().items.reduce((t, i) => t + i.product.priceCents * i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((t, i) => t + i.product.price * i.quantity, 0),

      getItemCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
    }),
    { name: "speranza-cart" }
  )
);
