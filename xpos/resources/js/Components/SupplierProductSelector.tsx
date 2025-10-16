import { useState, useEffect } from 'react';
import { Product, Supplier } from '@/types';
import { router } from '@inertiajs/react';
import { BuildingOfficeIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ShoppingBagIcon } from '@heroicons/react/24/solid';

interface Props {
    suppliers: Supplier[];
    onProductSelect?: (product: Product | null) => void;
    selectedProduct?: Product | null;
    className?: string;
    placeholder?: string;
}


export default function SupplierProductSelector({
    suppliers,
    onProductSelect,
    selectedProduct,
    className = '',
    placeholder = 'Təchizatçı seçin...'
}: Props) {
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

    const fetchSupplierProducts = async (supplier: Supplier) => {
        setIsLoadingProducts(true);
        try {
            const response = await fetch(route('suppliers.products', supplier.id));
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching supplier products:', error);
            setProducts([]);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleSupplierSelect = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsSupplierDropdownOpen(false);
        setProducts([]);
        if (onProductSelect) {
            onProductSelect(null);
        }
        fetchSupplierProducts(supplier);
    };

    const handleProductSelect = (product: Product) => {
        if (onProductSelect) {
            onProductSelect(product);
        }
        setIsProductDropdownOpen(false);
    };

    const clearSelection = () => {
        setSelectedSupplier(null);
        setProducts([]);
        if (onProductSelect) {
            onProductSelect(null);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(price);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Supplier Selector */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Təchizatçı
                </label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <span className="flex items-center">
                            {selectedSupplier ? (
                                <>
                                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                                    <span className="block truncate">{selectedSupplier.name}</span>
                                </>
                            ) : (
                                <span className="block truncate text-gray-500">{placeholder}</span>
                            )}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        </span>
                    </button>

                    {selectedSupplier && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}

                    {isSupplierDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                            {suppliers.map((supplier) => (
                                <button
                                    key={supplier.id}
                                    type="button"
                                    onClick={() => handleSupplierSelect(supplier)}
                                    className="w-full text-left cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                                >
                                    <div className="flex items-center">
                                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                                        <span className="block truncate font-normal">
                                            {supplier.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Selector */}
            {selectedSupplier && (
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Məhsul
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                            disabled={isLoadingProducts}
                            className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center">
                                {isLoadingProducts ? (
                                    <span className="block truncate text-gray-500">Yüklənir...</span>
                                ) : selectedProduct ? (
                                    <>
                                        <ShoppingBagIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                                        <span className="block truncate">{selectedProduct.name}</span>
                                    </>
                                ) : (
                                    <span className="block truncate text-gray-500">
                                        {products.length > 0 ? 'Məhsul seçin...' : 'Bu təchizatçıdan məhsul yoxdur'}
                                    </span>
                                )}
                            </span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                            </span>
                        </button>

                        {isProductDropdownOpen && products.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                {products.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleProductSelect(product)}
                                        className="w-full text-left cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center min-w-0 flex-1">
                                                <ShoppingBagIcon className="w-5 h-5 text-gray-400 group-hover:text-white mr-3 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="block truncate font-normal">
                                                        {product.name}
                                                    </span>
                                                    {product.sku && (
                                                        <span className="block text-xs text-gray-500 group-hover:text-gray-200 truncate">
                                                            SKU: {product.sku}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {product.pivot && (
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <span className="text-sm font-medium">
                                                        {formatPrice(product.pivot?.supplier_price || 0)}
                                                    </span>
                                                    {product.pivot.is_preferred && (
                                                        <span className="block text-xs text-green-600 group-hover:text-green-200">
                                                            Üstünlük
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Product Details */}
            {selectedProduct && selectedProduct.pivot && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Məhsul məlumatları</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Təchizatçı qiyməti:</span>
                            <span className="ml-2 font-medium">{formatPrice(selectedProduct.pivot?.supplier_price || 0)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Çatdırılma müddəti:</span>
                            <span className="ml-2 font-medium">
                                {selectedProduct.pivot?.lead_time_days === 0 
                                    ? 'Dərhal' 
                                    : `${selectedProduct.pivot?.lead_time_days || 0} gün`
                                }
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Min. sifariş miqdarı:</span>
                            <span className="ml-2 font-medium">{selectedProduct.pivot?.minimum_order_quantity || 0}</span>
                        </div>
                        {selectedProduct.pivot?.supplier_sku && (
                            <div>
                                <span className="text-gray-500">Təchizatçı SKU:</span>
                                <span className="ml-2 font-medium">{selectedProduct.pivot?.supplier_sku}</span>
                            </div>
                        )}
                        {(selectedProduct.pivot?.discount_percentage || 0) > 0 && (
                            <div>
                                <span className="text-gray-500">Endirim:</span>
                                <span className="ml-2 font-medium text-green-600">
                                    {selectedProduct.pivot?.discount_percentage || 0}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}