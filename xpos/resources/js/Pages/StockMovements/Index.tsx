import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { CubeIcon } from '@heroicons/react/24/outline';


interface StockMovement {
    movement_id: number;
    product: {
        id: number;
        name: string;
        sku: string;
    };
    warehouse: {
        id: number;
        name: string;
    };
    employee?: {
        employee_id: number;
        name: string;
    };
    movement_type: string;
    quantity: number;
    unit_cost?: number;
    notes?: string;
    created_at: string;
}

interface Props {
    movements: {
        data: StockMovement[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    warehouses: Array<{
        id: number;
        name: string;
    }>;
    movementTypes: Record<string, string>;
    filters: {
        search?: string;
        movement_type?: string;
        warehouse_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function Index({ movements, warehouses, movementTypes, filters }: Props) {
    const { auth } = usePage().props as any;
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [movementType, setMovementType] = useState(filters.movement_type || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const canCreateStockMovement = auth?.user?.role && ['admin', 'account_owner'].includes(auth.user.role);

    const handleSearch = () => {
        router.get('/stock-movements', { 
            search: searchValue, 
            movement_type: movementType,
            warehouse_id: warehouseId,
            date_from: dateFrom,
            date_to: dateTo
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearchValue('');
        setMovementType('');
        setWarehouseId('');
        setDateFrom('');
        setDateTo('');
        router.get('/stock-movements', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const tableFilters = [
        {
            key: 'movement_type',
            type: 'dropdown' as const,
            label: 'Hərəkət növü',
            value: movementType,
            onChange: setMovementType,
            options: [
                { value: '', label: 'Bütün növlər' },
                ...Object.entries(movementTypes).map(([key, value]) => ({
                    value: key,
                    label: value
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'warehouse_id',
            type: 'dropdown' as const,
            label: 'Anbar',
            value: warehouseId,
            onChange: setWarehouseId,
            options: [
                { value: '', label: 'Bütün anbarlar' },
                ...warehouses.map(warehouse => ({
                    value: warehouse.id.toString(),
                    label: warehouse.name
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'date_from',
            type: 'date' as const,
            label: 'Başlanğıc tarixi',
            value: dateFrom,
            onChange: setDateFrom,
            className: 'min-w-[150px]'
        },
        {
            key: 'date_to',
            type: 'date' as const,
            label: 'Bitmə tarixi',
            value: dateTo,
            onChange: setDateTo,
            className: 'min-w-[150px]'
        }
    ];

    const tableActions = [
        {
            ...tableConfig.stockMovements.actions[0], // View action
            href: (movement: StockMovement) => `/stock-movements/${movement.movement_id}`
        },
        {
            ...tableConfig.stockMovements.actions[1], // Delete action
            onClick: (movement: StockMovement) => {
                if (confirm('Silmək istədiyinizdən əminsiniz?')) {
                    router.delete(`/stock-movements/${movement.movement_id}`);
                }
            }
        }
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Stok Hərəkətləri
                    </h2>
                </div>
            }
        >
            <Head title="Stok Hərəkətləri" />

            <div className="py-12">
                <div className="w-full">
                    <SharedDataTable
                        data={movements}
                        columns={tableConfig.stockMovements.columns}
                        actions={tableActions}
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        searchPlaceholder={tableConfig.stockMovements.searchPlaceholder}
                        filters={tableFilters}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        createButton={canCreateStockMovement ? {
                            label: tableConfig.stockMovements.createButtonText,
                            href: '/stock-movements/create'
                        } : undefined}
                        emptyState={{
                            icon: <CubeIcon className="w-12 h-12" />,
                            title: tableConfig.stockMovements.emptyStateTitle,
                            description: tableConfig.stockMovements.emptyStateDescription
                        }}
                        idField="movement_id"
                        fullWidth={true}

                        mobileClickable={true}

                        hideMobileActions={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}