import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { goodsReceiptsTableConfig } from '@/Components/TableConfigurations';
import useInventoryUpdate from '@/Pages/GoodsReceipts/Hooks/useInventoryUpdate';
import PayGoodsReceiptModal from '@/Components/Modals/PayGoodsReceiptModal';
import { GoodsReceipt } from '@/types';

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
        date_from?: string;
        date_to?: string;
    };
}

export default function Index({ receipts, warehouses, suppliers, categories, branches, paymentMethods, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
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

    const handleSearch = () => {
        router.get(route('goods-receipts.index'), {
            search,
            warehouse_id: warehouseId,
            supplier_id: supplierId,
            date_from: dateFrom,
            date_to: dateTo
        }, { preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch(''); setWarehouseId(''); setSupplierId(''); setDateFrom(''); setDateTo('');
        router.get(route('goods-receipts.index'), {}, { preserveState: true, replace: true });
    };

    const filtersUI = [
        {
            key: 'warehouse_id',
            type: 'dropdown' as const,
            label: 'Anbar',
            value: warehouseId,
            onChange: setWarehouseId,
            options: [{ value: '', label: 'Bütün anbarlar' }, ...warehouses.map(w => ({ value: String(w.id), label: w.name }))]
        },
        {
            key: 'supplier_id',
            type: 'dropdown' as const,
            label: 'Təchizatçı',
            value: supplierId,
            onChange: setSupplierId,
            options: [{ value: '', label: 'Bütün təchizatçılar' }, ...suppliers.map(s => ({ value: String(s.id), label: s.name }))]
        },
        { key: 'date_from', type: 'date' as const, label: 'Başlanğıc', value: dateFrom, onChange: setDateFrom },
        { key: 'date_to', type: 'date' as const, label: 'Son', value: dateTo, onChange: setDateTo }
    ];

    useEffect(() => {
        const unsubscribe = subscribe(() => {
            router.reload({ only: ['receipts'] });
        });
        return unsubscribe;
    }, []);

    // Create modified actions with pay button handler
    const tableActions = goodsReceiptsTableConfig.actions.map(action => {
        if (action.label === 'Ödə') {
            return {
                ...action,
                onClick: handlePayClick
            };
        }
        return action;
    });

    return (
        <AuthenticatedLayout>
            <Head title="Mal Qəbulları" />
            <div className="w-full min-h-screen bg-gray-50 -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="w-full max-w-full overflow-hidden">
                    <SharedDataTable
                        title="Mal Qəbulları"
                        data={receipts}
                        columns={goodsReceiptsTableConfig.columns}
                        actions={tableActions}
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder={goodsReceiptsTableConfig.searchPlaceholder}
                        filters={filtersUI}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        createButton={{ label: 'Yeni Mal Qəbulu', href: route('goods-receipts.create') }}
                        dense={true}
                        fullWidth={true}

                        mobileClickable={true}

                        hideMobileActions={true}
                    />
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