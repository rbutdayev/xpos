import { Link } from '@inertiajs/react';
import { CubeIcon, ExclamationTriangleIcon, TruckIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { CompactKPICard } from '@/Components/Dashboard/KPICard';
import { SectionGroup } from '@/Components/Dashboard/SectionGroup';
import { QuickActionButton } from '@/Components/Dashboard/QuickActionButton';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN', minimumFractionDigits: 2 }).format(amount);
};

const formatNumber = (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('az-AZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
};

interface Props {
    operational: {
        products_in_stock: number;
        products_count: number;
        total_quantity?: number;
        stock_value: { cost: number; sale: number; potential_profit: number } | null;
        stock_turnover: number | null;
    };
    alerts: {
        low_stock: number;
        out_of_stock: number;
        negative_stock: number;
        pending_goods_receipts: number;
    };
    stock_by_unit: Array<{ unit: string; quantity: number; sku_count: number; value: number }>;
    tables: {
        low_stock_products: Array<{
            id: number;
            name: string;
            current: number;
            min: number;
            unit: string;
            warehouse: string | null;
        }>;
    };
    user: { name: string };
}

export default function WarehouseManagerDashboard({ operational, alerts, stock_by_unit, tables, user }: Props) {
    const { t } = useTranslation('dashboard');
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{t('welcomeBack', { name: user.name })}</h2>
                <p className="text-amber-100">{t('roles.warehousePanel')}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <QuickActionButton href="/goods-receipts/create" icon={<TruckIcon />} title={t('quickActions.goodsReceipt')} variant="success" />
                <QuickActionButton href="/products/create" icon={<CubeIcon />} title={t('quickActions.newProduct')} variant="primary" />
                <QuickActionButton href="/products" icon={<CubeIcon />} title={t('quickActions.productList')} variant="primary" />
            </div>

            <SectionGroup title={t('sections.stockIndicators')} icon={<CubeIcon />} variant="highlight">
                <CompactKPICard
                    title={t('operational.productsInStock')}
                    value={operational.products_in_stock}
                    icon={<CubeIcon />}
                    variant="primary"
                    subtitle={`${operational.products_count} ${t('operational.total')}`}
                />
                {operational.total_quantity !== undefined && (
                    <CompactKPICard
                        title={t('operational.totalQuantity')}
                        value={formatNumber(operational.total_quantity, 2)}
                        icon={<CubeIcon />}
                        variant="primary"
                        subtitle={t('operational.allUnits')}
                    />
                )}
                {operational.stock_value && (
                    <>
                        <CompactKPICard
                            title={t('stock.stockValue')}
                            value={formatCurrency(operational.stock_value.cost)}
                            icon={<BanknotesIcon />}
                            variant="primary"
                            subtitle={t('stock.costPrice')}
                        />
                        <CompactKPICard
                            title={t('stock.saleValue')}
                            value={formatCurrency(operational.stock_value.sale)}
                            icon={<BanknotesIcon />}
                            variant="success"
                            subtitle={t('stock.potentialRevenue')}
                        />
                        <CompactKPICard
                            title={t('stock.potentialProfit')}
                            value={formatCurrency(operational.stock_value.potential_profit)}
                            icon={<BanknotesIcon />}
                            variant="success"
                            subtitle={t('stock.saleLessCost')}
                        />
                    </>
                )}
            </SectionGroup>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {alerts.low_stock > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-3">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                            <div>
                                <p className="text-xs font-medium text-yellow-800">{t('alerts.lowStock')}</p>
                                <p className="text-xl font-bold text-yellow-900">{alerts.low_stock}</p>
                            </div>
                        </div>
                    </div>
                )}
                {alerts.out_of_stock > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                            <div>
                                <p className="text-xs font-medium text-red-800">{t('alerts.outOfStock')}</p>
                                <p className="text-xl font-bold text-red-900">{alerts.out_of_stock}</p>
                            </div>
                        </div>
                    </div>
                )}
                {alerts.negative_stock > 0 && (
                    <div className="bg-purple-50 border-l-4 border-purple-400 rounded-lg p-3">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 text-purple-600 mr-2" />
                            <div>
                                <p className="text-xs font-medium text-purple-800">{t('alerts.negativeStock')}</p>
                                <p className="text-xl font-bold text-purple-900">{alerts.negative_stock}</p>
                            </div>
                        </div>
                    </div>
                )}
                {alerts.pending_goods_receipts > 0 && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3">
                        <div className="flex items-center">
                            <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                                <p className="text-xs font-medium text-blue-800">{t('alerts.pendingReceipt')}</p>
                                <p className="text-xl font-bold text-blue-900">{alerts.pending_goods_receipts}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Low Stock Products */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{t('tables.lowStockProducts')}</h3>
                    <Link href="/alerts" className="text-sm text-blue-600 hover:text-blue-700">
                        {t('charts.viewAll')}
                    </Link>
                </div>
                <div className="space-y-3">
                    {tables.low_stock_products.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">{t('tables.allGood')}</p>
                    ) : (
                        tables.low_stock_products.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                                    <div>
                                        <p className="font-medium text-sm">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.warehouse || t('tables.allWarehouses')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-yellow-700">
                                        {formatNumber(product.current, 2)} {product.unit}
                                    </p>
                                    <p className="text-xs text-gray-500">{t('tables.min')}: {formatNumber(product.min, 2)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Stock by Unit */}
            {stock_by_unit.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold mb-4">{t('stockByUnit.title')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {stock_by_unit.map((item, index) => (
                            <div key={index} className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 border border-gray-200 transition-colors">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900">{formatNumber(item.quantity, 2)}</div>
                                    <div className="text-xs font-medium text-gray-600 mt-0.5">{item.unit}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{item.sku_count} {t('stock.product')}</div>
                                    {operational.stock_value && (
                                        <div className="text-xs text-gray-500">{formatCurrency(item.value)}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
