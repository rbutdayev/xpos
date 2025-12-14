import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { goodsReceiptsTableConfig } from '@/Components/TableConfigurations';
import useInventoryUpdate from '@/Pages/GoodsReceipts/Hooks/useInventoryUpdate';
import PayGoodsReceiptModal from '@/Components/Modals/PayGoodsReceiptModal';
import { GoodsReceipt, PageProps } from '@/types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
    receipts: {
        data: any[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    warehouses: Array<{ id: number; name: string; }>;
    suppliers: Array<{ id: number; name: string; }>;
    categories?: Array<{ category_id: number; name: string; }>;
    branches?: Array<{ id: number; name: string; }>;
    paymentMethods?: Record<string, string>;
    filters: {
        search?: string;
        warehouse_id?: string;
        supplier_id?: string;
        batch_id?: string;
        invoice_number?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: Record<string, string>;
}

export default function Index({ receipts, warehouses, suppliers, categories, branches, paymentMethods, filters, flash, errors }: Props) {
    const { t } = useTranslation(['inventory', 'common']);

    // Ensure arrays are always arrays (defensive programming)
    const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];
    const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

    const [search, setSearch] = useState(filters.search || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || '');
    const [batchId, setBatchId] = useState(filters.batch_id || '');
    const [invoiceNumber, setInvoiceNumber] = useState(filters.invoice_number || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [status, setStatus] = useState(filters.status || 'completed');
    const [viewMode, setViewMode] = useState<'batch' | 'separate'>('batch'); // Default to batch view
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
    const { subscribe } = useInventoryUpdate();

    const toggleBatch = (batchKey: string) => {
        setExpandedBatches(prev => {
            const newSet = new Set(prev);
            if (newSet.has(batchKey)) {
                newSet.delete(batchKey);
            } else {
                newSet.add(batchKey);
            }
            return newSet;
        });
    };

    const handlePayClick = (receipt: GoodsReceipt) => {
        setSelectedReceipt(receipt);
        setShowPaymentModal(true);
    };

    const handleBatchPayClick = (batchItems: any[]) => {
        // Calculate total cost for all items in batch
        const totalCost = batchItems.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0);

        // Calculate total remaining amount (unpaid amount) for all items in batch
        const totalRemaining = batchItems.reduce((sum, item) => {
            const remaining = parseFloat(item.supplier_credit?.remaining_amount || item.total_cost || 0);
            return sum + remaining;
        }, 0);

        // Create a combined receipt object for the batch
        const batchReceipt = {
            ...batchItems[0],
            total_cost: totalCost,
            isBatch: true,
            batchItems: batchItems,
            batch_id: batchItems[0].batch_id || null,
            // Add a supplier_credit object with the combined remaining amount
            supplier_credit: {
                remaining_amount: totalRemaining
            }
        };

        setSelectedReceipt(batchReceipt as any);
        setShowPaymentModal(true);
    };

    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedReceipt(null);
    };

    const handleDelete = (receipt: GoodsReceipt) => {
        const confirmMessage = t('goodsReceipts.deleteConfirm');
        if (confirm(confirmMessage)) {
            router.delete(route('goods-receipts.destroy', receipt.id), {
                onSuccess: () => {
                    toast.success(t('goodsReceipts.deleteSuccess'));
                },
                onError: (errors) => {
                    // Display all error messages as toasts
                    Object.values(errors).forEach((error: string | string[]) => {
                        if (typeof error === 'string') {
                            toast.error(error);
                        } else if (Array.isArray(error)) {
                            error.forEach((msg: string) => toast.error(msg));
                        }
                    });
                }
            });
        }
    };

    const handleDeleteBatch = (batchId: string, itemCount: number) => {
        const confirmMessage = `Bu partiyada ${itemCount} məhsul var. Bütün partiyanı silmək istədiyinizdən əminsiniz?`;
        if (confirm(confirmMessage)) {
            router.delete(route('goods-receipts.delete-batch', { batch_id: batchId }), {
                onSuccess: () => {
                    toast.success('Partiya uğurla silindi');
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error: string | string[]) => {
                        if (typeof error === 'string') {
                            toast.error(error);
                        } else if (Array.isArray(error)) {
                            error.forEach((msg: string) => toast.error(msg));
                        }
                    });
                }
            });
        }
    };

    const handleSearch = () => {
        router.get(route('goods-receipts.index'), {
            search,
            warehouse_id: warehouseId,
            supplier_id: supplierId,
            batch_id: batchId,
            invoice_number: invoiceNumber,
            date_from: dateFrom,
            date_to: dateTo,
            status
        }, { preserveState: true, replace: true });
    };

    const handleTabChange = (newStatus: string) => {
        setStatus(newStatus);
        router.get(route('goods-receipts.index'), {
            search,
            warehouse_id: warehouseId,
            supplier_id: supplierId,
            batch_id: batchId,
            invoice_number: invoiceNumber,
            date_from: dateFrom,
            date_to: dateTo,
            status: newStatus
        }, { preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch(''); setWarehouseId(''); setSupplierId(''); setBatchId(''); setInvoiceNumber(''); setDateFrom(''); setDateTo('');
        router.get(route('goods-receipts.index'), {}, { preserveState: true, replace: true });
    };

    // Group receipts by batch_id
    const groupedReceipts = () => {
        const groups: Record<string, any[]> = {};

        // Ensure receipts.data is an array
        const receiptData = Array.isArray(receipts?.data) ? receipts.data : [];

        receiptData.forEach((receipt: any) => {
            const key = receipt.batch_id || `single-${receipt.id}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(receipt);
        });

        return Object.entries(groups).map(([batchId, items]) => ({
            batch_id: batchId.startsWith('single-') ? null : batchId,
            invoice_number: items[0].invoice_number,
            items: items,
            total_cost: items.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0),
            created_at: items[0].created_at,
            supplier: items[0].supplier,
            warehouse: items[0].warehouse,
            employee: items[0].employee,
            receipt_number: items[0].receipt_number,
            payment_status: items[0].payment_status,
            payment_method: items[0].payment_method,
        }));
    };

    const filtersUI = [
        {
            key: 'warehouse_id',
            type: 'dropdown' as const,
            label: t('filters.warehouse'),
            value: warehouseId,
            onChange: setWarehouseId,
            options: [{ value: '', label: t('filters.allWarehouses') }, ...safeWarehouses.map(w => ({ value: String(w.id), label: w.name }))]
        },
        {
            key: 'supplier_id',
            type: 'dropdown' as const,
            label: t('filters.supplier'),
            value: supplierId,
            onChange: setSupplierId,
            options: [{ value: '', label: t('filters.allSuppliers') }, ...safeSuppliers.map(s => ({ value: String(s.id), label: s.name }))]
        },
        { key: 'batch_id', type: 'text' as const, label: 'Partiya ID', value: batchId, onChange: setBatchId },
        { key: 'invoice_number', type: 'text' as const, label: 'Faktura №', value: invoiceNumber, onChange: setInvoiceNumber },
        { key: 'date_from', type: 'date' as const, label: t('filters.startDate'), value: dateFrom, onChange: setDateFrom },
        { key: 'date_to', type: 'date' as const, label: t('filters.endDate'), value: dateTo, onChange: setDateTo }
    ];

    useEffect(() => {
        const unsubscribe = subscribe(() => {
            router.reload({ only: ['receipts'] });
        });
        return unsubscribe;
    }, []);

    // Create modified actions with pay button handler, delete handler, and edit for drafts
    const tableActions = (record: any) => {
        const isDraft = record.status === 'draft';

        // Ensure actions is an array
        const configActions = Array.isArray(goodsReceiptsTableConfig?.actions) ? goodsReceiptsTableConfig.actions : [];

        let actions = configActions.map(action => {
            if (action.label === 'Ödə') {
                return {
                    ...action,
                    label: t('goodsReceipts.pay'),
                    onClick: handlePayClick
                };
            }
            if (action.label === 'Sil') {
                return {
                    ...action,
                    label: t('actions.delete', { ns: 'common' }),
                    onClick: handleDelete
                };
            }
            return action;
        });

        // For drafts, add Edit button and remove Pay button
        if (isDraft) {
            // Remove Pay button for drafts
            actions = actions.filter(action => action.label !== t('goodsReceipts.pay'));

            // Add Edit button at the beginning
            actions.unshift({
                label: 'Redaktə et',
                href: route('goods-receipts.edit', record.id),
                variant: 'primary' as const
            });
        }

        return actions;
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('goodsReceipts.title')} />
            <div className="w-full min-h-screen bg-gray-50 -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="w-full max-w-full overflow-hidden">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{flash.success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(flash?.error || errors?.error) && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <XCircleIcon className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">{flash?.error || errors?.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Page Header */}
                    <div className="bg-white shadow-sm rounded-lg mb-6">
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-2xl font-semibold text-gray-900">{t('goodsReceipts.title')}</h1>
                                <Link
                                    href={route('goods-receipts.create')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('goodsReceipts.newReceipt')}
                                </Link>
                            </div>

                            {/* Tabs and View Toggle Combined */}
                            <div className="flex items-center justify-between mb-4">
                                <nav className="flex space-x-3">
                                    <button
                                        onClick={() => handleTabChange('completed')}
                                        className={`inline-flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${
                                            status === 'completed'
                                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                        }`}
                                    >
                                        <svg className="-ml-0.5 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Tamamlanmış qəbullar
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('draft')}
                                        className={`inline-flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${
                                            status === 'draft'
                                                ? 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                        }`}
                                    >
                                        <svg className="-ml-0.5 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Qaralamalar
                                    </button>
                                </nav>

                                {/* View Mode Toggle */}
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-600">Görünüş:</span>
                                    <div className="inline-flex rounded-md shadow-sm" role="group">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('separate')}
                                            className={`px-3 py-1.5 text-sm font-medium border transition-colors ${
                                                viewMode === 'separate'
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            } rounded-l-md`}
                                        >
                                            Ayrı-ayrı
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('batch')}
                                            className={`px-3 py-1.5 text-sm font-medium border-t border-b border-r transition-colors ${
                                                viewMode === 'batch'
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            } rounded-r-md`}
                                        >
                                            Partiya
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'separate' ? (
                    <SharedDataTable
                        data={receipts}
                        columns={goodsReceiptsTableConfig.columns}
                        actions={tableActions as any}
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder={goodsReceiptsTableConfig.searchPlaceholder}
                        filters={filtersUI}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        dense={true}
                        fullWidth={true}
                        mobileClickable={true}
                        hideMobileActions={true}
                    />
                    ) : (
                        <div className="space-y-4">
                            {/* Batch View Content */}
                            {groupedReceipts().map((batch, index) => (
                                <div
                                    key={batch.batch_id || `single-${index}`}
                                    className="bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                                >
                                    {/* Batch Header */}
                                    <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                                            <div className="flex items-start justify-between">
                                                {/* Left: Batch Info */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center flex-wrap gap-x-6 gap-y-2">
                                                        {batch.batch_id && (
                                                            <div className="flex items-baseline">
                                                                <span className="text-xs font-medium text-gray-500 mr-2">Partiya:</span>
                                                                <span className="text-sm font-semibold font-mono text-blue-700">{batch.batch_id}</span>
                                                            </div>
                                                        )}
                                                        {batch.invoice_number && (
                                                            <div className="flex items-baseline">
                                                                <span className="text-xs font-medium text-gray-500 mr-2">Faktura №:</span>
                                                                <span className="text-sm font-semibold text-green-700">{batch.invoice_number}</span>
                                                            </div>
                                                        )}
                                                        {batch.supplier && (
                                                            <div className="flex items-baseline">
                                                                <span className="text-xs font-medium text-gray-500 mr-2">Təchizatçı:</span>
                                                                <span className="text-sm font-medium text-gray-900">{batch.supplier.name}</span>
                                                            </div>
                                                        )}
                                                        {status === 'draft' && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                Qaralama
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Items Summary */}
                                                    <div className="text-xs text-gray-500">
                                                        {batch.items.length} məhsul
                                                    </div>
                                                </div>

                                                {/* Right: Total and Actions */}
                                                <div className="flex items-center space-x-4 ml-4">
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500 mb-1">Ümumi məbləğ</div>
                                                        <div className="text-xl font-bold text-gray-900">
                                                            {batch.total_cost.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼
                                                        </div>
                                                    </div>
                                                    {batch.items.length > 0 && (
                                                        <div className="flex space-x-2">
                                                            {status === 'draft' && (
                                                                <a
                                                                    href={route('goods-receipts.edit', batch.items[0].id)}
                                                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                >
                                                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    Redaktə et
                                                                </a>
                                                            )}
                                                            {status === 'completed' && batch.items.some((item: any) => item.payment_status === 'unpaid') && (() => {
                                                                // Calculate total remaining amount (unpaid) for the batch
                                                                const batchRemainingAmount = batch.items.reduce((sum: number, item: any) => {
                                                                    const remaining = parseFloat(item.supplier_credit?.remaining_amount || item.total_cost || 0);
                                                                    return sum + remaining;
                                                                }, 0);

                                                                return (
                                                                    <button
                                                                        onClick={() => handleBatchPayClick(batch.items)}
                                                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                                    >
                                                                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                        </svg>
                                                                        Ödəniş et ({batchRemainingAmount.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼)
                                                                    </button>
                                                                );
                                                            })()}
                                                            {batch.batch_id ? (
                                                                <button
                                                                    onClick={() => handleDeleteBatch(batch.batch_id!, batch.items.length)}
                                                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                                >
                                                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                    Partiyanı sil
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleDelete(batch.items[0])}
                                                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                                >
                                                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                    Sil
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Batch Summary - Consolidated View */}
                                            <div className="mt-4 border-t border-gray-100 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-medium text-gray-700">Partiya məlumatları</h3>
                                                    <button
                                                        onClick={() => toggleBatch(batch.batch_id || `single-${index}`)}
                                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                                    >
                                                        <svg className={`mr-1.5 h-4 w-4 transition-transform ${expandedBatches.has(batch.batch_id || `single-${index}`) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        {expandedBatches.has(batch.batch_id || `single-${index}`) ? 'Gizlət' : 'Məhsulları bax'}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="bg-blue-50 p-3 rounded-lg">
                                                        <div className="text-xs text-blue-600 font-medium mb-1">Məhsul sayı</div>
                                                        <div className="text-lg font-bold text-blue-900">{batch.items.length}</div>
                                                    </div>
                                                    <div className="bg-green-50 p-3 rounded-lg">
                                                        <div className="text-xs text-green-600 font-medium mb-1">Anbar</div>
                                                        <div className="text-sm font-semibold text-green-900">{batch.warehouse?.name || '-'}</div>
                                                    </div>
                                                    <div className="bg-purple-50 p-3 rounded-lg">
                                                        <div className="text-xs text-purple-600 font-medium mb-1">Qəbul edən</div>
                                                        <div className="text-sm font-semibold text-purple-900">{batch.employee?.name || '-'}</div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="text-xs text-gray-600 font-medium mb-1">Tarix</div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {new Date(batch.created_at).toLocaleDateString('az-AZ')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expandable Products List */}
                                                {expandedBatches.has(batch.batch_id || `single-${index}`) && (
                                                    <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
                                                        <div className="text-xs font-medium text-gray-500 mb-2 uppercase">Məhsullar</div>
                                                        {batch.items.map((item: any) => (
                                                            <div key={item.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-center space-x-4 flex-1">
                                                                    <span className="text-xs font-mono text-gray-400 w-20">{item.receipt_number}</span>
                                                                    <div className="flex-1">
                                                                        <span className="text-sm font-medium text-gray-900">{item.product?.name}</span>
                                                                        {item.variant && (
                                                                            <span className="ml-2 text-xs text-gray-500">({item.variant.short_display})</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-6">
                                                                    <div className="text-sm text-gray-600 text-right w-24">
                                                                        <span className="font-medium">{parseFloat(item.quantity).toLocaleString('az-AZ')}</span>
                                                                        <span className="ml-1 text-xs">{item.unit}</span>
                                                                    </div>
                                                                    <div className="text-sm font-semibold text-gray-900 w-28 text-right">
                                                                        {parseFloat(item.total_cost).toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼
                                                                    </div>
                                                                    <a
                                                                        href={route('goods-receipts.show', item.id)}
                                                                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                        Bax
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {groupedReceipts().length === 0 && (
                                <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-16">
                                    <div className="text-center">
                                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <h3 className="mt-4 text-lg font-medium text-gray-900">Mal qəbulu tapılmadı</h3>
                                        <p className="mt-2 text-sm text-gray-500">
                                            {status === 'draft' ? 'Heç bir qaralama yoxdur' : 'Heç bir tamamlanmış mal qəbulu yoxdur'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {selectedReceipt && categories && branches && paymentMethods && (
                <PayGoodsReceiptModal
                    show={showPaymentModal}
                    onClose={handleClosePaymentModal}
                    goodsReceipt={selectedReceipt}
                    categories={categories}
                    branches={branches}
                    paymentMethods={paymentMethods}
                />
            )}
        </AuthenticatedLayout>
    );
}