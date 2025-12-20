import { useRef, useState, useCallback, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import useInventoryUpdate from './useInventoryUpdate';
import { GoodsReceipt } from '@/types';
import toast from 'react-hot-toast';
import axios from 'axios';

export interface ProductItem {
    product_id: string;
    quantity: string;
    base_quantity: string;
    unit: string;
    receiving_unit: string;
    unit_cost: string;
    discount_percent: string;
    sale_price?: string;
    product?: any;
    variant_id?: string;
}

export interface GoodsReceiptFormData {
    warehouse_id: string;
    supplier_id: string;
    invoice_number?: string;
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
    purchase_price?: number;
    sale_price?: number;
}

type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

interface AsyncJobState {
    jobId: string | null;
    status: JobStatus;
    message: string;
    data: any;
}

export default function useGoodsReceiptForm(receipt?: GoodsReceipt, isEditing = false) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [calculatedDueDate, setCalculatedDueDate] = useState<string | null>(null);
    const [showInstantPaymentConfirmation, setShowInstantPaymentConfirmation] = useState(false);
    const [pendingSubmitAction, setPendingSubmitAction] = useState<'completed' | null>(null);

    // Async job state
    const [asyncJob, setAsyncJob] = useState<AsyncJobState>({
        jobId: null,
        status: 'idle',
        message: '',
        data: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Polling interval reference
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Idempotency key - generated once per form instance
    const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

    // Check if receipt has items (new structure after migration) or use old structure for backward compatibility
    const initialProducts = receipt?.items && receipt.items.length > 0
        ? receipt.items.map(item => ({
            product_id: item.product_id?.toString() || '',
            quantity: item.quantity?.toString() || '',
            base_quantity: item.additional_data?.base_quantity?.toString() || item.quantity?.toString() || '',
            unit: item.unit || '',
            receiving_unit: item.additional_data?.received_unit || item.unit || '',
            unit_cost: item.unit_cost?.toString() || '',
            discount_percent: item.discount_percent?.toString() || '0',
            sale_price: item.product?.sale_price?.toString() || '',
            product: item.product,
            variant_id: item.variant_id?.toString() || undefined,
        }))
        : receipt ? [{
            product_id: receipt.product_id?.toString() || '',
            quantity: receipt.quantity?.toString() || '',
            base_quantity: receipt.quantity?.toString() || '',
            unit: receipt.unit || '',
            receiving_unit: receipt.unit || '',
            unit_cost: receipt.unit_cost?.toString() || '',
            discount_percent: receipt.additional_data?.discount_percent?.toString() || '0',
            sale_price: receipt.product?.sale_price?.toString() || '',
            product: receipt.product,
            variant_id: undefined,
        }] : [] as ProductItem[];

    const form = useForm({
        warehouse_id: receipt?.warehouse_id?.toString() || '',
        supplier_id: receipt?.supplier_id?.toString() || '',
        invoice_number: receipt?.invoice_number || '',
        products: initialProducts,
        notes: receipt?.notes || '',
        document: null as File | null,
        payment_method: (receipt?.payment_method as 'instant' | 'credit') || 'instant',
        payment_status: (receipt?.payment_status as 'paid' | 'unpaid') || 'paid',
        custom_payment_terms: 0,
        use_custom_terms: false,
        // Additional fields for editing
        quantity: receipt?.quantity?.toString() || '',
        unit: receipt?.unit || '',
        unit_cost: receipt?.unit_cost?.toString() || '',
        employee_id: receipt?.employee_id?.toString() || '',
    });

    const { notifyUpdate } = useInventoryUpdate();

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Generate a simple idempotency key
    function generateIdempotencyKey(): string {
        return `gr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Poll for job status
    const pollJobStatus = useCallback(async (jobId: string) => {
        try {
            const response = await axios.get(route('goods-receipts.job-status', { jobId }));

            if (response.data.success) {
                const { status, message, data } = response.data;

                setAsyncJob(prev => ({
                    ...prev,
                    status,
                    message,
                    data,
                }));

                // If job is completed or failed, stop polling
                if (status === 'completed' || status === 'failed') {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    setIsSubmitting(false);

                    if (status === 'completed') {
                        toast.success(message || 'Mal qəbulu uğurla yaradıldı');

                        // Notify inventory update
                        if (Array.isArray(form.data.products)) {
                            form.data.products.forEach(product => {
                                notifyUpdate({
                                    type: 'goods_receipt_created',
                                    warehouse_id: form.data.warehouse_id,
                                    product_id: product.product_id,
                                });
                            });
                        }

                        // Navigate to index page
                        router.visit(route('goods-receipts.index'), {
                            preserveState: false,
                            preserveScroll: false,
                        });
                    } else {
                        toast.error(message || 'Xəta baş verdi');
                    }
                }
            }
        } catch (error) {
            console.error('Error polling job status:', error);
            // Don't stop polling on network errors - it might recover
        }
    }, [form.data.products, form.data.warehouse_id, notifyUpdate]);

    // Start polling for job status
    const startPolling = useCallback((jobId: string) => {
        // Clear any existing polling
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Initial poll immediately
        pollJobStatus(jobId);

        // Then poll every 1 second
        pollingIntervalRef.current = setInterval(() => {
            pollJobStatus(jobId);
        }, 1000);

        // Safety timeout - stop polling after 5 minutes
        setTimeout(() => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
                setIsSubmitting(false);
                setAsyncJob(prev => ({
                    ...prev,
                    status: 'failed',
                    message: 'Əməliyyat çox uzun çəkdi. Zəhmət olmasa yenidən cəhd edin.',
                }));
                toast.error('Əməliyyat çox uzun çəkdi');
            }
        }, 5 * 60 * 1000);
    }, [pollJobStatus]);

    // Async submit for new goods receipts
    const submitAsync = async (status: 'draft' | 'completed') => {
        // Prevent double submission
        if (isSubmitting) return;

        setIsSubmitting(true);
        setAsyncJob({
            jobId: null,
            status: 'pending',
            message: 'Sorğu göndərilir...',
            data: null,
        });

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('warehouse_id', form.data.warehouse_id);
            formData.append('supplier_id', form.data.supplier_id);
            formData.append('invoice_number', form.data.invoice_number || '');
            formData.append('notes', form.data.notes || '');
            formData.append('payment_method', form.data.payment_method);
            formData.append('payment_status', form.data.payment_status);
            formData.append('use_custom_terms', form.data.use_custom_terms ? '1' : '0');
            formData.append('custom_payment_terms', form.data.custom_payment_terms.toString());
            formData.append('status', status);
            formData.append('idempotency_key', idempotencyKeyRef.current);

            if (form.data.document) {
                formData.append('document', form.data.document);
            }

            // Append products array
            form.data.products.forEach((product, index) => {
                formData.append(`products[${index}][product_id]`, product.product_id);
                formData.append(`products[${index}][quantity]`, product.quantity);
                formData.append(`products[${index}][base_quantity]`, product.base_quantity);
                formData.append(`products[${index}][unit]`, product.unit);
                formData.append(`products[${index}][receiving_unit]`, product.receiving_unit);
                formData.append(`products[${index}][unit_cost]`, product.unit_cost);
                formData.append(`products[${index}][discount_percent]`, product.discount_percent || '0');
                formData.append(`products[${index}][sale_price]`, product.sale_price || '');
                if (product.variant_id) {
                    formData.append(`products[${index}][variant_id]`, product.variant_id);
                }
            });

            const response = await axios.post(route('goods-receipts.store-async'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const { job_id, is_duplicate } = response.data;

                setAsyncJob(prev => ({
                    ...prev,
                    jobId: job_id,
                    status: 'pending',
                    message: is_duplicate
                        ? 'Bu sorğu artıq emal edilir. Status yoxlanılır...'
                        : 'Mal qəbulu növbəyə əlavə edildi. Emal edilir...',
                }));

                // Start polling for job status
                startPolling(job_id);
            } else {
                throw new Error(response.data.message || 'Xəta baş verdi');
            }
        } catch (error: any) {
            console.error('Async submit error:', error);
            setIsSubmitting(false);

            let errorMessage = 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';

            if (error.response?.data?.errors) {
                // Validation errors
                const errors = error.response.data.errors;
                errorMessage = Object.values(errors).flat().join(', ');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setAsyncJob({
                jobId: null,
                status: 'failed',
                message: errorMessage,
                data: null,
            });
            toast.error(errorMessage);
        }
    };

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

    const validateForm = (): boolean => {
        if (!form.data.warehouse_id) {
            toast.error('Anbar seçin');
            return false;
        }
        if (!form.data.supplier_id) {
            toast.error('Təchizatçı seçin');
            return false;
        }
        if (!Array.isArray(form.data.products) || form.data.products.length === 0) {
            toast.error('Ən azı bir məhsul əlavə edin');
            return false;
        }

        // Validate each product
        for (let i = 0; i < form.data.products.length; i++) {
            const product = form.data.products[i];
            if (!product.product_id) {
                toast.error(`${i + 1}-ci məhsul seçin`);
                return false;
            }
            if (!product.quantity) {
                toast.error(`${i + 1}-ci məhsul üçün miqdar daxil edin`);
                return false;
            }
            if (!product.unit) {
                toast.error(`${i + 1}-ci məhsul üçün vahid daxil edin`);
                return false;
            }
        }

        return true;
    };

    const submitWithStatus = (status: 'draft' | 'completed') => {
        if (!validateForm()) return;

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
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') {
                        toast.error(firstError);
                    } else {
                        toast.error('Mal qəbulu yenilənərkən xəta baş verdi');
                    }
                }
            });
        } else {
            // For new receipts, use async submission
            submitAsync(status);
        }
    };

    const submitAsDraft = (e: React.FormEvent) => {
        e.preventDefault();
        submitWithStatus('draft');
    };

    const submitAsCompleted = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Check if payment method is instant - show confirmation modal
        if (form.data.payment_method === 'instant') {
            setPendingSubmitAction('completed');
            setShowInstantPaymentConfirmation(true);
            return;
        }

        // If editing a draft, use the complete endpoint (synchronous)
        if (isEditing && receipt && receipt.status === 'draft') {
            form.post(route('goods-receipts.complete', receipt.id), {
                onSuccess: () => {
                    toast.success('Mal qəbulu uğurla tamamlandı');
                    if (Array.isArray(form.data.products)) {
                        form.data.products.forEach(product => {
                            notifyUpdate({
                                type: 'goods_receipt_created',
                                warehouse_id: form.data.warehouse_id,
                                product_id: product.product_id,
                            });
                        });
                    }
                },
                onError: (errors: any) => {
                    console.error('Validation errors:', errors);
                    Object.entries(errors).forEach(([field, messages]) => {
                        const errorMessage = Array.isArray(messages) ? messages[0] : messages;
                        toast.error(`${field}: ${errorMessage}`, { duration: 5000 });
                    });
                }
            });
        } else {
            submitWithStatus('completed');
        }
    };

    const confirmInstantPaymentAndSubmit = () => {
        setShowInstantPaymentConfirmation(false);

        // If editing a draft, use the complete endpoint
        if (isEditing && receipt && receipt.status === 'draft') {
            form.post(route('goods-receipts.complete', receipt.id), {
                onSuccess: () => {
                    toast.success('Mal qəbulu uğurla tamamlandı');
                    if (Array.isArray(form.data.products)) {
                        form.data.products.forEach(product => {
                            notifyUpdate({
                                type: 'goods_receipt_created',
                                warehouse_id: form.data.warehouse_id,
                                product_id: product.product_id,
                            });
                        });
                    }
                },
                onError: (errors: any) => {
                    console.error('Validation errors:', errors);
                    Object.entries(errors).forEach(([field, messages]) => {
                        const errorMessage = Array.isArray(messages) ? messages[0] : messages;
                        toast.error(`${field}: ${errorMessage}`, { duration: 5000 });
                    });
                }
            });
        } else {
            submitWithStatus('completed');
        }
        setPendingSubmitAction(null);
    };

    const cancelInstantPaymentConfirmation = () => {
        setShowInstantPaymentConfirmation(false);
        setPendingSubmitAction(null);
    };

    const addProduct = (product: Product) => {
        if (!Array.isArray(form.data.products)) {
            console.error('form.data.products is not an array, initializing as empty array');
            (form.setData as any)('products', []);
        }

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
            unit_cost: product?.purchase_price?.toString() || '',
            discount_percent: '0',
            sale_price: product?.sale_price?.toString() || '',
            product: product,
            variant_id: undefined,
        };

        const currentProducts = Array.isArray(form.data.products) ? form.data.products : [];
        (form.setData as any)('products', [...currentProducts, newProduct]);
    };

    const removeProduct = (index: number) => {
        if (!Array.isArray(form.data.products)) {
            console.error('form.data.products is not an array');
            return;
        }
        const newProducts = form.data.products.filter((_, i) => i !== index);
        (form.setData as any)('products', newProducts);
    };

    const updateProduct = (index: number, field: keyof ProductItem, value: string) => {
        if (!Array.isArray(form.data.products)) {
            console.error('form.data.products is not an array');
            return;
        }
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

    // Reset async job state (useful for retry)
    const resetAsyncJob = () => {
        // Generate new idempotency key for retry
        idempotencyKeyRef.current = generateIdempotencyKey();
        setAsyncJob({
            jobId: null,
            status: 'idle',
            message: '',
            data: null,
        });
        setIsSubmitting(false);
    };

    return {
        form,
        submit: submitAsCompleted, // Default submit is completed for backward compatibility
        submitAsDraft,
        submitAsCompleted,
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
        showInstantPaymentConfirmation,
        confirmInstantPaymentAndSubmit,
        cancelInstantPaymentConfirmation,
        // Async job state
        asyncJob,
        isSubmitting,
        resetAsyncJob,
    };
}
