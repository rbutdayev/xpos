import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cart-store';
import { Product } from '../../types';
import toast from 'react-hot-toast';

export default function ProductSearch() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCartStore();

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await window.ipc.searchProducts(searchQuery);
        setProducts(results);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Failed to search products:', error);
        toast.error(t('pos.noProducts'));
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, t]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (products.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % products.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + products.length) % products.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (products[selectedIndex]) {
          handleAddProduct(products[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        setProducts([]);
        break;
    }
  };

  const handleAddProduct = (product: Product) => {
    // Stock validation
    if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
      toast.error(`${t('pos.outOfStock')}: ${product.name}`);
      return;
    }

    // Warning for low stock
    if (product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5) {
      toast(`${t('pos.lowStock')}: ${product.stock_quantity} ${t('pos.remaining')}`, {
        icon: '⚠️',
        duration: 3000,
      });
    }

    addItem({
      product_id: product.id,
      product_name: product.name,
      variant_id: product.variant_id,
      quantity: 1,
      unit_price: product.sale_price,
      discount_amount: 0,
    });

    toast.success(t('pos.productAdded'));
    setSearchQuery('');
    setProducts([]);

    // Refocus search input
    searchInputRef.current?.focus();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    }).format(price);
  };

  return (
    <div className="card flex-1 flex flex-col overflow-hidden">
      {/* Search Header */}
      <div className="card-header">
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
            placeholder={t('pos.searchProducts')}
            className="input input-lg pl-12 pr-4 text-lg font-medium"
            autoFocus
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="card-body flex-1 overflow-y-auto">
        {products.length === 0 && searchQuery.trim().length >= 2 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-semibold">{t('pos.noProducts')}</p>
            <p className="text-sm mt-1">{t('pos.addProducts')}</p>
          </div>
        )}

        {products.length === 0 && searchQuery.trim().length < 2 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-semibold">{t('pos.scanBarcode')}</p>
            <p className="text-sm mt-1">{t('pos.searchProducts')}</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className={`product-card ${
                  index === selectedIndex ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                {/* Product Image Placeholder */}
                <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>

                {/* Product Name */}
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-base">
                  {product.name}
                </h3>

                {/* Category */}
                {product.category_name && (
                  <p className="text-xs text-gray-500 mb-2">{product.category_name}</p>
                )}

                {/* Price & Stock */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-200">
                  <div className="text-xl font-bold text-blue-600">
                    {formatPrice(product.sale_price)}
                  </div>
                  <div className="badge badge-info">
                    {product.stock_quantity.toFixed(0)} {t('common.quantity')}
                  </div>
                </div>

                {/* SKU/Barcode */}
                {(product.sku || product.barcode) && (
                  <div className="text-xs text-gray-400 mt-2 font-mono">
                    {product.sku || product.barcode}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
