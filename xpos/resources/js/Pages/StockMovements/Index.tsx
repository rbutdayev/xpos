import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { CubeIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';


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
        id: number;
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
    const { t } = useTranslation(['inventory', 'common']);
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
            label: t('stockMovements.movementType'),
            value: movementType,
            onChange: setMovementType,
            options: [
                { value: '', label: t('stockMovements.allTypes') },
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
            label: t('stockMovements.warehouse'),
            value: warehouseId,
            onChange: setWarehouseId,
            options: [
                { value: '', label: t('filters.allWarehouses') },
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
            label: t('filters.startDate'),
            value: dateFrom,
            onChange: setDateFrom,
            className: 'min-w-[150px]'
        },
        {
            key: 'date_to',
            type: 'date' as const,
            label: t('filters.endDate'),
            value: dateTo,
            onChange: setDateTo,
            className: 'min-w-[150px]'
        }
    ];

    // Handle double-click to view movement
    const handleRowDoubleClick = (movement: StockMovement) => {
        router.visit(`/stock-movements/${movement.movement_id}`);
    };

    // Handle delete for a single movement
    const deleteMovement = (movement: StockMovement) => {
        if (confirm(t('confirmDelete'))) {
            router.delete(`/stock-movements/${movement.movement_id}`, {
                preserveScroll: true
            });
        }
    };

    // Handle bulk delete for selected movements
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = t('confirmBulkDelete', { count: selectedIds.length });

        if (confirm(String(confirmMessage))) {
            router.delete('/stock-movements/bulk-delete', {
                data: { ids: selectedIds },
                onError: (errors) => {
                    alert(t('deleteError') as string);
                },
                preserveScroll: true
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedMovements: StockMovement[]): BulkAction[] => {
        // If only ONE movement is selected, show individual actions
        if (selectedIds.length === 1 && selectedMovements.length === 1) {
            const movement = selectedMovements[0];

            return [
                {
                    label: t('view') as string,
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/stock-movements/${movement.movement_id}`)
                },
                {
                    label: t('edit') as string,
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(`/stock-movements/${movement.movement_id}/edit`)
                },
                {
                    label: t('delete') as string,
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => deleteMovement(movement)
                }
            ];
        }

        // Multiple movements selected - show bulk actions
        return [
            {
                label: t('bulkDelete') as string,
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('stockMovements.title')} />

            <div className="py-12">
                <div className="w-full">
                    <SharedDataTable
                        data={movements}
                        columns={tableConfig.stockMovements.columns}
                        selectable={true}
                        bulkActions={getBulkActions}
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        searchPlaceholder={t('stockMovements.searchPlaceholder')}
                        filters={tableFilters}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        createButton={canCreateStockMovement ? {
                            label: t('stockMovements.newMovement'),
                            href: '/stock-movements/create'
                        } : undefined}
                        emptyState={{
                            icon: <CubeIcon className="w-12 h-12" />,
                            title: t('noData'),
                            description: t('noDataDescription')
                        }}
                        idField="movement_id"
                        fullWidth={true}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={() => 'cursor-pointer hover:bg-blue-50 transition-all duration-200'}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}