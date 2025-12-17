import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SHIPPING_THRESHOLD, SHIPPING_COST, TAX_RATE } from "./constants";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  image: string;
  maxStock?: number;
  size?: string;
  sizeId?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Create a unique ID based on product ID and size
          const itemId = item.sizeId ? `${item.id}-${item.sizeId}` : item.id;
          const itemWithUniqueId = { ...item, id: itemId };

          const existing = state.items.find((i) => i.id === itemId);

          if (existing) {
            const newQuantity = existing.quantity + item.quantity;
            const limitedQuantity =
              item.maxStock !== undefined
                ? Math.min(newQuantity, item.maxStock)
                : newQuantity;

            return {
              items: state.items.map((i) =>
                i.id === itemId
                  ? { ...i, quantity: limitedQuantity, maxStock: item.maxStock }
                  : i,
              ),
            };
          }

          return { items: [...state.items, itemWithUniqueId] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === itemId) {
              const limitedQuantity =
                i.maxStock !== undefined
                  ? Math.min(quantity, i.maxStock)
                  : quantity;
              return { ...i, quantity: limitedQuantity };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const finalPrice = item.price * (1 - item.discount / 100);
          return total + finalPrice * item.quantity;
        }, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = subtotal * TAX_RATE;
        const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        return subtotal + tax + shipping;
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "lyonarvex-cart",
      storage: createJSONStorage(() => localStorage),
      // Only persist items array
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
