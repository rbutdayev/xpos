import { Head, router, usePage } from '@inertiajs/react';
import { useState, FormEvent, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon, TrashIcon, CameraIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Product } from '@/types';
import { useSearch } from '@/Pages/POS/hooks/useSearch';
import BarcodeScanner from '@/Components/BarcodeScanner';
import RentalAgreementSection from '@/Components/RentalAgreementSection';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
}

interface Branch {
    id: number;
    name: string;
}

interface RentalItem {
    product_id: string;
    rental_inventory_id: string;
    rate_type: 'daily' | 'weekly' | 'monthly';
    unit_price: string;
    duration: number;
    total_price: number;
    notes: string;
    product?: Product | null;
    product_name?: string;
    product_sku?: string;
    searchQuery?: string;
    [key: string]: any;
}

interface AgreementTemplate {
    id: number;
    name: string;
    rental_category: string;
    terms_and_conditions_az: string;
    terms_and_conditions_en: string;
    damage_liability_terms_az: string;
    damage_liability_terms_en: string;
    condition_checklist: any[];
    require_photos: boolean;
    min_photos: number;
}

interface Rental {
    id: number;
    rental_number: string;
    customer: Customer;
    branch: {
        id: number;
        name: string;
    };
    rental_start_date: string;
    rental_end_date: string;
    status: string;
    payment_status: string;
    paid_amount: number;
    collateral_type: string;
    collateral_amount: number | null;
    collateral_document_type: string;
    collateral_document_number: string;
    collateral_notes: string;
    notes: string;
    internal_notes: string;
    items: Array<{
        id: number;
        product_id: number;
        product: Product;
        rental_inventory_id: number | null;
        rate_type: 'daily' | 'weekly' | 'monthly';
        unit_price: number;
        duration: number;
        total_price: number;
        notes: string;
    }>;
}

interface Props {
    rental: Rental;
    customers: Customer[];
    branches: Branch[];
    templates: {
        general: AgreementTemplate | null;
        clothing: AgreementTemplate | null;
        electronics: AgreementTemplate | null;
    };
}

