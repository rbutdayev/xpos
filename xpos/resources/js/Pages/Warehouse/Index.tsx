import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { warehouseTableConfig } from '@/Components/TableConfigurations';
import { PlusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { Warehouse } from '@/types';
import InventoryNavigation from '@/Components/InventoryNavigation';

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

    const actionsWithHandlers = warehouseTableConfig.actions.map(action => {
        if (action.label === 'Sil') {
            return { ...action, onClick: handleDelete };
        }
        return action;
    });

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
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <InventoryNavigation currentRoute="warehouses" />
            </div>
            <div className="w-full">
                <SharedDataTable
                    title="Anbarlar"
                    subtitle="Şirkətinizin anbarlarını idarə edin"
                    data={dataWrapped}
                    columns={warehouseTableConfig.columns}
                    actions={actionsWithHandlers}
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

                    mobileClickable={true}

                    hideMobileActions={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}

