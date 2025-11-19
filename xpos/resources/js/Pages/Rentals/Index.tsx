import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Rental {
    id: number;
    rental_number: string;
    customer: {
        id: number;
        name: string;
        phone: string;
    };
    branch: {
        id: number;
        name: string;
    };
    rental_start_date: string;
    rental_end_date: string;
    status: string;
    status_label: string;
    payment_status: string;
    payment_status_label: string;
    total_cost: number;
    paid_amount: number;
    remaining_balance: number;
    is_overdue: boolean;
    days_overdue: number;
    collateral_type: string;
    collateral_type_label: string;
}

interface Props {
    rentals: {
        data: Rental[];
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
        status?: string;
        payment_status?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ rentals, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(filters.payment_status || '');

    const handleSearch = () => {
        router.get(route('rentals.index'), {
            search: searchValue,
            status: statusFilter,
            payment_status: paymentStatusFilter,
            sort: filters.sort,
            direction: filters.direction
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleReset = () => {
        setSearchValue('');
        setStatusFilter('');
        setPaymentStatusFilter('');
        router.get(route('rentals.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSort = (column: string) => {
        const newDirection = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('rentals.index'), {
            ...filters,
            sort: column,
            direction: newDirection
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('rentals.index'), {
            ...filters,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleDeleteAction = (rental: Rental) => {
        if (confirm(`"${rental.rental_number}" kirayəsini silmək istədiyinizə əminsiniz?`)) {
            router.delete(route('rentals.destroy', rental.id));
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'reserved':
                return 'bg-blue-100 text-blue-800';
            case 'returned':
                return 'bg-gray-100 text-gray-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusBadgeClass = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800';
            case 'credit':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        {
            key: 'rental_number',
            label: 'Kirayə №',
            sortable: true,
            render: (rental: Rental) => (
                <a href={route('rentals.show', rental.id)} className="text-blue-600 hover:text-blue-800 font-medium">
                    {rental.rental_number}
                </a>
            )
        },
        {
            key: 'customer',
            label: 'Müştəri',
            sortable: false,
            render: (rental: Rental) => (
                <div>
                    <div className="font-medium text-gray-900">{rental.customer.name}</div>
                    <div className="text-sm text-gray-500">{rental.customer.phone}</div>
                </div>
            )
        },
        {
            key: 'rental_dates',
            label: 'Kirayə Müddəti',
            sortable: false,
            render: (rental: Rental) => (
                <div className="text-sm">
                    <div>{rental.rental_start_date}</div>
                    <div className="text-gray-500">→ {rental.rental_end_date}</div>
                    {rental.is_overdue && (
                        <div className="text-red-600 font-medium mt-1">
                            {rental.days_overdue} gün gecikmiş
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (rental: Rental) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(rental.status)}`}>
                    {rental.status_label}
                </span>
            )
        },
        {
            key: 'payment_status',
            label: 'Ödəniş',
            sortable: true,
            render: (rental: Rental) => (
                <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadgeClass(rental.payment_status)}`}>
                        {rental.payment_status_label}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                        {Number(rental.total_cost || 0).toFixed(2)} AZN
                    </div>
                </div>
            )
        },
        {
            key: 'collateral_type',
            label: 'Girov',
            sortable: false,
            render: (rental: Rental) => (
                <span className="text-sm text-gray-700">
                    {rental.collateral_type_label}
                </span>
            )
        },
        {
            key: 'branch',
            label: 'Filial',
            sortable: false,
            render: (rental: Rental) => rental.branch.name
        }
    ];

    const actions = [
        {
            label: 'Bax',
            href: (rental: Rental) => route('rentals.show', rental.id),
            className: 'text-blue-600 hover:text-blue-900'
        },
        {
            label: 'Redaktə et',
            href: (rental: Rental) => route('rentals.edit', rental.id),
            className: 'text-indigo-600 hover:text-indigo-900',
            condition: (rental: Rental) => ['reserved', 'active', 'overdue'].includes(rental.status)
        },
        {
            label: 'Sil',
            onClick: handleDeleteAction,
            className: 'text-red-600 hover:text-red-900',
            condition: (rental: Rental) => rental.status === 'cancelled'
        }
    ];

    const filtersConfig = [
        {
            key: 'status',
            label: 'Status',
            type: 'dropdown' as const,
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'reserved', label: 'Rezerv edilib' },
                { value: 'active', label: 'Aktiv' },
                { value: 'overdue', label: 'Gecikmiş' },
                { value: 'returned', label: 'Qaytarılıb' },
                { value: 'cancelled', label: 'Ləğv edilib' }
            ]
        },
        {
            key: 'payment_status',
            label: 'Ödəniş Statusu',
            type: 'dropdown' as const,
            value: paymentStatusFilter,
            onChange: setPaymentStatusFilter,
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'paid', label: 'Ödənilib' },
                { value: 'partial', label: 'Qismən ödənilib' },
                { value: 'credit', label: 'Borclu' }
            ]
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Kirayələr" />

            <div className="w-full">
                <SharedDataTable
                    data={rentals}
                    columns={columns}
                    actions={actions}

                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder="Kirayə nömrəsi, müştəri adı və ya telefon ilə axtarın..."
                    filters={filtersConfig}

                    onSort={handleSort}
                    sortField={filters.sort}
                    sortDirection={filters.direction as 'asc' | 'desc'}

                    onPerPageChange={handlePerPageChange}

                    onSearch={handleSearch}
                    onReset={handleReset}

                    title="Kirayələr"
                    subtitle="Məhsul kirayələrini idarə edin"
                    createButton={{
                        label: 'Yeni Kirayə',
                        href: route('rentals.create')
                    }}

                    emptyState={{
                        icon: <ClockIcon className="w-12 h-12" />,
                        title: 'Kirayə tapılmadı',
                        description: 'Hələ heç bir kirayə mövcud deyil. İlk kirayənizi yaradın.',
                        action: (
                            <a
                                href={route('rentals.create')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                Yeni Kirayə
                            </a>
                        )
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
