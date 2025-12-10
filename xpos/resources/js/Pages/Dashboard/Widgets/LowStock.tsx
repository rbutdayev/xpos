import { memo } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, CubeIcon } from '@heroicons/react/24/outline';
import { formatCurrency, getStockLevelStatus } from '../Utils/dashboardCalculations';

interface LowStockProduct {
    id: number;
    name: string;
    sku: string | null;
    stock_quantity: number;
    min_stock_level: number;
    category_name: string | null;
    price: number;
}

interface LowStockProps {
    products: LowStockProduct[];
}

const LowStock = memo(function LowStock({ products }: LowStockProps) {
    const { t } = useTranslation('dashboard');

    return (
        <div className="-m-6 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('widgets.lowStock.title')}</h3>
                </div>
                <Link
                    href="/products?filter=low_stock"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                    {t('widgets.lowStock.viewAll')}
                </Link>
            </div>

            {products.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {products.map((product) => {
                        const stockInfo = getStockLevelStatus(product.stock_quantity, product.min_stock_level);
                        
                        return (
                            <div key={product.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start flex-1 min-w-0">
                                        <CubeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                                                {product.name}
                                            </h4>
                                            <div className="flex items-center mt-1 text-xs text-gray-500">
                                                {product.sku && (
                                                    <>
                                                        <span className="truncate">SKU: {product.sku}</span>
                                                        <span className="mx-2">•</span>
                                                    </>
                                                )}
                                                <span className="truncate">{product.category_name || t('widgets.lowStock.uncategorized')}</span>
                                                <span className="mx-2">•</span>
                                                <span className="flex-shrink-0">{formatCurrency(product.price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right ml-4 flex-shrink-0">
                                        <div className="flex items-center">
                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${stockInfo.color}`}></span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {product.stock_quantity}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-1">
                                                / {product.min_stock_level}
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${stockInfo.bgColor} ${stockInfo.textColor}`}>
                                            {stockInfo.label}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Stock Level Bar */}
                                <div className="mt-3">
                                    <div className="bg-gray-200 rounded-full h-1">
                                        <div 
                                            className={`h-1 rounded-full transition-all duration-300 ${stockInfo.color}`}
                                            style={{ 
                                                width: `${Math.min((product.stock_quantity / product.min_stock_level) * 100, 100)}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('widgets.lowStock.noIssue')}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {t('widgets.lowStock.allGoodDesc')}
                    </p>
                </div>
            )}
        </div>
    );
});

export default LowStock;