import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Supplier, Warehouse, Employee } from '@/types';
import MultiUnitPricing from '@/Components/MultiUnitPricing';

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
    const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
    const [selectedUnit, setSelectedUnit] = useState('');
    
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: '',
        product_id: '',
        warehouse_id: '',
        quantity: '',
        unit_cost: '',
        return_date: new Date().toISOString().split('T')[0],
        reason: '',
        selling_unit: '',
    });

    const fetchProducts = async () => {
        if (!data.supplier_id || !data.warehouse_id) {
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
                    supplier_id: data.supplier_id,
                    warehouse_id: data.warehouse_id,
                }),
            });
            
            if (response.ok) {
                const productsData = await response.json();
                setProducts(productsData);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // Reset product selection when supplier or warehouse changes
        setData('product_id', '');
        setSelectedProduct(null);
    }, [data.supplier_id, data.warehouse_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('product-returns.store'));
    };

    const handleProductChange = (productId: string) => {
        setData('product_id', productId);
        const product = products.find(p => p.id.toString() === productId);
        setSelectedProduct(product || null);
        
        if (product) {
            // Default olaraq base unit seç
            const defaultUnit = product.base_unit || 'L';
            setSelectedUnit(defaultUnit);
            setData('selling_unit', defaultUnit);
            setData('unit_cost', product.unit_price?.toString() || '0');
        } else {
            setSelectedUnit('');
            setData('selling_unit', '');
            setData('unit_cost', '0');
        }
    };

    const handlePriceChange = (pricingInfo: any) => {
        setData('unit_cost', pricingInfo.unitPrice.toString());
    };

    const handleUnitChange = (unit: string) => {
        setSelectedUnit(unit);
        setData('selling_unit', unit);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Məhsul İadəsi" />

            <div className="mx-auto py-6 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Məhsul İadəsi
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Təchizatçıya iadə
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            {/* Supplier */}
                            <div>
                                <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">
                                    Təchizatçı *
                                </label>
                                <select
                                    id="supplier_id"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
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
                                {errors.supplier_id && (
                                    <p className="mt-2 text-sm text-red-600">{errors.supplier_id}</p>
                                )}
                            </div>

                            {/* Product */}
                            <div>
                                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                                    Məhsul *
                                </label>
                                <select
                                    id="product_id"
                                    value={data.product_id}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    disabled={loadingProducts || !data.supplier_id || !data.warehouse_id}
                                    required
                                >
                                    <option value="">
                                        {loadingProducts ? 'Məhsullar yüklənir...' : 
                                         !data.supplier_id || !data.warehouse_id ? 'Əvvəlcə təchizatçı və anbar seçin' : 
                                         products.length === 0 ? 'Bu təchizatçıdan məhsul yoxdur' : 
                                         'Məhsul seçin'}
                                    </option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - {product.barcode} (Anbarda: {product.available_quantity})
                                        </option>
                                    ))}
                                </select>
                                {errors.product_id && (
                                    <p className="mt-2 text-sm text-red-600">{errors.product_id}</p>
                                )}
                            </div>

                            {/* Warehouse */}
                            <div>
                                <label htmlFor="warehouse_id" className="block text-sm font-medium text-gray-700">
                                    Anbar *
                                </label>
                                <select
                                    id="warehouse_id"
                                    value={data.warehouse_id}
                                    onChange={(e) => setData('warehouse_id', e.target.value)}
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
                                {errors.warehouse_id && (
                                    <p className="mt-2 text-sm text-red-600">{errors.warehouse_id}</p>
                                )}
                            </div>

                            {/* Quantity */}
                            <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                    Miqdar *
                                    {selectedProduct && (
                                        <span className="text-sm text-gray-500 ml-2">
                                            (Maksimum miqdar: {selectedProduct.available_quantity})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    id="quantity"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    min="0.001"
                                    max={selectedProduct?.available_quantity || undefined}
                                    disabled={!selectedProduct}
                                    required
                                />
                                {errors.quantity && (
                                    <p className="mt-2 text-sm text-red-600">{errors.quantity}</p>
                                )}
                                {selectedProduct && parseFloat(data.quantity) > selectedProduct.available_quantity && (
                                    <p className="mt-1 text-sm text-red-600">
                                        Miqdar mövcud miqdarı aşır ({selectedProduct.available_quantity})
                                    </p>
                                )}
                            </div>

                            {/* Multi-Unit Pricing */}
                            {selectedProduct && (
                                <div className="col-span-2">
                                    <MultiUnitPricing
                                        product={selectedProduct}
                                        quantity={parseFloat(data.quantity) || 0}
                                        selectedUnit={selectedUnit}
                                        onPriceChange={handlePriceChange}
                                        onUnitChange={handleUnitChange}
                                        showUnitSelector={true}
                                    />
                                </div>
                            )}

                            {/* Return Date */}
                            <div>
                                <label htmlFor="return_date" className="block text-sm font-medium text-gray-700">
                                    İadə tarixi *
                                </label>
                                <input
                                    type="date"
                                    id="return_date"
                                    value={data.return_date}
                                    onChange={(e) => setData('return_date', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                />
                                {errors.return_date && (
                                    <p className="mt-2 text-sm text-red-600">{errors.return_date}</p>
                                )}
                            </div>


                        </div>

                        {/* Reason */}
                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                                Qaytarma səbəbi *
                            </label>
                            <textarea
                                id="reason"
                                rows={4}
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Məhsulun qaytarılma səbəbini qeyd edin..."
                                maxLength={1000}
                                required
                            />
                            {errors.reason && (
                                <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                {data.reason.length}/1000 simvol
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                            >
                                Ləğv et
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
                            >
                                {processing ? 'Yadda saxlanır...' : 'Qaytarma yarat'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}