import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    price?: number;
}

interface SearchableProductSelectProps {
    products: Product[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    className?: string;
    showPrice?: boolean;
    showBarcode?: boolean;
    serviceType?: string; // Filter products by service type
}

export default function SearchableProductSelect({
    products,
    value,
    onChange,
    placeholder = "Məhsul seçin",
    error,
    required = false,
    className = "",
    showPrice = false,
    showBarcode = true,
    serviceType
}: SearchableProductSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState(products);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProductCache, setSelectedProductCache] = useState<Product | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find selected product - check cache first, then products, then filteredProducts
    const selectedProduct = selectedProductCache?.id.toString() === value.toString()
        ? selectedProductCache
        : products.find(p => p.id.toString() === value.toString()) ||
          filteredProducts.find(p => p.id.toString() === value.toString());

    // Only show searchable dropdown if there are more than 20 products
    const shouldUseSearchable = products.length > 20;

    // Sync selectedProduct to cache when it changes
    useEffect(() => {
        if (selectedProduct && selectedProduct.id.toString() === value.toString()) {
            setSelectedProductCache(selectedProduct);
        } else if (!value) {
            setSelectedProductCache(null);
        }
    }, [selectedProduct, value]);

    // Filter products based on search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredProducts(products);
            return;
        }

        // For searchable mode (>20 products), use API
        if (shouldUseSearchable) {
            setIsSearching(true);

            const timer = setTimeout(() => {
                const params: any = { q: searchTerm };
                if (serviceType) {
                    params.service_type = serviceType;
                }

                window.axios.get(route('products.search'), { params })
                .then(response => {
                    setFilteredProducts(response.data);
                })
                .catch(error => {
                    console.error('Product search error:', error);
                    // Fallback to client-side filtering on error
                    const filtered = products.filter(product => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                            product.name.toLowerCase().includes(searchLower) ||
                            product.sku.toLowerCase().includes(searchLower) ||
                            (product.barcode && product.barcode.toLowerCase().includes(searchLower))
                        );
                    });
                    setFilteredProducts(filtered);
                })
                .finally(() => {
                    setIsSearching(false);
                });
            }, 300); // Debounce for 300ms

            return () => clearTimeout(timer);
        } else {
            // For non-searchable mode (<=20 products), use client-side filtering
            const filtered = products.filter(product => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    product.name.toLowerCase().includes(searchLower) ||
                    product.sku.toLowerCase().includes(searchLower) ||
                    (product.barcode && product.barcode.toLowerCase().includes(searchLower))
                );
            });
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products, shouldUseSearchable]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (product: Product) => {
        onChange(product.id);
        setSelectedProductCache(product); // Cache the selected product
        setIsOpen(false);
        setSearchTerm('');
    };

    const formatProductDisplay = (product: Product) => {
        let display = `${product.name} (${product.sku})`;
        if (showBarcode && product.barcode) {
            display += ` [${product.barcode}]`;
        }
        if (showPrice && product.price) {
            display += ` - ${product.price} AZN`;
        }
        return display;
    };

    if (!shouldUseSearchable) {
        return (
            <div className={className}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                        error ? 'border-red-300' : ''
                    }`}
                    required={required}
                >
                    <option value="">{placeholder}</option>
                    {products.map(product => (
                        <option key={product.id} value={product.id}>
                            {formatProductDisplay(product)}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Selected value display / Search input */}
            <div className="relative">
                {isOpen ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onPaste={(e) => {
                            // When barcode is pasted, auto-select if single result
                            const pastedText = e.clipboardData.getData('text');
                            if (pastedText.trim()) {
                                // Small delay to let the search results load
                                setTimeout(() => {
                                    if (filteredProducts.length === 1) {
                                        handleSelect(filteredProducts[0]);
                                    }
                                }, 300);
                            }
                        }}
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
                        placeholder="Məhsul axtar..."
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 pr-10 ${
                            error ? 'border-red-300' : ''
                        }`}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className={`w-full text-left rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-2 pr-10 ${
                            error ? 'border-red-300' : ''
                        } ${!selectedProduct ? 'text-gray-500' : 'text-gray-900'}`}
                    >
                        {selectedProduct ? formatProductDisplay(selectedProduct) : placeholder}
                    </button>
                )}
                
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-0 top-0 h-full px-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                    <ChevronUpDownIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {isSearching ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            Axtarılır...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            {searchTerm ? 'Heç bir məhsul tapılmadı' : 'Məhsul yoxdur'}
                        </div>
                    ) : (
                        <>
                            {/* Clear selection option */}
                            {!required && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('');
                                        setSelectedProductCache(null); // Clear cache
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-500 text-sm border-b border-gray-100"
                                >
                                    {placeholder}
                                </button>
                            )}
                            
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => handleSelect(product)}
                                    className={`w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${
                                        selectedProduct?.id === product.id ? 'bg-indigo-100' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {product.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                SKU: {product.sku}
                                                {showBarcode && product.barcode && ` • Barkod: ${product.barcode}`}
                                                {showPrice && product.price && ` • ${product.price} AZN`}
                                            </div>
                                        </div>
                                        {selectedProduct?.id === product.id && (
                                            <CheckIcon className="h-4 w-4 text-indigo-600 ml-2" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {/* Hidden input for form submission */}
            <input
                type="hidden"
                value={value}
                required={required}
            />
        </div>
    );
}