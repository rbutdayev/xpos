import React, { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../../stores/cart-store';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

export default function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    // Auto-focus search input
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await window.ipc.searchProducts(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('Failed to search products');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const product = await window.ipc.getProductByBarcode(barcode);
      if (product) {
        handleAddToCart(product);
        setSearchQuery('');
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Barcode scan failed:', error);
      toast.error('Failed to scan barcode');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Barcode scanner typically sends entire code at once ending with Enter
    if (e.key === 'Enter' && searchQuery.length > 5) {
      handleBarcodeScanned(searchQuery);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      variant_id: product.variant_id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.sale_price,
      discount_amount: 0,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Search Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products or scan barcode..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchResults.length === 0 && searchQuery && !isSearching ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">No products found</p>
          </div>
        ) : searchResults.length === 0 && !searchQuery ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500">Search for products or scan barcode</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {searchResults.map((product) => (
              <button
                key={`${product.id}-${product.variant_id || 'no-variant'}`}
                onClick={() => handleAddToCart(product)}
                className="bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-lg p-4 text-left transition-all duration-150 active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.name}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      {product.sku && <span>SKU: {product.sku}</span>}
                      {product.barcode && <span>Barcode: {product.barcode}</span>}
                      {product.variant_name && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                          {product.variant_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-600">
                        Stock: <span className={product.stock_quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {product.stock_quantity}
                        </span>
                      </span>
                      {product.category_name && (
                        <span className="text-sm text-gray-600">{product.category_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-2xl font-bold text-primary-600">${product.sale_price.toFixed(2)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
