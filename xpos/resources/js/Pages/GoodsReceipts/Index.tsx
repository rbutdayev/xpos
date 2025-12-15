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
        receipt_number?: string;
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
    const [receiptNumber, setReceiptNumber] = useState(filters.receipt_number || '');
    const [invoiceNumber, setInvoiceNumber] = useState(filters.invoice_number || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [status, setStatus] = useState(filters.status || 'completed');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
    const { subscribe } = useInventoryUpdate();

    const handlePayClick = (receipt: GoodsReceipt) => {
        setSelectedReceipt(receipt);
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

    const handleSearch = () => {
        router.get(route('goods-receipts.index'), {
            search,
            warehouse_id: warehouseId,
            supplier_id: supplierId,
            receipt_number: receiptNumber,
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
            receipt_number: receiptNumber,
            invoice_number: invoiceNumber,
            date_from: dateFrom,
            date_to: dateTo,
            status: newStatus
        }, { preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch(''); setWarehouseId(''); setSupplierId(''); setReceiptNumber(''); setInvoiceNumber(''); setDateFrom(''); setDateTo('');
        router.get(route('goods-receipts.index'), {}, { preserveState: true, replace: true });
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
        { key: 'receipt_number', type: 'text' as const, label: 'Qəbul №', value: receiptNumber, onChange: setReceiptNumber },
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

                            {/* Status Tabs */}
                            <nav className="flex space-x-3 mb-4">
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
                        </div>
                    </div>

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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}