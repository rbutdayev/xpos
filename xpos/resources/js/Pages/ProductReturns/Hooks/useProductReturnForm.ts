import { useForm } from '@inertiajs/react';
import toast from 'react-hot-toast';

export interface ReturnItem {
    product_id: string;
    variant_id?: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    product?: any;
}

export interface ProductReturnFormData {
    supplier_id: string;
    warehouse_id: string;
    items: ReturnItem[];
    return_date: string;
    reason: string;
}

interface Product {
    id: number;
    name: string;
    barcode?: string;
    base_unit?: string;
    unit?: string;
    packaging_size?: string;
    packaging_quantity?: number;
    unit_price?: number;
    purchase_price?: number;
    available_quantity: number;
}

export default function useProductReturnForm() {
    const form = useForm<ProductReturnFormData>({
        supplier_id: '',
        warehouse_id: '',
        items: [] as ReturnItem[],
        return_date: new Date().toISOString().split('T')[0],
        reason: '',
    });

    const addItem = (product: Product) => {
        if (!Array.isArray(form.data.items)) {
            console.error('form.data.items is not an array, initializing as empty array');
            (form.setData as any)('items', []);
        }

        // Check if product already exists in items
        const existingIndex = form.data.items.findIndex(
            item => item.product_id === product.id.toString()
        );

        if (existingIndex !== -1) {
            // Increment quantity instead of adding duplicate
            const currentQty = parseFloat(form.data.items[existingIndex].quantity) || 0;
            updateItem(existingIndex, 'quantity', (currentQty + 1).toString());
            toast.success('Məhsulun miqdarı artırıldı');
            return;
        }

        const newItem: ReturnItem = {
            product_id: product.id.toString(),
            quantity: '1',
            unit: product?.base_unit || product?.unit || 'ədəd',
            unit_cost: product?.unit_price?.toString() || product?.purchase_price?.toString() || '0',
            product: product,
        };

        const currentItems = Array.isArray(form.data.items) ? form.data.items : [];
        (form.setData as any)('items', [...currentItems, newItem]);
    };

    const removeItem = (index: number) => {
        if (!Array.isArray(form.data.items)) {
            console.error('form.data.items is not an array');
            return;
        }
        const newItems = form.data.items.filter((_, i) => i !== index);
        (form.setData as any)('items', newItems);
    };

    const updateItem = (index: number, field: keyof ReturnItem, value: string) => {
        if (!Array.isArray(form.data.items)) {
            console.error('form.data.items is not an array');
            return;
        }
        const newItems = [...form.data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        (form.setData as any)('items', newItems);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!form.data.warehouse_id) {
            toast.error('Anbar seçin');
            return;
        }
        if (!form.data.supplier_id) {
            toast.error('Təchizatçı seçin');
            return;
        }
        if (!Array.isArray(form.data.items) || form.data.items.length === 0) {
            toast.error('Ən azı bir məhsul əlavə edin');
            return;
        }
        if (!form.data.reason || form.data.reason.trim() === '') {
            toast.error('Qaytarma səbəbini qeyd edin');
            return;
        }

        // Validate each item
        for (let i = 0; i < form.data.items.length; i++) {
            const item = form.data.items[i];
            if (!item.product_id) {
                toast.error(`${i + 1}-ci məhsul seçin`);
                return;
            }
            if (!item.quantity || parseFloat(item.quantity) <= 0) {
                toast.error(`${i + 1}-ci məhsul üçün düzgün miqdar daxil edin`);
                return;
            }

            // Check if quantity exceeds available stock
            if (item.product && parseFloat(item.quantity) > item.product.available_quantity) {
                toast.error(`${item.product.name} üçün miqdar mövcud stokdan çoxdur (${item.product.available_quantity})`);
                return;
            }
        }

        console.log('Submitting return data:', form.data);

        form.post(route('product-returns.store'), {
            onSuccess: () => {
                toast.success('Məhsul qaytarması uğurla yaradıldı');
            },
            onError: (errors: any) => {
                console.error('Validation errors:', errors);

                // Handle different error formats
                if (typeof errors === 'object' && errors !== null) {
                    // Check if it's a standard validation error object
                    const errorEntries = Object.entries(errors);

                    if (errorEntries.length > 0) {
                        // Show each validation error as a toast
                        errorEntries.forEach(([field, messages]) => {
                            const errorMessage = Array.isArray(messages) ? messages[0] : messages;

                            // Format field name for better readability
                            const formattedField = field
                                .replace(/items\.\d+\./, '') // Remove items.0. prefix
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, l => l.toUpperCase());

                            toast.error(`${formattedField}: ${errorMessage}`, { duration: 5000 });
                        });
                    } else {
                        // If no specific field errors, show generic error
                        toast.error('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.', { duration: 5000 });
                    }
                } else if (typeof errors === 'string') {
                    // Handle string error
                    toast.error(errors, { duration: 5000 });
                } else {
                    // Fallback for unknown error format
                    toast.error('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.', { duration: 5000 });
                }
            },
            onFinish: () => {
                console.log('Form submission finished');
            },
        });
    };

    return {
        form,
        submit,
        addItem,
        removeItem,
        updateItem,
    };
}
