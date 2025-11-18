import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';
import { Customer } from '@/types';
import { 
    UserIcon, 
    PhoneIcon, 
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface Props {
    customers: {
        data: Customer[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
        sort_field?: string;
        sort_direction?: 'asc' | 'desc';
    };
}

export default function Index({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    // Define columns for the table
    const columns: Column[] = [
        {
            key: 'name',
            label: 'Müştəri',
            mobileLabel: 'Ad',
            sortable: true,
            render: (customer: Customer) => (
                <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {customer.customer_type_text}
                        </div>
                        {customer.tax_number && (
                            <div className="text-xs text-gray-400">
                                VÖEN: {customer.tax_number}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'contact',
            label: 'Əlaqə məlumatları',
            mobileLabel: 'Telefon',
            hideOnMobile: true,
            render: (customer: Customer) => (
                <div className="text-sm">
                    {customer.phone && (
                        <div className="flex items-center text-gray-900 mb-1">
                            <PhoneIcon className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{customer.formatted_phone}</span>
                        </div>
                    )}
                    {customer.email && (
                        <div className="text-gray-500 truncate">
                            {customer.email}
                        </div>
                    )}
                    {!customer.phone && !customer.email && (
                        <span className="text-gray-500">-</span>
                    )}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'vehicles_count',
            label: 'Nəqliyyat vasitələri',
            mobileLabel: 'Nəqliyyat',
            sortable: true,
            align: 'center',
            hideOnMobile: true,
            render: (customer: Customer) => (
                <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                        {customer.active_vehicles_count || 0} ədəd
                    </div>
                    <div className="text-xs text-gray-500">
                        {customer.total_service_records || 0} servis
                    </div>
                </div>
            ),
            width: '140px'
        },
        {
            key: 'last_service_date',
            label: 'Son servis',
            sortable: true,
            align: 'center',
            hideOnMobile: true,
            render: (customer: Customer) => (
                <div className="text-sm text-gray-900">
                    {customer.last_service_date ? (
                        new Date(customer.last_service_date).toLocaleDateString('az-AZ')
                    ) : (
                        <span className="text-gray-500">Servis yoxdur</span>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (customer: Customer) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {customer.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        }
    ];

    // Define filters
    const tableFilters: Filter[] = [
        {
            key: 'type',
            type: 'dropdown',
            label: 'Müştəri növü',
            value: selectedType,
            onChange: setSelectedType,
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'individual', label: 'Fiziki şəxs' },
                { value: 'corporate', label: 'Hüquqi şəxs' },
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'status',
            type: 'dropdown',
            label: 'Status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' },
            ],
            className: 'min-w-[120px]'
        }
    ];

    // Define actions
    const actions: Action[] = [
        {
            label: 'Bax',
            href: (customer: Customer) => `/customers/${customer.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Düzəliş',
            href: (customer: Customer) => `/customers/${customer.id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            onClick: (customer: Customer) => handleDelete(customer),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (customer: Customer) => customer.is_active // Only show delete for active customers
        }
    ];

    // Event handlers
    const handleSearch = () => {
        router.get('/customers', {
            search,
            type: selectedType,
            status: selectedStatus,
            sort_field: filters.sort_field,
            sort_direction: filters.sort_direction,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedType('');
        setSelectedStatus('');
        router.get('/customers', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (column: string) => {
        const direction = filters.sort_field === column && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        
        router.get('/customers', {
            search,
            type: selectedType,
            status: selectedStatus,
            sort_field: column,
            sort_direction: direction,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/customers', {
            search,
            type: selectedType,
            status: selectedStatus,
            sort_field: filters.sort_field,
            sort_direction: filters.sort_direction,
            per_page: perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (customer: Customer) => {
        if (confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) {
            router.delete(`/customers/${customer.id}`);
        }
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Müştərilər
                </h2>
            }
        >
            <Head title="Müştərilər" />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <SharedDataTable
                        // Core data
                        data={customers}
                        columns={columns}
                        actions={actions}

                        // Search & Filter
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Müştəri axtar (ad, telefon, email)..."
                        filters={tableFilters}

                        // Sorting
                        onSort={handleSort}
                        sortField={filters.sort_field}
                        sortDirection={filters.sort_direction as 'asc' | 'desc'}

                        // Pagination
                        onPerPageChange={handlePerPageChange}

                        // Actions
                        onSearch={handleSearch}
                        onReset={handleReset}
                        onRefresh={handleRefresh}

                        // UI Configuration
                        title="Müştərilər"
                        subtitle={`${customers.total} müştəri qeydiyyatda`}
                        createButton={{
                            label: "Müştəri əlavə et",
                            href: "/customers/create"
                        }}

                        // Empty state
                        emptyState={{
                            icon: <UserIcon className="w-12 h-12" />,
                            title: "Müştəri tapılmadı",
                            description: "İlk müştərinizi əlavə etməklə başlayın.",
                            action: (
                                <Link
                                    href="/customers/create"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Müştəri əlavə et
                                </Link>
                            )
                        }}

                        // Advanced features
                        selectable={false}
                        sticky={true}
                        dense={false}

                        // Row customization
                        rowClassName={(customer: Customer) =>
                            customer.is_active ? '' : 'opacity-60'
                        }

                        // Mobile responsiveness
                        mobileClickable={true}
                        hideMobileActions={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}