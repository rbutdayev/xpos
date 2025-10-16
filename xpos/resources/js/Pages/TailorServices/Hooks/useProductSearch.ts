import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';

interface UseProductSearchReturn {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchResults: Product[];
    isSearching: boolean;
    clearSearch: () => void;
    selectProduct: (product: Product) => void;
}

export const useProductSearch = (
    onProductSelect?: (product: Product) => void,
    branchId?: string | number
): UseProductSearchReturn => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchResults([]);
        setIsSearching(false);
    }, []);

    const selectProduct = useCallback((product: Product) => {
        onProductSelect?.(product);
        clearSearch();
    }, [onProductSelect, clearSearch]);

    // Debounced search effect
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        if (searchTerm.length < 2) {
            return; // Don't search for single characters
        }

        setIsSearching(true);
        
        const timeoutId = setTimeout(() => {
            const controller = new AbortController();
            
            const url = new URL('/products/search', window.location.origin);
            url.searchParams.set('q', searchTerm);
            url.searchParams.set('include_services', 'true');
            if (branchId) {
                url.searchParams.set('branch_id', branchId.toString());
            }
            
            fetch(url.toString(), {
                signal: controller.signal
            })
                .then(response => {
                    if (!response.ok) throw new Error('Search failed');
                    return response.json();
                })
                .then(data => {
                    // Backend provides total_stock via accessor, services have null total_stock
                    const productsWithStock = data.map((product: any) => ({
                        ...product,
                        total_stock: product.type === 'service' ? null : (Number(product.total_stock) || 0)
                    }));
                    setSearchResults(productsWithStock);
                    setIsSearching(false);
                })
                .catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error('Search error:', error);
                        setSearchResults([]);
                        setIsSearching(false);
                    }
                });

            return () => {
                controller.abort();
            };
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(timeoutId);
            setIsSearching(false);
        };
    }, [searchTerm, branchId]);

    return {
        searchTerm,
        setSearchTerm,
        searchResults,
        isSearching,
        clearSearch,
        selectProduct
    };
};