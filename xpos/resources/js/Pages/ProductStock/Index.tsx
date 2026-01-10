import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { productStockTableConfig } from '@/Components/TableConfigurations';
import useInventoryUpdate from '@/Pages/GoodsReceipts/Hooks/useInventoryUpdate';
import StockImportModal from '@/Components/StockImportModal';
import StockImportProgressModal from '@/Components/StockImportProgressModal';
import { ArrowUpTrayIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Props {
    stocks: {
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
    filters: { search?: string; warehouse_id?: string; low_stock?: string; };
}

export default function Index({ stocks, warehouses, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [lowStock, setLowStock] = useState(filters.low_stock || '');
    const [showImportModal, setShowImportModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [currentImportJobId, setCurrentImportJobId] = useState<number | null>(null);
    const { subscribe } = useInventoryUpdate();

    const handleImportStarted = (importJobId: number) => {
        setCurrentImportJobId(importJobId);
        setShowProgressModal(true);
    };

    const handleSearch = () => {
        router.get(route('product-stock.index'), {
            search,
            warehouse_id: warehouseId,
            low_stock: lowStock
        }, { preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch(''); setWarehouseId(''); setLowStock('');
        router.get(route('product-stock.index'), {}, { preserveState: true, replace: true });
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
            key: 'low_stock',
            type: 'dropdown' as const,
            label: 'Stok vəziyyəti',
            value: lowStock,
            onChange: setLowStock,
            options: [
                { value: '', label: 'Hamısı' },
                { value: '1', label: 'Az stok' },
                { value: '0', label: 'Normal stok' }
            ]
        }
    ];

    useEffect(() => {
        const unsubscribe = subscribe(() => {
            router.reload({ only: ['stocks'] });
        });
        return unsubscribe;
    }, []);

    // Handle row double-click to edit
    const handleRowDoubleClick = (stock: any) => {
        router.visit(route('product-stock.edit', stock.id));
    };

    // Get bulk actions based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedStocks: any[]): BulkAction[] => {
        // Only show actions when exactly ONE item is selected
        if (selectedIds.length === 1 && selectedStocks.length === 1) {
            const stock = selectedStocks[0];

            return [
                {
                    label: 'Tarixçə',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('stock-movements.index', {
                        product_id: stock.product_id,
                        warehouse_id: stock.warehouse_id
                    }))
                },
                {
                    label: 'Düzəliş et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('product-stock.edit', stock.id))
                }
            ];
        }

        // No bulk actions for multiple selections
        return [];
    };

    return (
        <AuthenticatedLayout>
            <Head title="Məhsul Stoku" />
            <div className="w-full">
                {/* Import Button */}
                <div className="mb-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                        <ArrowUpTrayIcon className="w-5 h-5" />
                        <span>Başlanğıc Qalıq İmport</span>
                    </button>
                </div>

                <SharedDataTable
                    title="Məhsul Stoku"
                    data={stocks}
                    columns={productStockTableConfig.columns}
                    selectable={true}
                    bulkActions={getBulkActions}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={productStockTableConfig.searchPlaceholder}
                    filters={filtersUI}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={() => 'cursor-pointer hover:bg-blue-50 transition-all duration-200'}
                    fullWidth={true}
                    mobileClickable={true}
                    hideMobileActions={true}
                />

                {/* Stock Import Modal */}
                <StockImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onImportStarted={handleImportStarted}
                />

                {/* Stock Import Progress Modal */}
                <StockImportProgressModal
                    isOpen={showProgressModal}
                    onClose={() => setShowProgressModal(false)}
                    importJobId={currentImportJobId}
                />
            </div>
        </AuthenticatedLayout>
    );
}