export default function Edit({ rental, customers, branches, templates }: Props) {
    const { flash } = usePage<any>().props as { flash?: { success?: string; error?: string } };
    const [showFlashMessage, setShowFlashMessage] = useState(true);
    const [currentStep, setCurrentStep] = useState<'basic' | 'agreement'>('basic');
    const [rentalCategory, setRentalCategory] = useState<'general' | 'clothing' | 'electronics'>('general');
    const [agreementData, setAgreementData] = useState<any>(null);

    // Initialize form data from rental
    const initialFormData = {
        customer_id: rental.customer.id.toString(),
        branch_id: rental.branch.id.toString(),
        rental_start_date: rental.rental_start_date,
        rental_end_date: rental.rental_end_date,
        collateral_type: rental.collateral_type,
        collateral_amount: rental.collateral_amount?.toString() || '',
        collateral_document_type: rental.collateral_document_type || '',
        collateral_document_number: rental.collateral_document_number || '',
        collateral_notes: rental.collateral_notes || '',
        status: rental.status,
        payment_status: rental.payment_status,
        paid_amount: rental.paid_amount?.toString() || '',
        notes: rental.notes || '',
        internal_notes: rental.internal_notes || '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(rental.customer);

    // Initialize items from rental
    const initialItems: RentalItem[] = rental.items.map(item => ({
        product_id: item.product_id.toString(),
        rental_inventory_id: item.rental_inventory_id?.toString() || '',
        rate_type: item.rate_type,
        unit_price: item.unit_price.toString(),
        duration: item.duration,
        total_price: item.total_price,
        notes: item.notes || '',
        product: item.product,
    }));

    const [items, setItems] = useState<RentalItem[]>(initialItems);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [showCustomerResults, setShowCustomerResults] = useState(false);

    // Product search for rental items
    const { query: productSearchQuery, setQuery: setProductSearchQuery, results: productSearchResults, loading: isSearchingProducts, searchImmediate } = useSearch(formData.branch_id);
    const [showScanner, setShowScanner] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

    // Filter customers based on search term
    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            customer.phone.includes(customerSearchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
    );

    // Reset flash message visibility when flash changes
    useEffect(() => {
        if (flash?.success || flash?.error) {
            setShowFlashMessage(true);
        }
    }, [flash]);

    // Reset form function
    const resetForm = () => {
        setFormData(initialFormData);
        setItems([
            {
                product_id: '',
                rental_inventory_id: '',
                rate_type: 'daily',
                unit_price: '',
                duration: 1,
                total_price: 0,
                notes: '',
            },
        ]);
        setSelectedCustomer(null);
        setCustomerSearchTerm('');
        setErrors({});
    };

    // Auto-calculate end date based on rental items
    useEffect(() => {
        if (!formData.rental_start_date || items.length === 0) {
            return;
        }

        // Calculate maximum duration in days from all items
        const maxDurationInDays = items.reduce((max, item) => {
            let daysForItem = 0;
            if (item.duration > 0) {
                switch (item.rate_type) {
                    case 'daily':
                        daysForItem = item.duration;
                        break;
                    case 'weekly':
                        daysForItem = item.duration * 7;
                        break;
                    case 'monthly':
                        daysForItem = item.duration * 30;
                        break;
                }
            }
            return Math.max(max, daysForItem);
        }, 0);

        // Calculate end date
        if (maxDurationInDays > 0) {
            const startDate = new Date(formData.rental_start_date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + maxDurationInDays);

            const formattedEndDate = endDate.toISOString().split('T')[0];

            if (formattedEndDate !== formData.rental_end_date) {
                setFormData((prev) => ({
                    ...prev,
                    rental_end_date: formattedEndDate,
                }));
            }
        }
    }, [formData.rental_start_date, items]);

    const handleInputChange = (field: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleItemChange = (index: number, field: keyof RentalItem, value: string | number) => {
        setItems((prev) => {
            const newItems = [...prev];
            newItems[index] = {
                ...newItems[index],
                [field]: value,
            };

            // Recalculate total if unit_price or duration changed
            if (field === 'unit_price' || field === 'duration') {
                const unitPrice = field === 'unit_price' ? value as string : newItems[index].unit_price;
                const duration = field === 'duration' ? value as number : newItems[index].duration;
                newItems[index].total_price = calculateItemTotal(unitPrice, duration);
            }

            return newItems;
        });
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                product_id: '',
                rental_inventory_id: '',
                rate_type: 'daily',
                unit_price: '',
                duration: 1,
                total_price: 0,
                notes: '',
            },
        ]);
    };

    const calculateItemTotal = (unitPrice: string, duration: number): number => {
        const price = parseFloat(unitPrice) || 0;
        return price * duration;
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleProductSelect = (index: number, product: Product) => {
        setItems((prev) => {
            const newItems = [...prev];
            newItems[index] = {
                ...newItems[index],
                product_id: product.id.toString(),
                product: product,
                searchQuery: '',
            };
            return newItems;
        });
        setProductSearchQuery('');
        setActiveItemIndex(null);
    };

    const handleBarcodeScan = (code: string) => {
        if (activeItemIndex !== null && searchImmediate && formData.branch_id) {
            setProductSearchQuery(code);
            searchImmediate(code);
        }
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData((prev) => ({
            ...prev,
            customer_id: customer.id.toString(),
        }));
        setCustomerSearchTerm('');
        setShowCustomerResults(false);
    };

    const handleProceedToAgreement = () => {
        // Validate basic form first
        if (!formData.customer_id || !formData.branch_id || !formData.rental_start_date || items.length === 0) {
            alert('Zəhmət olmasa bütün tələb olunan sahələri doldurun');
            return;
        }

        // Check if all items have products selected
        const allItemsHaveProducts = items.every(item => item.product_id && item.unit_price && item.duration);
        if (!allItemsHaveProducts) {
            alert('Bütün məhsullar tam doldurulmalıdır');
            return;
        }

        setCurrentStep('agreement');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAgreementComplete = (agreementFormData: any) => {
        setAgreementData(agreementFormData);
        // Submit the complete rental with agreement
        submitRental(agreementFormData);
    };

    const handleAgreementCancel = () => {
        setCurrentStep('basic');
        setAgreementData(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submitRental = (agreementFormData: any) => {
        setProcessing(true);

        router.put(
            route('rentals.update', rental.id),
            {
                ...formData,
                items: items.map(item => ({
                    product_id: item.product_id,
                    rental_inventory_id: item.rental_inventory_id,
                    rate_type: item.rate_type,
                    unit_price: item.unit_price,
                    duration: item.duration,
                    total_price: item.total_price,
                    notes: item.notes,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    // Redirect to show page
                    router.visit(route('rentals.show', rental.id));
                },
                onError: (errors) => {
                    setErrors(errors);
                    setProcessing(false);
                    // Scroll to top to show errors
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // For edit, don't use agreement templates - submit directly
        submitRental(null);
    };


    return (
        <AuthenticatedLayout>
            <Head title={`Kirayəni Redaktə Et - ${rental.rental_number}`} />

            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Kirayəni Redaktə Et</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Kirayə nömrəsi: <span className="font-medium">{rental.rental_number}</span>
                    </p>
                </div>

                {/* Flash Messages */}
                {showFlashMessage && flash?.success && (
                    <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowFlashMessage(false)}
                                        className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                                    >
                                        <span className="sr-only">Bağla</span>
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showFlashMessage && flash?.error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowFlashMessage(false)}
                                        className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                    >
                                        <span className="sr-only">Bağla</span>
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Əsas Məlumat</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Müştəri <span className="text-red-500">*</span>
                                </label>

                                {!selectedCustomer ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={customerSearchTerm}
                                            onChange={(e) => {
                                                setCustomerSearchTerm(e.target.value);
                                                setShowCustomerResults(true);
                                            }}
                                            onFocus={() => setShowCustomerResults(true)}
                                            onBlur={() => {
                                                // Delay hiding results to allow click
                                                setTimeout(() => setShowCustomerResults(false), 200);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Müştəri adı, telefon və ya email ilə axtar..."
                                        />

                                        {/* Search Results */}
                                        {showCustomerResults && customerSearchTerm && filteredCustomers.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                {filteredCustomers.map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        onClick={() => handleCustomerSelect(customer)}
                                                        className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                                                    >
                                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                                        <div className="text-sm text-gray-500">{customer.phone}</div>
                                                        {customer.email && (
                                                            <div className="text-sm text-gray-500">{customer.email}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex-1">
                                            <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                                            <div className="text-sm text-blue-700">{selectedCustomer.phone}</div>
                                            {selectedCustomer.email && (
                                                <div className="text-sm text-blue-700">{selectedCustomer.email}</div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setFormData((prev) => ({ ...prev, customer_id: '' }));
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="hidden"
                                    value={formData.customer_id}
                                    required
                                />
                                {errors.customer_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                                )}
                            </div>

                            {/* Branch */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filial <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.branch_id}
                                    onChange={(e) => handleInputChange('branch_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Filial seçin</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.branch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                                )}
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Başlama Tarixi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.rental_start_date}
                                    onChange={(e) => handleInputChange('rental_start_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {errors.rental_start_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.rental_start_date}</p>
                                )}
                            </div>

                            {/* End Date - Auto-calculated */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bitmə Tarixi (avtomatik hesablanır)
                                </label>
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                    {formData.rental_end_date
                                        ? new Date(formData.rental_end_date).toLocaleDateString('az-AZ', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })
                                        : 'Məhsul əlavə edin'}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Kirayə məhsullarının müddətinə əsasən avtomatik hesablanır
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rental Items */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Kirayə Məhsulları</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Məhsul Əlavə Et
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-sm font-medium text-gray-700">
                                            Məhsul {index + 1}
                                        </h3>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Product Search */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Məhsul <span className="text-red-500">*</span>
                                                </label>
                                                {formData.branch_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveItemIndex(index);
                                                            setShowScanner(true);
                                                        }}
                                                        className="rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        title="Kamera ilə skan et"
                                                    >
                                                        <CameraIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {!item.product ? (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={activeItemIndex === index ? productSearchQuery : ''}
                                                        onChange={(e) => {
                                                            setActiveItemIndex(index);
                                                            setProductSearchQuery(e.target.value);
                                                        }}
                                                        onFocus={() => setActiveItemIndex(index)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                if (productSearchResults.length === 1) {
                                                                    handleProductSelect(index, productSearchResults[0]);
                                                                } else if (productSearchQuery.trim() && searchImmediate && formData.branch_id) {
                                                                    searchImmediate(productSearchQuery);
                                                                }
                                                            }
                                                        }}
                                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!formData.branch_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                        placeholder={formData.branch_id ? "Məhsul adı, kodu və ya barkod..." : "Əvvəlcə filial seçin"}
                                                        disabled={!formData.branch_id}
                                                    />
                                                    {isSearchingProducts && activeItemIndex === index && (
                                                        <div className="absolute right-3 top-2.5 text-xs text-gray-400">Axtarılır...</div>
                                                    )}

                                                    {/* Search Results */}
                                                    {productSearchResults.length > 0 && activeItemIndex === index && formData.branch_id && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                            {productSearchResults.map((product) => {
                                                                const stockQuantity = 'filtered_stock' in product ? (product as any).filtered_stock : product?.total_stock;
                                                                const hasStockIssue = product && stockQuantity !== undefined && stockQuantity <= 0 && !product.allow_negative_stock;
                                                                const isDisabled = hasStockIssue;

                                                                return (
                                                                    <div
                                                                        key={`product-${product.id}`}
                                                                        onClick={isDisabled ? undefined : () => handleProductSelect(index, product)}
                                                                        className={`p-3 border-b border-gray-100 ${
                                                                            isDisabled
                                                                                ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60'
                                                                                : 'cursor-pointer hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex justify-between items-center">
                                                                            <div>
                                                                                <span className="font-medium">{product.name}</span>
                                                                                {product.sku && (
                                                                                    <span className="ml-2 text-sm text-gray-500">({product.sku})</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="font-medium">
                                                                                    {(Math.round((Number(product.sale_price || 0)) * 100) / 100).toFixed(2)} AZN
                                                                                </div>
                                                                                {stockQuantity !== undefined && (
                                                                                    <div className={`text-sm ${hasStockIssue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                                                                        Stok: {stockQuantity || 0}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-blue-900">{item.product?.name || item.product_name || 'Silinmiş məhsul'}</div>
                                                        {(item.product?.sku || item.product_sku) && (
                                                            <div className="text-sm text-blue-700">SKU: {item.product?.sku || item.product_sku}</div>
                                                        )}
                                                        <div className="text-sm text-blue-700">
                                                            Qiymət: {(Math.round((Number(item.product?.sale_price || item.unit_price || 0)) * 100) / 100).toFixed(2)} AZN
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setItems((prev) => {
                                                                const newItems = [...prev];
                                                                newItems[index] = {
                                                                    ...newItems[index],
                                                                    product_id: '',
                                                                    product: null,
                                                                };
                                                                return newItems;
                                                            });
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            )}
                                            <input
                                                type="hidden"
                                                value={item.product_id}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Qiymət Növü <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={item.rate_type}
                                                onChange={(e) =>
                                                    handleItemChange(index, 'rate_type', e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="daily">Günlük</option>
                                                <option value="weekly">Həftəlik</option>
                                                <option value="monthly">Aylıq</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vahid Qiymət (AZN) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) =>
                                                    handleItemChange(index, 'unit_price', e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Müddət ({item.rate_type === 'daily' ? 'Gün' : item.rate_type === 'weekly' ? 'Həftə' : 'Ay'}) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.duration}
                                                onChange={(e) =>
                                                    handleItemChange(index, 'duration', parseInt(e.target.value) || 1)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cəmi (AZN)
                                            </label>
                                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-medium">
                                                {Number(item.total_price || 0).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Qeydlər
                                            </label>
                                            <textarea
                                                value={item.notes}
                                                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={2}
                                                placeholder="Məhsul haqqında qeydlər..."
                                            />
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.items && <p className="mt-2 text-sm text-red-600">{errors.items}</p>}
                    </div>

                    {/* Collateral Information */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Girov Məlumatı</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Collateral Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Girov Növü <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.collateral_type}
                                    onChange={(e) => handleInputChange('collateral_type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="deposit_cash">Nağd Depozit</option>
                                    <option value="passport">Pasport</option>
                                    <option value="id_card">Şəxsiyyət Vəsiqəsi</option>
                                    <option value="drivers_license">Sürücülük Vəsiqəsi</option>
                                    <option value="other_document">Digər Sənəd</option>
                                </select>
                                {errors.collateral_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.collateral_type}</p>
                                )}
                            </div>

                            {/* Collateral Amount - Show only if deposit_cash */}
                            {formData.collateral_type === 'deposit_cash' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Depozit Məbləği (AZN) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.collateral_amount}
                                        onChange={(e) => handleInputChange('collateral_amount', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                        required
                                    />
                                    {errors.collateral_amount && (
                                        <p className="mt-1 text-sm text-red-600">{errors.collateral_amount}</p>
                                    )}
                                </div>
                            )}

                            {/* Document Type - Show only if not deposit_cash */}
                            {formData.collateral_type !== 'deposit_cash' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sənəd Növü
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.collateral_document_type}
                                            onChange={(e) =>
                                                handleInputChange('collateral_document_type', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Sənəd növünü daxil edin"
                                        />
                                        {errors.collateral_document_type && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.collateral_document_type}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sənəd Nömrəsi
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.collateral_document_number}
                                            onChange={(e) =>
                                                handleInputChange('collateral_document_number', e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Sənəd nömrəsini daxil edin"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Collateral Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Girov Qeydləri
                                </label>
                                <textarea
                                    value={formData.collateral_notes}
                                    onChange={(e) => handleInputChange('collateral_notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Girov haqqında əlavə qeydlər..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment & Status */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Ödəniş və Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="reserved">Rezerv edilib</option>
                                    <option value="active">Aktiv</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ödəniş Statusu
                                </label>
                                <select
                                    value={formData.payment_status}
                                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="credit">Borclu</option>
                                    <option value="partial">Qismən ödənilib</option>
                                    <option value="paid">Ödənilib</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ödənilmiş Məbləğ (AZN)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.paid_amount}
                                    onChange={(e) => handleInputChange('paid_amount', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Qeydlər</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ümumi Qeydlər
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Kirayə haqqında ümumi qeydlər..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Daxili Qeydlər
                                </label>
                                <textarea
                                    value={formData.internal_notes}
                                    onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Yalnız daxili istifadə üçün qeydlər..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.visit(route('rentals.show', rental.id))}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={processing}
                        >
                            Ləğv et
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Yadda saxlanılır...' : 'Dəyişiklikləri Yadda Saxla'}
                        </button>
                    </div>
                </form>

                {/* Barcode Scanner Modal */}
                <BarcodeScanner
                    isOpen={showScanner}
                    onClose={() => {
                        setShowScanner(false);
                        setActiveItemIndex(null);
                    }}
                    onScan={handleBarcodeScan}
                />
            </div>
        </AuthenticatedLayout>
    );
}
