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
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('customers');
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    // Define columns for the table
    const columns: Column[] = [
        {
            key: 'name',
            label: t('fields.customer'),
            mobileLabel: t('fields.name'),
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
            label: t('fields.contactInfo'),
            mobileLabel: t('fields.phone'),
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
            label: t('vehiclesServices.vehicles'),
            mobileLabel: t('vehiclesServices.vehicles'),
            sortable: true,
            align: 'center',
            hideOnMobile: true,
            render: (customer: Customer) => (
                <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                        {t('vehiclesServices.vehiclesCount', { count: customer.active_vehicles_count || 0 })}
                    </div>
                    <div className="text-xs text-gray-500">
                        {t('vehiclesServices.servicesCount', { count: customer.total_service_records || 0 })}
                    </div>
                </div>
            ),
            width: '140px'
        },
        {
            key: 'last_service_date',
            label: t('serviceHistory.lastService'),
            sortable: true,
            align: 'center',
            hideOnMobile: true,
            render: (customer: Customer) => (
                <div className="text-sm text-gray-900">
                    {customer.last_service_date ? (
                        new Date(customer.last_service_date).toLocaleDateString('az-AZ')
                    ) : (
                        <span className="text-gray-500">{t('serviceHistory.noServices')}</span>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'is_active',
            label: t('fields.status'),
            sortable: true,
            align: 'center',
            render: (customer: Customer) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {customer.is_active ? t('status.active') : t('status.inactive')}
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
            label: t('fields.customerType'),
            value: selectedType,
            onChange: setSelectedType,
            options: [
                { value: '', label: t('types.allTypes') },
                { value: 'individual', label: t('types.individual') },
                { value: 'corporate', label: t('types.corporate') },
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'status',
            type: 'dropdown',
            label: t('fields.status'),
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: '', label: t('status.allStatuses') },
                { value: 'active', label: t('status.active') },
                { value: 'inactive', label: t('status.inactive') },
            ],
            className: 'min-w-[120px]'
        }
    ];

    // Define actions
    const actions: Action[] = [
        {
            label: t('actions.view'),
            href: (customer: Customer) => `/customers/${customer.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: t('actions.edit'),
            href: (customer: Customer) => `/customers/${customer.id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: t('actions.delete'),
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
        if (confirm(t('messages.confirmDelete'))) {
            router.delete(`/customers/${customer.id}`);
        }
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />

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
                        searchPlaceholder={t('placeholders.search')}
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
                        title={t('title')}
                        subtitle={t('stats.registered', { count: customers.total })}
                        createButton={{
                            label: t('addCustomer'),
                            href: "/customers/create"
                        }}

                        // Empty state
                        emptyState={{
                            icon: <UserIcon className="w-12 h-12" />,
                            title: t('emptyState.title'),
                            description: t('emptyState.description'),
                            action: (
                                <Link
                                    href="/customers/create"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    {t('addCustomer')}
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
                        fullWidth={true}
                        mobileClickable={true}
                        hideMobileActions={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}