import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    label: string;
}

interface Props {
    value: number | null;
    onChange: (productId: number | null, product: Product | null) => void;
    label?: string;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}

export default function ParentProductSelect({
    value,
    onChange,
    label = "Ana Məhsul",
    error,
    placeholder = "ID, ad və ya SKU ilə axtar...",
    disabled = false,
    required = false
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch products when search query changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 0 || isOpen) {
                fetchProducts(searchQuery);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isOpen]);

    // Load selected product on mount if value exists
    useEffect(() => {
        if (value && !selectedProduct) {
            fetchProducts(value.toString());
        }
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchProducts = async (query: string) => {
        setLoading(true);
        try {
            const response = await axios.get(route('products.search-parent'), {
                params: { q: query, limit: 20 }
            });
            setProducts(response.data.data);

            // If value matches a product, set it as selected
            if (value) {
                const found = response.data.data.find((p: Product) => p.id === value);
                if (found) {
                    setSelectedProduct(found);
                }
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (product: Product) => {
        setSelectedProduct(product);
        onChange(product.id, product);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = () => {
        setSelectedProduct(null);
        onChange(null, null);
        setSearchQuery('');
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        if (products.length === 0) {
            fetchProducts('');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {selectedProduct ? (
                    // Selected product display
                    <div className="flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-white">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                {selectedProduct.name}
                            </p>
                            {selectedProduct.sku && (
                                <p className="text-xs text-gray-500">SKU: {selectedProduct.sku}</p>
                            )}
                            <p className="text-xs text-gray-400">ID: {selectedProduct.id}</p>
                        </div>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                title="Clear selection"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>
                ) : (
                    // Search input
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={handleInputFocus}
                            placeholder={placeholder}
                            disabled={disabled}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                                error ? 'border-red-300' : 'border-gray-300'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                        />
                    </div>
                )}

                {/* Dropdown */}
                {isOpen && !selectedProduct && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                <div className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                Axtarılır...
                            </div>
                        ) : products.length > 0 ? (
                            <ul>
                                {products.map((product) => (
                                    <li key={product.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(product)}
                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                        >
                                            <p className="text-sm font-medium text-gray-900">
                                                {product.name}
                                            </p>
                                            <div className="flex gap-3 mt-0.5">
                                                {product.sku && (
                                                    <span className="text-xs text-gray-500">
                                                        SKU: {product.sku}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400">
                                                    ID: {product.id}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : searchQuery.length > 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Məhsul tapılmadı
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Axtarmağa başlayın...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {!selectedProduct && (
                <p className="mt-1 text-xs text-gray-500">
                    Məhsul ID, ad və ya SKU ilə axtarın. Yalnız ana məhsullar görünəcək.
                </p>
            )}
        </div>
    );
}
