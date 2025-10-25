import { useCallback, useMemo } from 'react';
import { useForm } from '@inertiajs/react';

export type ProductFormMode = 'create' | 'edit';

export interface ProductFormState {
  name: string;
  sku: string;
  barcode: string;
  barcode_type: string;
  has_custom_barcode: boolean;
  category_id: string;
  parent_product_id: string | null;  // NEW: Link to mother product
  type: 'product' | 'service';
  description: string;
  purchase_price: string;
  sale_price: string;
  unit: string;
  packaging_size: string;
  base_unit: string;
  packaging_quantity: string;
  allow_negative_stock: boolean;
  brand: string;
  model: string;
  attributes: Record<string, string>;
  // create-only helpers
  initial_stock: { [warehouse_id: string]: string };
  min_levels: { [warehouse_id: string]: string };
  primary_photo_index?: number;
  // flags
  is_active?: boolean;
}

export const useProductForm = (initial?: Partial<ProductFormState>) => {
  const form = useForm<ProductFormState>({
    name: initial?.name || '',
    sku: initial?.sku || '',
    barcode: initial?.barcode || '',
    barcode_type: initial?.barcode_type || 'EAN-13',
    has_custom_barcode: initial?.has_custom_barcode || false,
    category_id: initial?.category_id || '',
    parent_product_id: initial?.parent_product_id || null,  // NEW
    type: (initial?.type as 'product' | 'service') || 'product',
    description: initial?.description || '',
    purchase_price: initial?.purchase_price || '',
    sale_price: initial?.sale_price || '',
    unit: initial?.unit || 'ədəd',
    packaging_size: initial?.packaging_size || '',
    base_unit: initial?.base_unit || 'ədəd',
    packaging_quantity: initial?.packaging_quantity || '1',
    allow_negative_stock: initial?.allow_negative_stock || false,
    brand: initial?.brand || '',
    model: initial?.model || '',
    attributes: initial?.attributes || {},
    initial_stock: initial?.initial_stock || {},
    min_levels: initial?.min_levels || {},
    primary_photo_index: initial?.primary_photo_index || 0,
    is_active: initial?.is_active,
  });

  const calculations = useMemo(() => {
    const price = parseFloat(form.data.sale_price || '0');
    const cost = parseFloat(form.data.purchase_price || '0');
    const profit = price > 0 && cost > 0 ? price - cost : 0;
    const margin = price > 0 && cost > 0 ? ((price - cost) / price) * 100 : 0;
    return { profit, margin };
  }, [form.data.sale_price, form.data.purchase_price]);

  const generateSKU = useCallback(() => {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 7);
    return `PRD-${ts}-${rand}`.toUpperCase();
  }, []);

  return { ...form, calculations, generateSKU };
};
