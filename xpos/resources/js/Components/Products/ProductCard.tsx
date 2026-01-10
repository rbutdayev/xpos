import { Link } from '@inertiajs/react';
import { Product } from '@/types';
import { 
    CubeIcon, 
    WrenchScrewdriverIcon,
    PencilIcon,
    EyeIcon 
} from '@heroicons/react/24/outline';

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN',
        }).format(price);
    };

    const getStockStatus = () => {
        const totalStock = product.stock?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
        
        if (totalStock <= 0) {
            return { text: 'Stokda yoxdur', color: 'text-red-600 bg-red-100' };
        } else if (totalStock <= 10) {
            return { text: 'Az qalıb', color: 'text-yellow-600 bg-yellow-100' };
        } else {
            return { text: 'Stokda var', color: 'text-green-600 bg-green-100' };
        }
    };

    const stockStatus = getStockStatus();
    const totalStock = product.stock?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
                {/* Product Type Icon */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        {product.type === 'service' ? (
                            <WrenchScrewdriverIcon className="w-5 h-5 text-blue-500 mr-2" />
                        ) : (
                            <CubeIcon className="w-5 h-5 text-gray-500 mr-2" />
                        )}
                        <span className="text-xs font-medium text-gray-500 uppercase">
                            {product.type === 'service' ? 'Xidmət' : 'Məhsul'}
                        </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                        {stockStatus.text}
                    </span>
                </div>

                {/* Product Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                </h3>

                {/* SKU and Barcode */}
                <div className="space-y-1 mb-3">
                    {product.sku && (
                        <p className="text-xs text-gray-500">
                            <span className="font-medium">SKU:</span> {product.sku}
                        </p>
                    )}
                    {product.barcode && (
                        <p className="text-xs text-gray-500">
                            <span className="font-medium">Barkod:</span> {product.barcode}
                        </p>
                    )}
                </div>

                {/* Category */}
                {product.category && (
                    <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Kateqoriya:</span> {product.category.name}
                    </p>
                )}

                {/* Stock Info */}
                {product.type === 'product' && (
                    <div className="mb-3">
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">Stok:</span> {totalStock} {product.unit}
                        </p>
                        {product.stock && product.stock.length > 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                                {product.stock.length} anbarда
                            </p>
                        )}
                    </div>
                )}

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                        <p className="text-xs text-gray-500">Alış qiyməti</p>
                        <p className="text-sm font-semibold text-gray-700">
                            {formatPrice(product.latest_price?.purchase_price || 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Satış qiyməti</p>
                        <p className="text-sm font-semibold text-green-600">
                            {formatPrice(product.latest_price?.sale_price || 0)}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Link
                        href={`/products/${product.id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Bax
                    </Link>
                    <Link
                        href={`/products/${product.id}/edit`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Düzəlt
                    </Link>
                </div>
            </div>
        </div>
    );
}