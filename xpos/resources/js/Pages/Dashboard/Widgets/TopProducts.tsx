import { memo, useMemo } from 'react';
import { formatCurrency } from '../Utils/dashboardCalculations';
import { getRankingColor, calculateChartMaxValue } from '../Utils/widgetHelpers';

interface TopProduct {
    id: number;
    name: string;
    category_name: string | null;
    total_sold: number;
    total_revenue: number;
    stock_quantity: number;
}

interface TopProductsProps {
    products: TopProduct[];
}

const TopProducts = memo(function TopProducts({ products }: TopProductsProps) {
    const maxRevenue = useMemo(() => {
        return calculateChartMaxValue(products, 'total_revenue');
    }, [products]);

    return (
        <div className="-m-6 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ən Çox Satılan Məhsullar</h3>
                <span className="text-sm text-gray-500">Bu ay</span>
            </div>

            {products.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                    {products.map((product, index) => (
                        <div key={product.id} className="flex items-center">
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getRankingColor(index)}`}>
                                {index + 1}
                            </div>

                            {/* Product Info */}
                            <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate">
                                            {product.category_name || 'Kateqoriyasız'}
                                        </p>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(product.total_revenue)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {product.total_sold} ədəd
                                        </p>
                                    </div>
                                </div>

                                {/* Revenue Bar */}
                                <div className="mt-2">
                                    <div className="bg-gray-200 rounded-full h-1">
                                        <div 
                                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                            style={{ width: `${(product.total_revenue / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stock Level */}
                                <div className="mt-1 flex items-center justify-between text-xs">
                                    <span className={`px-2 py-1 rounded-full ${
                                        product.stock_quantity > 10 ? 'bg-green-100 text-green-800' :
                                        product.stock_quantity > 5 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        Stok: {product.stock_quantity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 mt-2">Məlumat tapılmadı</p>
                </div>
            )}
        </div>
    );
});

export default TopProducts;