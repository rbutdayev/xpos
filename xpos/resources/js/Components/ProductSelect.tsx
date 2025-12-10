import { Product } from '@/types';
import { MagnifyingGlassIcon, CubeIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatQuantityWithUnit } from '@/utils/formatters';
import axios from 'axios';

interface Props {
    products?: Product[]; // Made optional for backward compatibility
    value: string;
    onChange: (productId: string, product?: Product) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    showSearch?: boolean;
    showStock?: boolean;
    onlyInStock?: boolean;
    useAjaxSearch?: boolean; // New prop to enable AJAX search
}

export default function ProductSelect({
    products = [],
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    className = "",
    showSearch = true,
    showStock = true,
    onlyInStock = false,
    useAjaxSearch = false
}: Props) {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('productSelect.placeholder');
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState(products);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedProduct = useAjaxSearch 
        ? filteredProducts.find(product => product.id.toString() === value)
        : products.find(product => product.id.toString() === value);

    useEffect(() => {
        if (useAjaxSearch) {
            // AJAX search mode
            if (!search.trim()) {
                setFilteredProducts([]);
                return;
            }

            if (search.length < 2) {
                return; // Don't search for single characters
            }

            setIsSearching(true);
            
            const timeoutId = setTimeout(async () => {
                try {
                    const response = await axios.get(`/products/search?q=${encodeURIComponent(search)}`, {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        }
                    });
                    
                    const data = response.data;
                    
                    // Backend now provides total_stock via accessor, no need to manually calculate
                    const productsWithStock = data.map((product: any) => ({
                        ...product,
                        // Ensure total_stock is a number (backend should provide this)
                        total_stock: Number(product.total_stock) || 0
                    }));
                    
                    // Filter by stock if required
                    const finalProducts = onlyInStock 
                        ? productsWithStock.filter((product: any) => (product.total_stock || 0) > 0)
                        : productsWithStock;
                        
                    setFilteredProducts(finalProducts);
                    setIsSearching(false);
                } catch (error) {
                    console.error('Search error:', error);
                    setFilteredProducts([]);
                    setIsSearching(false);
                }
            }, 300); // 300ms debounce

            return () => {
                clearTimeout(timeoutId);
                setIsSearching(false);
            };
        } else {
            // Local search mode (backward compatibility)
            let productsToFilter = products;

            // Filter by stock if required
            if (onlyInStock) {
                productsToFilter = products.filter(product => 
                    (product.total_stock || 0) > 0
                );
            }

            if (search.trim() === '') {
                setFilteredProducts(productsToFilter);
            } else {
                const filtered = productsToFilter.filter(product =>
                    product.name.toLowerCase().includes(search.toLowerCase()) ||
                    product.sku.toLowerCase().includes(search.toLowerCase()) ||
                    product.barcode?.toLowerCase().includes(search.toLowerCase()) ||
                    product.category?.name.toLowerCase().includes(search.toLowerCase())
                );
                setFilteredProducts(filtered);
            }
        }
    }, [search, products, onlyInStock, useAjaxSearch]);

    // Separate useEffect for opening dropdown during AJAX search
    useEffect(() => {
        if (useAjaxSearch && search.length >= 2 && !isOpen) {
            setIsOpen(true);
        }
    }, [search, useAjaxSearch, isOpen]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen && showSearch) {
                setTimeout(() => searchRef.current?.focus(), 100);
            }
        }
    };

    const handleSelect = (product: Product) => {
        onChange(product.id.toString(), product);
        setIsOpen(false);
        setSearch('');
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
        setSearch('');
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getStockStatus = (product: Product) => {
        const stock = product.total_stock || 0;
        const minLevel = product.min_level || 0;

        if (stock <= 0) {
            return { text: t('productSelect.outOfStock'), color: 'text-red-600' };
        } else if (stock <= minLevel) {
            return { text: t('productSelect.lowStock'), color: 'text-yellow-600' };
        } else {
            return { text: t('productSelect.inStock'), color: 'text-green-600' };
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${
                    disabled ? 'bg-gray-50 text-gray-500' : ''
                }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="flex items-center">
                    <CubeIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <span className="ml-3 block truncate">
                        {selectedProduct ? (
                            <span>
                                <span className="font-medium">{selectedProduct.name}</span>
                                <span className="text-gray-500 ml-2">({selectedProduct.sku})</span>
                                {showStock && selectedProduct.sale_price && (
                                    <span className="text-green-600 ml-2">
                                        {formatPrice(selectedProduct.sale_price)} AZN
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className="text-gray-500">{defaultPlaceholder}</span>
                        )}
                    </span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {showSearch && (
                        <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
                            <div className="relative">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    className="w-full rounded-md border-gray-300 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder={t('productSelect.searchPlaceholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        // Prevent Enter key from submitting the form when scanning barcodes
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            
                                            // If there's exactly one search result, select it automatically
                                            if (filteredProducts.length === 1) {
                                                handleSelect(filteredProducts[0]);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Clear option */}
                    {!required && (
                        <div
                            className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
                            onClick={handleClear}
                        >
                            <span className="font-normal block truncate text-gray-500 italic">
                                {t('productSelect.noProduct')}
                            </span>
                        </div>
                    )}

                    {isSearching ? (
                        <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900">
                            <span className="font-normal block truncate text-gray-500">
                                {t('messages.searching')}
                            </span>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900">
                            <span className="font-normal block truncate text-gray-500">
                                {useAjaxSearch && search.length < 2 ?
                                    t('productSelect.minChars') :
                                    onlyInStock ?
                                        t('productSelect.noStockProducts') :
                                        t('productSelect.notFound')
                                }
                            </span>
                        </div>
                    ) : (
                        filteredProducts.map((product) => {
                            const stockStatus = getStockStatus(product);
                            return (
                                <div
                                    key={product.id}
                                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                        product.id.toString() === value
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-900 hover:bg-indigo-600 hover:text-white'
                                    }`}
                                    onClick={() => handleSelect(product)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`block truncate ${
                                                product.id.toString() === value ? 'font-semibold' : 'font-normal'
                                            }`}>
                                                {product.name}
                                                {product.packaging_size && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                                        {product.packaging_size}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block truncate text-xs opacity-75">
                                                SKU: {product.sku}
                                                {product.category && (
                                                    <span className="ml-2">• {product.category.name}</span>
                                                )}
                                                {product.barcode && (
                                                    <span className="ml-2">• {product.barcode}</span>
                                                )}
                                            </span>
                                            {showStock && (
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className={`text-xs ${
                                                        product.id.toString() === value ? 'text-white opacity-75' : stockStatus.color
                                                    }`}>
                                                         {formatQuantityWithUnit(product.total_stock || 0, product.unit)} • {stockStatus.text}
                                                    </span>
                                                    {product.sale_price && (
                                                        <span className={`text-xs font-medium ${
                                                            product.id.toString() === value ? 'text-white' : 'text-green-600'
                                                        }`}>
                                                            {formatPrice(product.sale_price)} AZN
                                                            {product.packaging_quantity && product.packaging_quantity > 0 && (
                                                                <span className="block text-xs opacity-75">
                                                                    {formatPrice(product.sale_price / product.packaging_quantity)} AZN/{product.base_unit || product.unit}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {product.id.toString() === value && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}