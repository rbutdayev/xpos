import { Link } from '@inertiajs/react';
import {
    CubeIcon,
    BuildingStorefrontIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

export default function InventoryActions() {
    return (
        <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Sürətli Keçidlər</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link
                    href={route('warehouses.index')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    <BuildingStorefrontIcon className="w-4 h-4 mr-2" /> Anbarları idarə et
                </Link>
                <Link
                    href={route('product-stock.index')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    <CubeIcon className="w-4 h-4 mr-2" /> Bütün məhsul stoku
                </Link>
                <Link
                    href={route('warehouse-transfers.index')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    <CubeIcon className="w-4 h-4 mr-2" /> Anbar köçürmələri
                </Link>
                <Link
                    href={route('alerts.index')}
                    className="inline-flex items-center px-4 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" /> Stok xəbərdarlıqları
                </Link>
                <Link
                    href={route('product-activity.discrepancy')}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                    <MagnifyingGlassCircleIcon className="w-4 h-4 mr-2" /> Fərq araşdırması
                </Link>
                <Link
                    href={route('product-activity.timeline')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    <ClockIcon className="w-4 h-4 mr-2" /> Məhsul tarixi
                </Link>
            </div>
        </div>
    );
}

