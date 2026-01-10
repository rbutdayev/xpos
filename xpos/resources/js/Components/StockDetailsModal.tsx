import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, HomeModernIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { formatQuantityWithUnit } from '@/utils/formatters';
import { Product } from '@/types';

interface StockDetail {
    id: number;
    warehouse_id: number;
    quantity: number;
    min_level?: number;
    max_level?: number;
    reserved_quantity?: number;
    location?: string;
    warehouse?: {
        id: number;
        name: string;
        type: string;
    };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    accessibleWarehouses?: number[]; // Warehouse IDs user has access to
    showAllWarehouses?: boolean; // Admin/managers see all
}

export default function StockDetailsModal({
    isOpen,
    onClose,
    product,
    accessibleWarehouses = [],
    showAllWarehouses = false
}: Props) {
    const stockDetails = product.stock || [];

    // Filter stock based on access
    const visibleStock = showAllWarehouses
        ? stockDetails
        : stockDetails.filter((s: StockDetail) =>
            accessibleWarehouses.length === 0 || accessibleWarehouses.includes(s.warehouse_id)
          );

    const totalStock = visibleStock.reduce((sum: number, s: StockDetail) => sum + (s.quantity || 0), 0);
    const totalReserved = visibleStock.reduce((sum: number, s: StockDetail) => sum + (s.reserved_quantity || 0), 0);
    const availableStock = totalStock - totalReserved;

    const getStockStatus = (stock: StockDetail) => {
        if (stock.quantity <= 0) {
            return { text: 'Stokda yoxdur', color: 'text-red-600 bg-red-100', icon: ExclamationTriangleIcon };
        }
        if (stock.min_level && stock.quantity <= stock.min_level) {
            return { text: 'Az qalıb', color: 'text-yellow-600 bg-yellow-100', icon: ExclamationTriangleIcon };
        }
        return { text: 'Kifayət qədər', color: 'text-green-600 bg-green-100', icon: CheckCircleIcon };
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                            Stok Təfərrüatları
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-600 mt-1">{product.name}</p>
                                        {product.sku && (
                                            <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="text-sm text-blue-600 font-medium">Ümumi Stok</div>
                                        <div className="text-2xl font-bold text-blue-900 mt-1">
                                            {formatQuantityWithUnit(totalStock, product.unit)}
                                        </div>
                                    </div>
                                    {totalReserved > 0 && (
                                        <>
                                            <div className="bg-yellow-50 rounded-lg p-4">
                                                <div className="text-sm text-yellow-600 font-medium">Rezerv</div>
                                                <div className="text-2xl font-bold text-yellow-900 mt-1">
                                                    {formatQuantityWithUnit(totalReserved, product.unit)}
                                                </div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <div className="text-sm text-green-600 font-medium">Əlçatan</div>
                                                <div className="text-2xl font-bold text-green-900 mt-1">
                                                    {formatQuantityWithUnit(availableStock, product.unit)}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Warehouse Breakdown */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Anbar üzrə bölgü</h4>
                                    {visibleStock.length > 0 ? (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {visibleStock.map((stock: StockDetail) => {
                                                const status = getStockStatus(stock);
                                                const StatusIcon = status.icon;

                                                return (
                                                    <div
                                                        key={stock.id}
                                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <HomeModernIcon className="w-5 h-5 text-gray-400" />
                                                                    <h5 className="font-medium text-gray-900">
                                                                        {stock.warehouse?.name || `Anbar #${stock.warehouse_id}`}
                                                                    </h5>
                                                                    {stock.warehouse?.type === 'main' && (
                                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                                            Əsas
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {stock.location && (
                                                                    <p className="text-xs text-gray-500 mt-1 ml-7">
                                                                        Mövqe: {stock.location}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="text-right">
                                                                <div className="text-xl font-bold text-gray-900">
                                                                    {formatQuantityWithUnit(stock.quantity, product.unit)}
                                                                </div>
                                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${status.color}`}>
                                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                                    {status.text}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Additional Details */}
                                                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                            {stock.reserved_quantity !== undefined && stock.reserved_quantity > 0 && (
                                                                <div>
                                                                    <span className="text-gray-500">Rezerv:</span>
                                                                    <span className="ml-1 font-medium text-yellow-700">
                                                                        {formatQuantityWithUnit(stock.reserved_quantity, product.unit)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {stock.reserved_quantity !== undefined && (
                                                                <div>
                                                                    <span className="text-gray-500">Əlçatan:</span>
                                                                    <span className="ml-1 font-medium text-green-700">
                                                                        {formatQuantityWithUnit(stock.quantity - stock.reserved_quantity, product.unit)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {stock.min_level !== undefined && stock.min_level > 0 && (
                                                                <div>
                                                                    <span className="text-gray-500">Minimum:</span>
                                                                    <span className="ml-1 font-medium text-gray-700">
                                                                        {formatQuantityWithUnit(stock.min_level, product.unit)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {stock.max_level !== undefined && stock.max_level > 0 && (
                                                                <div>
                                                                    <span className="text-gray-500">Maksimum:</span>
                                                                    <span className="ml-1 font-medium text-gray-700">
                                                                        {formatQuantityWithUnit(stock.max_level, product.unit)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <HomeModernIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                            <p className="text-sm">Stok məlumatı tapılmadı</p>
                                            {!showAllWarehouses && accessibleWarehouses.length > 0 && (
                                                <p className="text-xs mt-1">Yalnız icazəli anbarlar göstərilir</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Access Notice for Sales Staff */}
                                {!showAllWarehouses && accessibleWarehouses.length > 0 && visibleStock.length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-700">
                                            <span className="font-medium">Qeyd:</span> Yalnız filialınızın icazəsi olan anbarların məlumatları göstərilir.
                                        </p>
                                    </div>
                                )}

                                {/* Close Button */}
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Bağla
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
