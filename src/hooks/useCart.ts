import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";


/** Valor preenchido pela cliente em um campo de personalização */
export interface PersonalizationValue {
  fieldId: string;
  label: string;
  type: string;
  value: string;
  extraCents: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** resumo legível, usado no pedido e no admin */
  personalization?: string;
  personalizationValues?: PersonalizationValue[];
  /** acréscimo unitário vindo das opções de personalização */
  extraCents: number;
  /** preço unitário final já com promoção, tamanho e extras */
  unitCents?: number;
  key: string;
}

export const summarizePersonalization = (values: PersonalizationValue[]) =>
  values
    .filter((v) => v.value)
    .map((v) => `${v.label}: ${v.value}`)
    .join(" · ");

/** preço unitário do item já com promoção/tamanho/extras */
export const unitPriceCents = (i: CartItem) =>
  i.unitCents ?? i.product.priceCents + (i.extraCents || 0);

const itemKey = (productId: string, personalization?: string) =>
  `${productId}::${personalization ?? ""}`;

interface CartState {
  items: CartItem[];
  isGift: boolean;
  giftMessage: string;
  addItem: (
    product: Product,
    quantity?: number,
    values?: PersonalizationValue[],
    unitCents?: number
  ) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  setGift: (isGift: boolean) => void;
  setGiftMessage: (message: string) => void;
  getSubtotalCents: () => number;
  getItemCount: () => number;
  /** remove da sacola peças que saíram do ar ou foram excluídas */
  keepOnly: (productIds: string[]) => void;
}


export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isGift: false,
      giftMessage: "",

      addItem: (product, quantity = 1, values, unitCents) => {
        const summary = values?.length ? summarizePersonalization(values) : undefined;
        const extraCents = (values ?? []).reduce((t, v) => t + (v.extraCents || 0), 0);
        const key = itemKey(product.id, summary);
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
              {
                product,
                quantity: Math.min(quantity, max || 1),
                personalization: summary,
                personalizationValues: values,
                extraCents,
                unitCents,
                key,
              },
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

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      clearCart: () => set({ items: [], isGift: false, giftMessage: "" }),

      setGift: (isGift) => set({ isGift }),
      setGiftMessage: (giftMessage) => set({ giftMessage }),

      getSubtotalCents: () =>
        get().items.reduce(
          (t, i) => t + unitPriceCents(i) * i.quantity,
          0
        ),

      getItemCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
    }),
    { name: "speranza-cart", version: 3 }
  )
);
