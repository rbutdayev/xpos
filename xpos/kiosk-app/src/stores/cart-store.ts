import { create } from 'zustand';
import type { CartItem, Customer, Payment } from '../types';

interface CartStore {
  items: CartItem[];
  customer: Customer | null;
  payments: Payment[];
  notes: string;

  // Computed values
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;

  // Actions
  addItem: (item: Omit<CartItem, 'subtotal'>) => void;
  updateQuantity: (productId: number, variantId: number | null, quantity: number) => void;
  removeItem: (productId: number, variantId: number | null) => void;
  updateDiscount: (productId: number, variantId: number | null, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  addPayment: (payment: Payment) => void;
  removePayment: (index: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customer: null,
  payments: [],
  notes: '',
  subtotal: 0,
  taxAmount: 0,
  discountAmount: 0,
  total: 0,

  addItem: (item) => {
    const items = get().items;
    const existingIndex = items.findIndex(
      (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
    );

    let newItems: CartItem[];
    if (existingIndex >= 0) {
      // Update quantity if item already exists
      newItems = items.map((i, idx) =>
        idx === existingIndex
          ? {
              ...i,
              quantity: i.quantity + item.quantity,
              subtotal: (i.quantity + item.quantity) * i.unit_price - i.discount_amount,
            }
          : i
      );
    } else {
      // Add new item
      newItems = [
        ...items,
        {
          ...item,
          subtotal: item.quantity * item.unit_price - item.discount_amount,
        },
      ];
    }

    set({ items: newItems });
    get().calculateTotals();
  },

  updateQuantity: (productId, variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }

    const items = get().items.map((item) =>
      item.product_id === productId && item.variant_id === variantId
        ? {
            ...item,
            quantity,
            subtotal: quantity * item.unit_price - item.discount_amount,
          }
        : item
    );

    set({ items });
    get().calculateTotals();
  },

  removeItem: (productId, variantId) => {
    const items = get().items.filter(
      (item) => !(item.product_id === productId && item.variant_id === variantId)
    );
    set({ items });
    get().calculateTotals();
  },

  updateDiscount: (productId, variantId, discount) => {
    const items = get().items.map((item) =>
      item.product_id === productId && item.variant_id === variantId
        ? {
            ...item,
            discount_amount: discount,
            subtotal: item.quantity * item.unit_price - discount,
          }
        : item
    );

    set({ items });
    get().calculateTotals();
  },

  setCustomer: (customer) => {
    set({ customer });
  },

  addPayment: (payment) => {
    set({ payments: [...get().payments, payment] });
  },

  removePayment: (index) => {
    set({ payments: get().payments.filter((_, i) => i !== index) });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  clearCart: () => {
    set({
      items: [],
      customer: null,
      payments: [],
      notes: '',
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 0,
    });
  },

  calculateTotals: () => {
    const items = get().items;
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = items.reduce((sum, item) => sum + item.discount_amount, 0);

    // Tax calculation (placeholder - could be configurable)
    const taxAmount = 0; // TODO: Implement tax calculation based on config

    const total = subtotal + taxAmount;

    set({
      subtotal,
      taxAmount,
      discountAmount,
      total,
    });
  },
}));
