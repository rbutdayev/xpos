import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface DependencyInfo {
    can_delete: boolean;
    product: {
        id: number;
        name: string;
        sku: string;
        is_active: boolean;
    };
    blocking_dependencies: {
        sale_items: number;
        tailor_service_items: number;
        total: number;
    };
    allowed_dependencies: {
        goods_receipt_items: number;
        stock_history: number;
        product_stock: number;
        warehouse_transfers: number;
        stock_movements: number;
        min_max_alerts: number;
        product_documents: number;
        supplier_products: number;
        product_prices: number;
        product_variants: number;
        product_photos: number;
        total: number;
    };
    message: string;
}

interface ProductDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    dependencies: DependencyInfo | null;
    onConfirm: () => void;
    onDeactivate?: () => void;
    loading: boolean;
}

export default function ProductDeleteModal({
    isOpen,
    onClose,
    dependencies,
    onConfirm,
    onDeactivate,
    loading
}: ProductDeleteModalProps) {
    if (!dependencies) return null;

    const canDelete = dependencies.can_delete;
    const blockingTotal = dependencies.blocking_dependencies.total;
    const allowedTotal = dependencies.allowed_dependencies.total;

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
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        {canDelete ? (
                                            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
                                        ) : (
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                                        )}
                                        <Dialog.Title className="text-lg font-medium text-gray-900">
                                            {canDelete ? 'Məhsulu Sil' : 'Məhsul Silinə Bilməz'}
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                        {dependencies.product.name}
                                        {dependencies.product.sku && ` (${dependencies.product.sku})`}
                                    </p>

                                    {canDelete ? (
                                        <>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                                <p className="text-sm text-yellow-800 font-medium">
                                                    ⚠️ DİQQƏT: Bu əməliyyat geri qaytarıla bilməz!
                                                </p>
                                            </div>

                                            <p className="text-sm text-gray-700 mb-3">
                                                Aşağıdakı əlaqəli məlumatlar silinəcək:
                                            </p>

                                            <div className="space-y-2 bg-gray-50 rounded-md p-4 mb-4">
                                                {dependencies.allowed_dependencies.goods_receipt_items > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Anbar Qəbzləri: {dependencies.allowed_dependencies.goods_receipt_items}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.stock_history > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Stok Tarixçəsi: {dependencies.allowed_dependencies.stock_history}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.stock_movements > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Stok Hərəkətləri: {dependencies.allowed_dependencies.stock_movements}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.warehouse_transfers > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Anbar Transferləri: {dependencies.allowed_dependencies.warehouse_transfers}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.supplier_products > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Tədarükçü Əlaqələri: {dependencies.allowed_dependencies.supplier_products}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.product_documents > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Məhsul Sənədləri: {dependencies.allowed_dependencies.product_documents}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.product_prices > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Qiymət Qeydləri: {dependencies.allowed_dependencies.product_prices}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.product_stock > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Anbar Stokları: {dependencies.allowed_dependencies.product_stock}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.product_variants > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Məhsul Variantları: {dependencies.allowed_dependencies.product_variants}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.product_photos > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Məhsul Şəkilləri: {dependencies.allowed_dependencies.product_photos}</span>
                                                    </div>
                                                )}
                                                {dependencies.allowed_dependencies.min_max_alerts > 0 && (
                                                    <div className="flex items-center text-sm">
                                                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                                        <span>Xəbərdarlıqlar: {dependencies.allowed_dependencies.min_max_alerts}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-sm font-medium text-gray-900">
                                                Ümumi: {allowedTotal} qeyd silinəcək
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                                <p className="text-sm text-red-800 font-medium mb-2">
                                                    🛑 Bu məhsul müştəri əməliyyatlarında istifadə edildiyinə görə silinə bilməz.
                                                </p>
                                            </div>

                                            <p className="text-sm text-gray-700 mb-3">
                                                Aşağıdakı müştəri əməliyyatları var:
                                            </p>

                                            <div className="space-y-2 bg-red-50 rounded-md p-4 mb-4">
                                                {dependencies.blocking_dependencies.sale_items > 0 && (
                                                    <div className="flex items-center text-sm text-red-800">
                                                        <span>• Satış qeydləri: {dependencies.blocking_dependencies.sale_items}</span>
                                                    </div>
                                                )}
                                                {dependencies.blocking_dependencies.tailor_service_items > 0 && (
                                                    <div className="flex items-center text-sm text-red-800">
                                                        <span>• Xidmət qeydləri: {dependencies.blocking_dependencies.tailor_service_items}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 italic">
                                                Tövsiyə: Məhsulu deaktiv edin.
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        {canDelete ? 'Ləğv et' : 'Bağla'}
                                    </button>

                                    {canDelete ? (
                                        <button
                                            type="button"
                                            onClick={onConfirm}
                                            disabled={loading}
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Silinir...' : 'Təsdiq et və Sil'}
                                        </button>
                                    ) : (
                                        onDeactivate && (
                                            <button
                                                type="button"
                                                onClick={onDeactivate}
                                                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                                            >
                                                Deaktiv et
                                            </button>
                                        )
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
