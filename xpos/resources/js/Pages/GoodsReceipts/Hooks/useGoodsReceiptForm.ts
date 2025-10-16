import { useRef, useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import useInventoryUpdate from './useInventoryUpdate';
import { GoodsReceipt } from '@/types';
import toast from 'react-hot-toast';

export interface ProductItem {
    product_id: string;
    quantity: string;
    base_quantity: string;
    unit: string;
    receiving_unit: string;
    unit_cost: string;
    product?: any;
}

export interface GoodsReceiptFormData {
    warehouse_id: string;
    supplier_id: string;
    products: ProductItem[];
    notes: string;
    document: File | null;
    payment_method: 'instant' | 'credit';
    payment_status: 'paid' | 'unpaid';
    custom_payment_terms: number;
    use_custom_terms: boolean;
    // Additional fields for editing single product goods receipts
    quantity?: string;
    unit?: string;
    unit_cost?: string;
    employee_id?: string;
}

interface Supplier {
    id: number;
    name: string;
    payment_terms_days?: number;
    payment_terms_text?: string;
}

interface Product {
    id: number;
    name: string;
    base_unit?: string;
    unit?: string;
    packaging_size?: string;
    packaging_quantity?: number;
    unit_price?: number;
}

export default function useGoodsReceiptForm(receipt?: GoodsReceipt, isEditing = false) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [calculatedDueDate, setCalculatedDueDate] = useState<string | null>(null);

    const form = useForm({
        warehouse_id: receipt?.warehouse_id?.toString() || '',
        supplier_id: receipt?.supplier_id?.toString() || '',
        products: receipt ? [{
            product_id: receipt.product_id?.toString() || '',
            quantity: receipt.quantity?.toString() || '',
            base_quantity: receipt.quantity?.toString() || '',
            unit: receipt.unit || '',
            receiving_unit: receipt.unit || '',
            unit_cost: receipt.unit_cost?.toString() || '',
            product: receipt.product,
        }] : [] as ProductItem[],
        notes: receipt?.notes || '',
        document: null as File | null,
        payment_method: (receipt?.payment_method as 'instant' | 'credit') || 'credit',
        payment_status: (receipt?.payment_status as 'paid' | 'unpaid') || 'unpaid',
        custom_payment_terms: 0,
        use_custom_terms: false,
        // Additional fields for editing
        quantity: receipt?.quantity?.toString() || '',
        unit: receipt?.unit || '',
        unit_cost: receipt?.unit_cost?.toString() || '',
        employee_id: receipt?.employee_id?.toString() || '',
    });

    const { notifyUpdate } = useInventoryUpdate();

    // Calculate due date based on supplier payment terms or custom terms
    const calculateDueDate = (supplier: Supplier, useCustom: boolean = false, customDays?: number) => {
        let paymentTerms: number;
        
        if (useCustom && customDays !== undefined) {
            paymentTerms = customDays;
        } else if (supplier?.payment_terms_days) {
            paymentTerms = supplier.payment_terms_days;
        } else {
            return null;
        }
        
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + paymentTerms);
        
        return dueDate.toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Handle supplier change to update payment terms
    const handleSupplierChange = (supplierId: string, suppliers: Supplier[]) => {
        (form.setData as any)('supplier_id', supplierId);
        
        const supplier = suppliers.find(s => s.id.toString() === supplierId);
        setSelectedSupplier(supplier || null);
        
        if (supplier && form.data.payment_method === 'credit') {
            const dueDate = calculateDueDate(supplier, form.data.use_custom_terms, form.data.custom_payment_terms);
            setCalculatedDueDate(dueDate);
        } else {
            setCalculatedDueDate(null);
        }
    };

    // Handle payment method change
    const handlePaymentMethodChange = (method: 'instant' | 'credit') => {
        (form.setData as any)('payment_method', method);
        (form.setData as any)('payment_status', method === 'instant' ? 'paid' : 'unpaid');
        
        if (method === 'credit' && selectedSupplier) {
            const dueDate = calculateDueDate(selectedSupplier, form.data.use_custom_terms, form.data.custom_payment_terms);
            setCalculatedDueDate(dueDate);
        } else {
            setCalculatedDueDate(null);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.warehouse_id) {
            toast.error('Anbar seçin');
            return;
        }
        if (!form.data.supplier_id) {
            toast.error('Təchizatçı seçin');
            return;
        }
        if (form.data.products.length === 0) {
            toast.error('Ən azı bir məhsul əlavə edin');
            return;
        }

        // Validate each product
        for (let i = 0; i < form.data.products.length; i++) {
            const product = form.data.products[i];
            if (!product.product_id) {
                toast.error(`${i + 1}-ci məhsul seçin`);
                return;
            }
            if (!product.quantity) {
                toast.error(`${i + 1}-ci məhsul üçün miqdar daxil edin`);
                return;
            }
            if (!product.unit) {
                toast.error(`${i + 1}-ci məhsul üçün vahid daxil edin`);
                return;
            }
        }

        if (isEditing && receipt) {
            // For editing, extract product data and sync with form fields
            const product = form.data.products[0];

            // Manually sync the current product values to form fields
            form.data.quantity = product.quantity;
            form.data.unit = product.unit;
            form.data.unit_cost = product.unit_cost;

            form.put(route('goods-receipts.update', receipt.id), {
                onSuccess: () => {
                    toast.success('Mal qəbulu uğurla yeniləndi');
                    notifyUpdate({
                        type: 'goods_receipt_updated',
                        warehouse_id: form.data.warehouse_id,
                        product_id: product.product_id,
                    });
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                    // Show first error
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') {
                        toast.error(firstError);
                    } else {
                        toast.error('Mal qəbulu yenilənərkən xəta baş verdi');
                    }
                }
            });
        } else {
            console.log('Submitting form data:', form.data);
            form.post(route('goods-receipts.store'), {
                onSuccess: () => {
                    toast.success('Mal qəbulu uğurla yaradıldı');
                    // Notify other pages to refresh inventory views
                    form.data.products.forEach(product => {
                        notifyUpdate({
                            type: 'goods_receipt_created',
                            warehouse_id: form.data.warehouse_id,
                            product_id: product.product_id,
                        });
                    });
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                    // Show all errors as separate toasts
                    Object.entries(errors).forEach(([field, messages]) => {
                        const errorMessage = Array.isArray(messages) ? messages[0] : messages;
                        toast.error(`${field}: ${errorMessage}`, { duration: 5000 });
                    });
                },
                onFinish: () => {
                    console.log('Form submission finished. Processing:', form.processing);
                }
            });
        }
    };

    const addProduct = (product: Product) => {
        let receivingUnit = product?.base_unit || product?.unit || 'ədəd';
        let initialBaseQuantity = '1';
        if (product?.packaging_quantity) {
            receivingUnit = 'qutu';
            initialBaseQuantity = product.packaging_quantity.toString();
        }

        const newProduct: ProductItem = {
            product_id: product.id.toString(),
            quantity: '1',
            base_quantity: initialBaseQuantity,
            unit: product?.base_unit || product?.unit || '',
            receiving_unit: receivingUnit,
            unit_cost: '',
            product: product,
        };

        (form.setData as any)('products', [...form.data.products, newProduct]);
    };

    const removeProduct = (index: number) => {
        const newProducts = form.data.products.filter((_, i) => i !== index);
        (form.setData as any)('products', newProducts);
    };

    const updateProduct = (index: number, field: keyof ProductItem, value: string) => {
        const newProducts = [...form.data.products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        
        // Auto-calculate base quantity when quantity or receiving unit changes
        if (field === 'quantity' || field === 'receiving_unit') {
            const quantity = parseFloat(newProducts[index].quantity) || 0;
            const receivingUnit = newProducts[index].receiving_unit;
            const product = newProducts[index].product;
            
            let baseQuantity = quantity;
            
            // Əgər qab qəbul edirsənsə, base quantity hesabla
            if (receivingUnit === 'qab' && product?.packaging_quantity && product.packaging_quantity > 0) {
                baseQuantity = quantity * product.packaging_quantity;
            }
            
            newProducts[index].base_quantity = baseQuantity.toString();
        }
        
        (form.setData as any)('products', newProducts);
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        (form.setData as any)('document', file);
    };

    // Handle custom payment terms toggle
    const handleCustomTermsToggle = (useCustom: boolean) => {
        (form.setData as any)('use_custom_terms', useCustom);
        if (!useCustom) {
            (form.setData as any)('custom_payment_terms', 0);
        }

        // Recalculate due date
        if (form.data.payment_method === 'credit' && selectedSupplier) {
            const dueDate = calculateDueDate(selectedSupplier, useCustom, form.data.custom_payment_terms);
            setCalculatedDueDate(dueDate);
        }
    };

    // Handle custom payment terms days change
    const handleCustomTermsChange = (days: number) => {
        (form.setData as any)('custom_payment_terms', days);
        
        // Recalculate due date
        if (form.data.payment_method === 'credit' && selectedSupplier) {
            const dueDate = calculateDueDate(selectedSupplier, true, days);
            setCalculatedDueDate(dueDate);
        }
    };

    return {
        form,
        submit,
        selectedProduct,
        setSelectedProduct,
        selectedSupplier,
        calculatedDueDate,
        addProduct,
        removeProduct,
        updateProduct,
        handleFileChange,
        handleSupplierChange,
        handlePaymentMethodChange,
        handleCustomTermsToggle,
        handleCustomTermsChange,
    };
}
