import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { productStockTableConfig } from '@/Components/TableConfigurations';
import useInventoryUpdate from '@/Pages/GoodsReceipts/Hooks/useInventoryUpdate';

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
    const { subscribe } = useInventoryUpdate();

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

    return (
        <AuthenticatedLayout>
            <Head title="Məhsul Stoku" />
            <SharedDataTable
                title="Məhsul Stoku"
                data={stocks}
                columns={productStockTableConfig.columns}
                actions={productStockTableConfig.actions}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={productStockTableConfig.searchPlaceholder}
                filters={filtersUI}
                onSearch={handleSearch}
                onReset={handleReset}
            mobileClickable={true}

            hideMobileActions={true}

            />
        </AuthenticatedLayout>
    );
}