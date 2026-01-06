import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { warehouseTableConfig } from '@/Components/TableConfigurations';
import { PlusIcon, BuildingStorefrontIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Warehouse } from '@/types';

interface Props {
    warehouses: Warehouse[];
}

export default function Index({ warehouses }: Props) {
    const [search, setSearch] = useState('');

    const handleDelete = (warehouse: Warehouse) => {
        if (confirm(`"${warehouse.name}" anbarını silmək istədiyinizə əminsiniz?`)) {
            router.delete(route('warehouses.destroy', warehouse.id));
        }
    };

    // Handle double-click to view warehouse
    const handleRowDoubleClick = (warehouse: Warehouse) => {
        router.visit(route('warehouses.show', warehouse.id));
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} anbarı silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('warehouses.bulk-delete'), {
            ids: selectedIds
        }, {
            onSuccess: () => {
                // Success message handled by backend
            },
            onError: (errors: any) => {
                alert('Xəta baş verdi');
            },
            preserveScroll: true
        });
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedWarehouses: Warehouse[]): BulkAction[] => {
        // If only ONE warehouse is selected, show individual actions
        if (selectedIds.length === 1 && selectedWarehouses.length === 1) {
            const warehouse = selectedWarehouses[0];

            return [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('warehouses.show', warehouse.id))
                },
                {
                    label: 'Redaktə et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('warehouses.edit', warehouse.id))
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDelete(warehouse)
                }
            ];
        }

        // Multiple warehouses selected - show bulk actions
        return [
            {
                label: 'Toplu Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    const dataWrapped = {
        data: warehouses,
        links: [],
        current_page: 1,
        last_page: 1,
        total: warehouses.length,
        per_page: warehouses.length || 10,
        from: warehouses.length ? 1 : 0,
        to: warehouses.length
    } as any;

    return (
        <AuthenticatedLayout>
            <Head title="Anbarlar" />
            <div className="w-full">
                <SharedDataTable
                    title="Anbarlar"
                    subtitle="Şirkətinizin anbarlarını idarə edin"
                    data={dataWrapped}
                    columns={warehouseTableConfig.columns}
                    selectable={true}
                    bulkActions={getBulkActions}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={warehouseTableConfig.searchPlaceholder}
                    onSearch={() => router.get(route('warehouses.index'), { search }, { preserveState: true })}
                    onReset={() => { setSearch(''); router.get(route('warehouses.index'), {}, { preserveState: true }); }}
                    createButton={{ label: 'Yeni Anbar', href: route('warehouses.create') }}
                    emptyState={{
                        icon: <BuildingStorefrontIcon className="w-12 h-12" />,
                        title: 'Anbar tapılmadı',
                        description: 'İlk anbarınızı yaratmaqla başlayın.',
                    }}
                    className="space-y-6"
                    fullWidth={true}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={(warehouse: Warehouse) =>
                        `cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                            warehouse.is_active ? '' : 'opacity-60'
                        }`
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}

