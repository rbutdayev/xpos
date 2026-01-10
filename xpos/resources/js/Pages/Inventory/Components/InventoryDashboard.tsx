import { Warehouse } from '@/types';
import StockLevelIndicator from './StockLevelIndicator';
import { CubeIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Props {
    selectedWarehouse: Warehouse | null;
}

export default function InventoryDashboard({ selectedWarehouse }: Props) {
    const { t } = useTranslation(['inventory', 'common']);

    return (
        <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <CubeIcon className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.title')}</h3>
                </div>
                {selectedWarehouse && (
                    <Link href={route('inventory.warehouse', selectedWarehouse.id)} className="text-slate-600 hover:text-slate-800 text-sm">
                        {t('dashboard.details')}
                    </Link>
                )}
            </div>

            {!selectedWarehouse ? (
                <div className="text-gray-600 text-sm">{t('dashboard.selectWarehouseMessage')}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">{t('dashboard.selectedWarehouse')}</div>
                        <div className="font-semibold text-gray-900 flex items-center mt-1">
                            <BuildingStorefrontIcon className="w-4 h-4 mr-1 text-blue-600" /> {selectedWarehouse.name}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">{t('dashboard.stockStatus')}</div>
                        <StockLevelIndicator percentage={0} label={t('dashboard.totalStock')} />
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="text-sm text-gray-500">{t('dashboard.operations')}</div>
                        <div className="mt-2 text-sm text-gray-700">{t('dashboard.operationsDescription')}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

