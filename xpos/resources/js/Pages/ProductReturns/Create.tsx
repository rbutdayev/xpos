import { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Supplier, Warehouse } from '@/types';
import useProductReturnForm from './Hooks/useProductReturnForm';
import { TrashIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

interface ProductWithStock {
    id: number;
    name: string;
    barcode?: string;
    unit_price?: number;
    packaging_price?: number;
    packaging_size?: string;
    base_unit?: string;
    packaging_quantity?: number;
    available_quantity: number;
}

interface Props {
    suppliers: Supplier[];
    warehouses: Warehouse[];
}

export default function Create({ suppliers, warehouses }: Props) {
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<ProductWithStock[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [waitingForResults, setWaitingForResults] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { form, submit, addItem, removeItem, updateItem } = useProductReturnForm();

    const fetchProducts = async () => {
        if (!form.data.supplier_id || !form.data.warehouse_id) {
            setProducts([]);
            return;
        }

        setLoadingProducts(true);
        try {
            const response = await fetch(route('product-returns.products-by-supplier'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    supplier_id: form.data.supplier_id,
                    warehouse_id: form.data.warehouse_id,
                }),
            });

            if (response.ok) {
                const productsData = await response.json();
                console.log('Fetched products:', productsData);
                setProducts(productsData);
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch products:', response.status, errorText);
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [form.data.supplier_id, form.data.warehouse_id]);

    // Filter products based on search query
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
            setShowDropdown(true);
        } else {
            setFilteredProducts([]);
            setShowDropdown(false);
        }
    }, [searchQuery, products]);

    // Auto-select when results arrive after Enter or paste (barcode scan)
    useEffect(() => {
        if (waitingForResults && !loadingProducts && filteredProducts.length === 1) {
            handleProductSelect(filteredProducts[0]);
            setWaitingForResults(false);
        }
    }, [waitingForResults, loadingProducts, filteredProducts]);

    const handleProductSelect = (product: ProductWithStock) => {
        addItem(product);
        setSearchQuery('');
        setShowDropdown(false);
        // Focus back on search input for next scan
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    const calculateItemTotal = (item: any) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitCost = parseFloat(item.unit_cost) || 0;
        return quantity * unitCost;
    };

    const calculateGrandTotal = () => {
        return form.data.items.reduce((total, item) => {
            return total + calculateItemTotal(item);
        }, 0);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Məhsul İadəsi" />

            <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold leading-7 text-gray-900">
                            Məhsul Qaytarması
                        </h2>
                        <p className="mt-1 text-sm sm:text-base text-gray-500">
                            Təchizatçıya qaytarma (çoxlu məhsul)
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            {/* Supplier */}
                            <div>
                                <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">
                                    Təchizatçı *
                                </label>
                                <select
                                    id="supplier_id"
                                    value={form.data.supplier_id}
                                    onChange={(e) => (form.setData as any)('supplier_id', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Təchizatçı seçin</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Warehouse */}
                            <div>
                                <label htmlFor="warehouse_id" className="block text-sm font-medium text-gray-700">
                                    Anbar *
                                </label>
                                <select
                                    id="warehouse_id"
                                    value={form.data.warehouse_id}
                                    onChange={(e) => (form.setData as any)('warehouse_id', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Anbar seçin</option>
                                    {warehouses.map((warehouse) => (
                                        <option key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Return Date */}
                            <div>
                                <label htmlFor="return_date" className="block text-sm font-medium text-gray-700">
                                    Qaytarma tarixi *
                                </label>
                                <input
                                    type="date"
                                    id="return_date"
                                    value={form.data.return_date}
                                    onChange={(e) => (form.setData as any)('return_date', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Product Search Section */}
                        {form.data.supplier_id && form.data.warehouse_id && (
                            <div className="border-t pt-6">
                                <InputLabel htmlFor="product_search" value="Məhsul *" />
                                <div className="relative">
                                    <TextInput
                                        ref={searchInputRef}
                                        id="product_search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onPaste={(e) => {
                                            // When barcode is pasted/scanned, wait for results to auto-select
                                            const pastedText = e.clipboardData.getData('text');
                                            if (pastedText.trim()) {
                                                setWaitingForResults(true);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // Prevent Enter key from submitting the form when scanning barcodes
                                            if (e.key === 'Enter') {
                                                e.preventDefault();

                                                // If already have 1 result, select it immediately
                                                if (filteredProducts.length === 1) {
                                                    handleProductSelect(filteredProducts[0]);
                                                } else if (searchQuery.trim()) {
                                                    // Otherwise wait for results to load
                                                    setWaitingForResults(true);
                                                }
                                            }
                                        }}
                                        className="mt-2 block w-full"
                                        placeholder="Məhsul adı və ya barkod ilə axtar (scan barcode)..."
                                        disabled={loadingProducts}
                                    />
                                    {loadingProducts && (
                                        <div className="absolute right-3 top-12 text-xs text-gray-400">Axtarılır...</div>
                                    )}

                                    {/* Search Results */}
                                    {showDropdown && searchQuery.length >= 2 && filteredProducts.length > 0 && (
                                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                            {filteredProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleProductSelect(product)}
                                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{product.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {product.barcode && `Barkod: ${product.barcode}`}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-600">
                                                                Mövcud: {product.available_quantity} {product.base_unit}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* No Results */}
                                    {searchQuery.length >= 2 && !loadingProducts && filteredProducts.length === 0 && (
                                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                            <div className="p-3 text-gray-500 text-sm">
                                                "{searchQuery}" üzrə heç bir məhsul tapılmadı
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Items List */}
                        {form.data.items.length > 0 && (
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Qaytarılacaq məhsullar ({form.data.items.length})
                                </h3>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {form.data.items.map((item, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{item.product?.name}</h4>
                                                    <p className="text-sm text-gray-500">{item.product?.barcode}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Mövcud: {item.product?.available_quantity} {item.product?.base_unit}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {/* Quantity */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Miqdar *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        min="0.001"
                                                        max={item.product?.available_quantity || undefined}
                                                        required
                                                    />
                                                    {parseFloat(item.quantity) > (item.product?.available_quantity || 0) && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            Miqdar stokdan çoxdur
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Unit */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Vahid *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        required
                                                    />
                                                </div>

                                                {/* Unit Cost */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Vahid qiyməti *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.unit_cost}
                                                        onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        min="0"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Item Total */}
                                            <div className="mt-3 text-right">
                                                <span className="text-sm text-gray-700">Cəm: </span>
                                                <span className="text-lg font-semibold text-gray-900">
                                                    {calculateItemTotal(item).toFixed(2)} ₼
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Grand Total */}
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-900">Ümumi məbləğ:</span>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {calculateGrandTotal().toFixed(2)} ₼
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="border-t pt-6">
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                                Qaytarma səbəbi *
                            </label>
                            <textarea
                                id="reason"
                                rows={4}
                                value={form.data.reason}
                                onChange={(e) => (form.setData as any)('reason', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Məhsulların qaytarılma səbəbini qeyd edin..."
                                maxLength={1000}
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                {(form.data.reason || '').length}/1000 simvol
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center justify-center"
                            >
                                Ləğv et
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing || form.data.items.length === 0}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center disabled:opacity-50"
                            >
                                {form.processing ? 'Yadda saxlanır...' : 'Qaytarma yarat'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
