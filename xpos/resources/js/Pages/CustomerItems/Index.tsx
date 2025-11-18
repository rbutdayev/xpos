import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, Action } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { CustomerItem, PageProps } from '@/types';
import { SERVICE_TYPES, ServiceType, getCurrentServiceType, getServiceConfig } from '@/config/serviceTypes';

interface CustomerItemsIndexProps extends PageProps {
    items: {
        data: CustomerItem[];
        links: any[];
        meta: any;
    };
    customers: Array<{ id: number; name: string }>;
    filters: {
        search?: string;
        type?: string;
        customer_id?: number;
        status?: string;
    };
}

export default function Index({ items, customers, filters }: CustomerItemsIndexProps) {
    const [localFilters, setLocalFilters] = useState(filters);

    // Get current service type (default to 'tailor' for backward compatibility)
    const currentServiceType: ServiceType = 'tailor'; // We can enhance this later with URL params
    const serviceConfig = getServiceConfig(currentServiceType);

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
            key: 'reference',
            label: 'Referans',
            sortable: true,
            render: (item: CustomerItem) => (
                <div>
                    <Link
                        href={route('customer-items.show', item.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        {item.reference_number}
                    </Link>
                    <div className="text-xs text-gray-500 mt-1">
                        {item.received_date && new Date(item.received_date).toLocaleDateString('az-AZ')}
                    </div>
                </div>
            ),
        },
        {
            key: 'customer',
            label: 'Müştəri',
            sortable: true,
            render: (item: CustomerItem) => (
                <div className="flex items-center">
                    <div>
                        <div className="font-medium text-gray-900">
                            {item.customer?.name}
                        </div>
                        {item.customer?.phone && (
                            <div className="text-xs text-gray-500">
                                {item.customer.phone}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'item_details',
            label: 'Məhsul məlumatları',
            mobileLabel: 'Məhsul',
            hideOnMobile: true,
            render: (item: CustomerItem) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {item.item_type}
                        {item.color && <span className="text-gray-600"> - {item.color}</span>}
                    </div>
                    {item.description && (
                        <div className="text-sm text-gray-500">
                            {item.description}
                        </div>
                    )}
                    {item.fabric_type && (
                        <div className="text-xs text-gray-400 mt-1">
                            {item.fabric_type}
                            {item.size && <span> • Ölçü: {item.size}</span>}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'services_count',
            label: 'Xidmət tarixçəsi',
            mobileLabel: 'Xidmət',
            hideOnMobile: true,
            render: (item: CustomerItem) => {
                const count = item.tailor_services?.length || 0;
                return (
                    <div className="text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {count} xidmət
                        </div>
                        {count > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                                {count === 1 ? '1 dəfə təmir' : `${count} dəfə təmir`}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Vəziyyət',
            sortable: true,
            render: (item: CustomerItem) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    item.status_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    item.status_color === 'green' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {item.status_text}
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
            onChange: (value: string) => handleFilter('customer_id', value || undefined),
        },
        {
            key: 'type',
            label: 'Növ',
            type: 'dropdown',
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'Jacket', label: 'Gödəkçə' },
                { value: 'Dress', label: 'Paltar' },
                { value: 'Suit', label: 'Kostyum' },
                { value: 'Pants', label: 'Şalvar' },
                { value: 'Shirt', label: 'Köynək' },
                { value: 'Coat', label: 'Palto' },
                { value: 'Other', label: 'Digər' },
            ],
            value: (localFilters as any).type || '',
            onChange: (value: string) => handleFilter('type', value),
        },
        {
            key: 'status',
            label: 'Vəziyyət',
            type: 'dropdown',
            options: [
                { value: '', label: 'Bütün vəziyyətlər' },
                { value: 'received', label: 'Qəbul edildi' },
                { value: 'in_service', label: 'İşdə' },
                { value: 'completed', label: 'Hazır' },
                { value: 'delivered', label: 'Təhvil verildi' },
            ],
            value: (localFilters as any).status || '',
            onChange: (value: string) => handleFilter('status', value),
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
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Müştəri Məhsulları
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Müştərilərdən qəbul edilmiş məhsulların siyahısı və xidmət tarixçəsi
                        </p>
                    </div>
                    <Link href={route('customer-items.create')}>
                        <PrimaryButton>
                            Yeni məhsul əlavə et
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Müştəri Məhsulları" />

            <div className="py-12">
                <div className="w-full">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <SharedDataTable
                            data={{
                                data: items.data,
                                links: items.links,
                                current_page: items.meta?.current_page || 1,
                                last_page: items.meta?.last_page || 1,
                                total: items.meta?.total || 0,
                                per_page: items.meta?.per_page || 15,
                                from: items.meta?.from || 0,
                                to: items.meta?.to || 0
                            }}
                            columns={columns}
                            filters={filters_config}
                            actions={actions}
                            searchValue={localFilters.search || ''}
                            searchPlaceholder="Məhsul, müştəri və ya referans nömrəsi ilə axtar..."
                            emptyState={{
                                title: "Heç bir məhsul tapılmadı",
                                description: "Müştəridən qəbul edilən ilk məhsulu əlavə etməklə başlayın. Hər məhsul üçün ayrıca xidmət tarixçəsi saxlanılır."
                            }}
                            onSearchChange={(search: string) => handleSearch(search)}
                            onSort={(field: string) => handleSort(field, 'asc')}
                            fullWidth={true}
                            mobileClickable={true}
                            hideMobileActions={true}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
