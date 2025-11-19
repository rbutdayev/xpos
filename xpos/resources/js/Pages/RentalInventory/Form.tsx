import { useState, FormEventHandler, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import {
    CubeIcon,
    ArrowLeftIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Category {
    value: string;
    label: string;
    label_en?: string;
    color?: string;
}

interface RentalInventoryItem {
    id?: number;
    product_id: number;
    branch_id: number;
    barcode: string;
    serial_number: string;
    rental_category: string;
    daily_rate: number | null;
    weekly_rate: number | null;
    monthly_rate: number | null;
    purchase_price: number | null;
    replacement_cost: number | null;
    condition_notes: string;
    notes: string;
    status: string;
    is_active: boolean;
    product?: Product;
}

interface Props {
    inventoryItem?: RentalInventoryItem;
    products?: Product[];
    branches: Branch[];
    categories: Category[];
}

export default function Form({ inventoryItem, products = [], branches, categories }: Props) {
    const isEditing = !!inventoryItem;
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const formData: any = {
        product_id: inventoryItem?.product_id || '',
        branch_id: inventoryItem?.branch_id || '',
        barcode: inventoryItem?.barcode || '',
        serial_number: inventoryItem?.serial_number || '',
        rental_category: inventoryItem?.rental_category || (categories.length > 0 ? categories[0].value : ''),
        daily_rate: inventoryItem?.daily_rate || null,
        weekly_rate: inventoryItem?.weekly_rate || null,
        monthly_rate: inventoryItem?.monthly_rate || null,
        purchase_price: inventoryItem?.purchase_price || null,
        replacement_cost: inventoryItem?.replacement_cost || null,
        condition_notes: inventoryItem?.condition_notes || '',
        notes: inventoryItem?.notes || '',
        status: inventoryItem?.status || 'available',
        is_active: inventoryItem?.is_active ?? true,
    };

    const { data, setData: setDataOriginal, post, put, processing, errors } = useForm(formData);
    const setData = setDataOriginal as any;
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Search products via API
    useEffect(() => {
        const searchProducts = async () => {
            if (searchTerm.length < 2) {
                setFilteredProducts([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await axios.get('/products/search', {
                    params: {
                        q: searchTerm,
                    }
                });
                // The search endpoint returns an array of products directly
                const products = Array.isArray(response.data) ? response.data : [];
                setFilteredProducts(products);
            } catch (error) {
                console.error('Error searching products:', error);
                setFilteredProducts([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchProducts, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Initialize selected product when editing
    useEffect(() => {
        if (isEditing && inventoryItem?.product) {
            setSelectedProduct(inventoryItem.product);
        }
    }, [isEditing]);

    // Auto-populate barcode when product is selected
    useEffect(() => {
        if (data.product_id && !isEditing) {
            const product = filteredProducts.find(p => p.id === data.product_id);
            if (product) {
                setSelectedProduct(product);
                // Auto-populate barcode from product if available and not manually entered
                if (product.barcode && !data.barcode) {
                    setData('barcode', product.barcode);
                }
            }
        }
    }, [data.product_id, filteredProducts]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setSubmitError(null); // Clear any previous errors

        console.log('Submitting form with data:', data);
        
        // Validate that a product is selected for new inventory
        if (!isEditing && !data.product_id) {
            alert('Zəhmət olmasa məhsul seçin');
            return;
        }

        // Validate that a branch is selected
        if (!data.branch_id) {
            alert('Zəhmət olmasa filial seçin');
            return;
        }

        // Validate that a category is selected
        if (!data.rental_category) {
            alert('Zəhmət olmasa kateqoriya seçin');
            return;
        }

        if (isEditing && inventoryItem) {
            put(`/rental-inventory/${inventoryItem.id}`, {
                onSuccess: () => {
                    console.log('Form updated successfully');
                    // Redirect to inventory list after successful update
                    router.get('/rental-inventory');
                },
                onError: (errors) => {
                    console.error('Form update errors:', errors);
                    
                    // Handle different error types for updates too
                    if (errors.general) {
                        alert(`Xəta: ${errors.general}`);
                    } else if (Object.keys(errors).length > 0) {
                        const errorMessages = Object.entries(errors)
                            .map(([field, message]) => `${field}: ${message}`)
                            .join('\n');
                        alert(`Validasiya xətaları:\n${errorMessages}`);
                    } else {
                        alert('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
                    }
                }
            });
        } else {
            post('/rental-inventory', {
                onError: (errors) => {
                    console.error('Form submission errors:', errors);
                    
                    // Handle different error types
                    let errorMessage = '';
                    if (errors.general) {
                        // General application error (like database constraints)
                        errorMessage = errors.general;
                    } else if (Object.keys(errors).length > 0) {
                        // Validation errors
                        const errorMessages = Object.entries(errors)
                            .map(([field, message]) => `${field}: ${message}`)
                            .join(', ');
                        errorMessage = `Validasiya xətaları: ${errorMessages}`;
                    } else {
                        // Fallback for unknown errors
                        errorMessage = 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
                    }
                    
                    setSubmitError(errorMessage);
                    alert(`Xəta: ${errorMessage}`); // Still show alert for immediate attention
                },
                onSuccess: () => {
                    console.log('Form submitted successfully');
                    setSubmitError(null); // Clear any errors on success
                    // Redirect to inventory list after successful creation
                    router.get('/rental-inventory');
                }
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEditing ? 'İnventarı Düzəlt' : 'Yeni İnventar'} />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.get('/rental-inventory')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Geri
                    </button>
                    <div className="flex items-center">
                        <CubeIcon className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'İnventarı Düzəlt' : 'Yeni İnventar'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Kirayə üçün fərdi məhsul elementini qeyd edin
                            </p>
                        </div>
                    </div>
                </div>

                {/* Display validation errors */}
                {(Object.keys(errors).length > 0 || submitError) && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                        <div className="font-semibold mb-1">Xətalar:</div>
                        <ul className="list-disc pl-5">
                            {submitError && (
                                <li>{submitError}</li>
                            )}
                            {Object.entries(errors).map(([field, message]) => (
                                <li key={field}><strong>{field}:</strong> {message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Əsas Məlumat
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Məhsul <span className="text-red-500">*</span>
                                </label>

                                {/* Show selected product or search input */}
                                {selectedProduct ? (
                                    <div className="mb-2">
                                        <div className={`p-3 border rounded ${isEditing ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <strong className="text-sm text-gray-900">{selectedProduct.name}</strong>
                                                    {selectedProduct.sku && (
                                                        <span className="ml-2 text-xs text-gray-600">SKU: {selectedProduct.sku}</span>
                                                    )}
                                                    {selectedProduct.barcode && (
                                                        <div className="text-xs text-gray-600 mt-1">Barkod: {selectedProduct.barcode}</div>
                                                    )}
                                                </div>
                                                {!isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedProduct(null);
                                                            setData('product_id', '');
                                                            setData('barcode', '');
                                                            setSearchTerm('');
                                                        }}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Dəyiş
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Axtarış üçün ən azı 2 hərf daxil edin..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-2"
                                        />
                                        {isSearching && (
                                            <p className="text-xs text-gray-500 mb-2">Axtarılır...</p>
                                        )}
                                        {searchTerm.length >= 2 && filteredProducts.length > 0 && (
                                            <select
                                                value={data.product_id}
                                                onChange={(e) => {
                                                    const productId = parseInt(e.target.value);
                                                    setData('product_id', productId);
                                                    const product = filteredProducts.find(p => p.id === productId);
                                                    if (product) {
                                                        setSelectedProduct(product);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                size={Math.min(filteredProducts.length + 1, 8)}
                                            >
                                                <option value="">Məhsul seçin</option>
                                                {filteredProducts.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} {product.sku ? `(${product.sku})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {searchTerm.length >= 2 && !isSearching && filteredProducts.length === 0 && (
                                            <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                                                Heç bir məhsul tapılmadı
                                            </p>
                                        )}
                                    </>
                                )}

                                {errors.product_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    {isEditing
                                        ? 'Məhsul düzəliş zamanı dəyişdirilə bilməz'
                                        : 'Bu inventar elementi hansı məhsulu təmsil edir'}
                                </p>
                            </div>

                            {/* Branch Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filial <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', parseInt(e.target.value))}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                    required
                                    disabled={isEditing}
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
                                {isEditing && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Filial düzəliş zamanı dəyişdirilə bilməz
                                    </p>
                                )}
                            </div>

                            {/* Barcode - Read-only, auto-populated from product */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Barkod
                                </label>
                                <input
                                    type="text"
                                    value={data.barcode}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                                    placeholder="Məhsuldan avtomatik alınacaq"
                                />
                                {errors.barcode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Məhsulun barkodu avtomatik olaraq istifadə olunacaq
                                </p>
                            </div>

                            {/* Serial Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seriya Nömrəsi
                                </label>
                                <input
                                    type="text"
                                    value={data.serial_number}
                                    onChange={(e) => setData('serial_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Məs: SN123456789"
                                />
                                {errors.serial_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    İstehsalçının seriya nömrəsi (elektronika, mebel üçün)
                                </p>
                            </div>

                            {/* Rental Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kateqoriya <span className="text-red-500">*</span>
                                </label>
                                {categories.length > 0 ? (
                                    <>
                                        <select
                                            value={data.rental_category}
                                            onChange={(e) => setData('rental_category', e.target.value)}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                            required
                                            disabled={isEditing}
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                        {isEditing && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Kateqoriya düzəliş zamanı dəyişdirilə bilməz
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md border border-red-200">
                                        Heç bir icarə kateqoriyası tapılmadı. Zəhmət olmasa əvvəlcə{' '}
                                        <a href="/rental-categories" className="font-medium underline hover:text-red-800">
                                            icarə kateqoriyası yaradın
                                        </a>
                                        .
                                    </div>
                                )}
                                {errors.rental_category && (
                                    <p className="mt-1 text-sm text-red-600">{errors.rental_category}</p>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="available">Mövcud</option>
                                        <option value="rented">Kirayədə</option>
                                        <option value="maintenance">Təmirdə</option>
                                        <option value="damaged">Zədəli</option>
                                        <option value="retired">İstifadədən çıxarılıb</option>
                                    </select>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center pt-8">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                        Aktiv
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Information */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Qiymət Məlumatı
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Günlük Tarif (AZN)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.daily_rate || ''}
                                    onChange={(e) => setData('daily_rate', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                                {errors.daily_rate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.daily_rate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Həftəlik Tarif (AZN)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.weekly_rate || ''}
                                    onChange={(e) => setData('weekly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                                {errors.weekly_rate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.weekly_rate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Aylıq Tarif (AZN)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.monthly_rate || ''}
                                    onChange={(e) => setData('monthly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                                {errors.monthly_rate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.monthly_rate}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alış Qiyməti (AZN)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.purchase_price || ''}
                                    onChange={(e) => setData('purchase_price', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                                {errors.purchase_price && (
                                    <p className="mt-1 text-sm text-red-600">{errors.purchase_price}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Bu elementi almaq üçün ödədiyiniz məbləğ
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Əvəzləmə Dəyəri (AZN)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.replacement_cost || ''}
                                    onChange={(e) => setData('replacement_cost', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                                {errors.replacement_cost && (
                                    <p className="mt-1 text-sm text-red-600">{errors.replacement_cost}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    İtki və ya tam zərər halında müştərinin ödəməli olduğu məbləğ
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Condition & Notes */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Vəziyyət və Qeydlər
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vəziyyət Qeydləri
                                </label>
                                <textarea
                                    value={data.condition_notes}
                                    onChange={(e) => setData('condition_notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Məhsulun cari vəziyyəti haqqında qeydlər (cızıqlar, ləkələr, defektlər və s.)"
                                />
                                {errors.condition_notes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.condition_notes}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ümumi Qeydlər
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Texniki baxış tarixçəsi, təmir qeydləri və digər məlumatlar"
                                />
                                {errors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => router.get('/rental-inventory')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                            <XMarkIcon className="w-4 h-4 mr-2" />
                            Ləğv Et
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center disabled:opacity-50"
                        >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            {processing ? 'Saxlanılır...' : 'Saxla'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
