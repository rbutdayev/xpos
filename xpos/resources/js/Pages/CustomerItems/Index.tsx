import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, Action } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { CustomerItem, Customer, PageProps } from '@/types';

interface CustomerItemsIndexProps extends PageProps {
    customerItems: {
        data: CustomerItem[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        customer_id?: number;
        is_active?: boolean;
    };
    customers: Customer[];
}

export default function Index({ auth, customerItems, filters, customers }: CustomerItemsIndexProps) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleSearch = (search: string) => {
        const newFilters = { ...localFilters, search };
        setLocalFilters(newFilters);
        router.get(route('customer-items.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('customer-items.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        router.get(route('customer-items.index'), { ...localFilters, sort: field, direction }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column[] = [
        {
            key: 'customer',
            label: 'Müştəri',
            sortable: true,
            render: (item: CustomerItem) => (
                <div className="flex items-center">
                    <div>
                        <Link
                            href={route('customer-items.show', item.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {item.customer?.name}
                        </Link>
                        {item.reference_number && (
                            <div className="text-xs text-gray-400">
                                Ref: {item.reference_number}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'item_details',
            label: 'Məhsul məlumatları',
            render: (item: CustomerItem) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {item.item_type}
                    </div>
                    <div className="text-sm text-gray-500">
                        {item.description}
                    </div>
                    {item.color && (
                        <div className="text-xs text-gray-400 mt-1">
                            Rəng: {item.color}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'fabric_details',
            label: 'Parça məlumatları',
            render: (item: CustomerItem) => (
                <div>
                    {item.fabric_type ? (
                        <div className="text-sm text-gray-900">{item.fabric_type}</div>
                    ) : (
                        <span className="text-gray-500 text-sm">-</span>
                    )}
                    {item.measurements && Object.keys(item.measurements).length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                            {Object.keys(item.measurements).length} ölçü
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'received_date',
            label: 'Qəbul tarixi',
            sortable: true,
            render: (item: CustomerItem) =>
                item.received_date ?
                    new Date(item.received_date).toLocaleDateString('az-AZ') :
                    <span className="text-gray-500">-</span>,
        },
        {
            key: 'services_count',
            label: 'Xidmətlər',
            render: (item: CustomerItem) => (
                <div className="text-center">
                    <div className="font-medium">
                        {item.tailor_services?.length || 0} ədəd
                    </div>
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            render: (item: CustomerItem) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {item.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
        },
    ];

    const filters_config: Filter[] = [
        {
            key: 'customer_id',
            label: 'Müştəri',
            type: 'dropdown',
            options: [
                { value: '', label: 'Bütün müştərilər' },
                ...customers.map(customer => ({
                    value: customer.id.toString(),
                    label: customer.name
                }))
            ],
            value: localFilters.customer_id?.toString() || '',
            onChange: (value: string) => handleFilter('customer_id', value),
        },
        {
            key: 'is_active',
            label: 'Status',
            type: 'dropdown',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: '1', label: 'Aktiv' },
                { value: '0', label: 'Qeyri-aktiv' },
            ],
            value: localFilters.is_active !== undefined ? (localFilters.is_active ? '1' : '0') : '',
            onChange: (value: string) => handleFilter('is_active', value),
        },
    ];

    const actions: Action[] = [
        {
            label: 'Bax',
            href: (item: CustomerItem) => route('customer-items.show', item.id),
            variant: 'primary',
        },
        {
            label: 'Düzəliş et',
            href: (item: CustomerItem) => route('customer-items.edit', item.id),
            variant: 'secondary',
        },
        {
            label: 'Sil',
            onClick: (item: CustomerItem) => {
                if (confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
                    router.delete(route('customer-items.destroy', item.id));
                }
            },
            variant: 'danger',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Müştəri məhsulları
                    </h2>
                    <Link href={route('customer-items.create')}>
                        <PrimaryButton>
                            Yeni məhsul
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Müştəri məhsulları" />

            <div className="py-12">
                <div className="w-full">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <SharedDataTable
                            data={{
                                data: customerItems.data,
                                links: customerItems.links,
                                current_page: customerItems.meta?.current_page || 1,
                                last_page: customerItems.meta?.last_page || 1,
                                total: customerItems.meta?.total || 0,
                                per_page: customerItems.meta?.per_page || 15,
                                from: customerItems.meta?.from || 0,
                                to: customerItems.meta?.to || 0
                            }}
                            columns={columns}
                            filters={filters_config}
                            actions={actions}
                            searchPlaceholder="Məhsul, müştəri və ya referans nömrəsi ilə axtar..."
                            emptyState={{
                                title: "Heç bir məhsul tapılmadı",
                                description: "İlk müştəri məhsulunu əlavə etməklə başlayın."
                            }}
                            onSearchChange={(search: string) => handleSearch(search)}
                            onSort={(field: string) => handleSort(field, 'asc')}
                            fullWidth={true}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
