import { useCallback, useMemo, useState } from 'react';
import { Product, ProductVariant } from '@/types';

export type CartItem = {
  id: string;
  type: 'product' | 'manual';
  product_id?: number;
  variant_id?: number;
  product?: Product;
  variant?: ProductVariant;
  item_name?: string;
  quantity: number;
  base_quantity?: number;
  unit_price: number;
  discount_amount: number;
  total: number;
  selling_unit?: string;
  is_packaging?: boolean;
  notes?: string;
};

export function useCart(initial: CartItem[] = []) {
  const [cart, setCart] = useState<CartItem[]>(initial);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);

  // Unit və qiymət dəyişdirmək üçün funksiya
  const changeItemUnit = useCallback((itemId: string, newUnit: string) => {
    setCart(prev => prev.map(item => {
      if (item.id !== itemId || !item.product) return item;
      
      const product = item.product;
      let unitPrice: number;
      let isPackaging = false;
      
      if (newUnit === 'qab' || newUnit === product.packaging_size) {
        // Qab qiyməti - floating point precision fix
        const basePrice = Number(product.unit_price) || 0;
        const packagingQty = Number(product.packaging_quantity) || 1;
        unitPrice = Math.round((basePrice * packagingQty) * 100) / 100;
        isPackaging = true;
      } else {
        // Base unit qiyməti (litr) - round to 2 decimal places
        unitPrice = Math.round((Number(product.unit_price) || Number(product.sale_price) || 0) * 100) / 100;
        isPackaging = false;
      }
      
      return {
        ...item,
        unit_price: unitPrice,
        selling_unit: newUnit,
        is_packaging: isPackaging,
        total: Math.round((item.quantity * unitPrice - item.discount_amount) * 100) / 100,
      };
    }));
  }, []);

  const addToCart = useCallback((item: Product, variant?: ProductVariant) => {
    const product = item;
    setCart((prev) => {
      // If variant is specified, check for existing cart item with same product_id AND variant_id
      const existingIndex = prev.findIndex((ci) =>
        ci.type === 'product' &&
        ci.product_id === product.id &&
        ci.variant_id === variant?.id
      );

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const updatedQty = existing.quantity + 1;
        const updated: CartItem = {
          ...existing,
          quantity: updatedQty,
          base_quantity:
            product.packaging_quantity && product.packaging_quantity > 0
              ? existing.selling_unit === product.base_unit
                ? updatedQty
                : updatedQty * product.packaging_quantity
              : updatedQty,
          total: updatedQty * existing.unit_price - existing.discount_amount,
        };
        const next = prev.slice();
        next[existingIndex] = updated;
        return next;
      }

      // Default olaraq base unit istifadə et (litr üçün)
      const sellingUnit = product.base_unit || product.unit || 'ədəd';

      // If variant is provided, use variant's final_price, otherwise use product price
      let unitPrice = variant?.final_price
        ? Number(variant.final_price)
        : (Number(product.unit_price) || Number(product.sale_price) || 0);
      let quantity = 1;

      // Əgər packaging məlumatları varsa, unit_price istifadə et (litr qiyməti)
      if (product.packaging_quantity && product.packaging_quantity > 0 && product.unit_price && !variant) {
        unitPrice = Math.round(Number(product.unit_price) * 100) / 100; // Litr qiyməti - rounded
        quantity = 1; // 1 litr
      }

      const ci: CartItem = {
        id: `product-${product.id}-${variant?.id || 'none'}-${Date.now()}`,
        type: 'product',
        quantity,
        unit_price: unitPrice,
        discount_amount: 0,
        is_packaging: false,
        total: Math.round((quantity * unitPrice) * 100) / 100,
        selling_unit: sellingUnit,
        base_quantity: quantity,
        product_id: product.id,
        variant_id: variant?.id,
        variant,
        product,
      };
      return [...prev, ci];
    });
  }, []);

  const updateCartItem = useCallback((id: string, field: keyof CartItem, value: any) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated: CartItem = { ...item, [field]: value } as CartItem;
        if (field === 'quantity' && item.type === 'product' && item.product) {
          const newQty = Number(value) || 0;
          if (item.product.packaging_quantity && item.product.packaging_quantity > 0) {
            const isBaseUnit = item.selling_unit === item.product.base_unit;
            updated.base_quantity = isBaseUnit ? newQty : newQty * item.product.packaging_quantity;
          } else {
            updated.base_quantity = newQty;
          }
        }
        updated.total = Math.round((updated.quantity * updated.unit_price - updated.discount_amount) * 100) / 100;
        return updated;
      })
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    cart,
    setCart,
    subtotal,
    addToCart,
    updateCartItem,
    removeFromCart,
    changeItemUnit,
  };
}

