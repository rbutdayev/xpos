import { Head, router, usePage, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { PlusIcon, ClockIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
    items: Array<{
        id: number;
        product_name: string;
        quantity: number;
        product?: {
            name: string;
            sku?: string;
        };
    }>;
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
    const { flash } = usePage<any>().props as { flash?: { success?: string; error?: string } };

    // Show flash messages as toasts
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

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

    // Handle double-click to view rental
    const handleRowDoubleClick = (rental: Rental) => {
        router.visit(route('rentals.show', rental.id));
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `${selectedIds.length} kirayəni silmək istədiyinizə əminsiniz?`;

        if (confirm(confirmMessage)) {
            router.post(route('rentals.bulk-delete'), {
                ids: selectedIds
            }, {
                onError: (errors) => {
                    toast.error('Kirayələr silinərkən xəta baş verdi.');
                },
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kirayələr uğurla silindi.');
                }
            });
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
            label: 'Müştəri / Məhsul',
            sortable: false,
            render: (rental: Rental) => {
                const firstProduct = rental.items?.[0];
                const productName = firstProduct?.product?.name || firstProduct?.product_name || '';
                const truncatedProduct = productName.length > 20 ? productName.substring(0, 20) + '...' : productName;
                const hasMultipleItems = rental.items && rental.items.length > 1;
                
                return (
                    <div>
                        <div className="font-medium text-gray-900 text-sm">{rental.customer.name}</div>
                        <div className="text-xs text-blue-600 font-medium">
                            {truncatedProduct}
                            {hasMultipleItems && (
                                <span className="ml-1 text-gray-500">(+{rental.items.length - 1})</span>
                            )}
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'rental_dates',
            label: 'Kirayə Müddəti',
            sortable: false,
            render: (rental: Rental) => {
                const startDate = new Date(rental.rental_start_date);
                const endDate = new Date(rental.rental_end_date);
                const timeDiff = endDate.getTime() - startDate.getTime();
                const dayCount = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
                
                return (
                    <div className="text-sm">
                        <div className="font-medium text-blue-600">{dayCount} gün</div>
                        <div className="text-xs text-gray-600">{rental.rental_start_date}</div>
                        <div className="text-xs text-gray-500">→ {rental.rental_end_date}</div>
                    </div>
                )
            }
        },
        {
            key: 'status',
            label: 'Status / Gecikmə',
            sortable: true,
            render: (rental: Rental) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endDate = new Date(rental.rental_end_date);
                endDate.setHours(0, 0, 0, 0);
                
                const isOverdue = today > endDate && rental.status !== 'returned' && rental.status !== 'completed' && rental.status !== 'cancelled';
                
                return (
                    <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(rental.status)}`}>
                            {rental.status_label}
                        </span>
                        {isOverdue && (
                            <div className="flex items-center text-xs">
                                <ClockIcon className="h-3 w-3 text-red-600 mr-1" />
                                <span className="font-medium text-red-600">
                                    {Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))} gün gecikmiş
                                </span>
                            </div>
                        )}
                    </div>
                )
            }
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
            key: 'branch',
            label: 'Filial',
            sortable: false,
            render: (rental: Rental) => rental.branch.name
        }
    ];

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedRentals: Rental[]): BulkAction[] => {
        // If only ONE rental is selected, show individual actions
        if (selectedIds.length === 1 && selectedRentals.length === 1) {
            const rental = selectedRentals[0];

            const actions: BulkAction[] = [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('rentals.show', rental.id))
                }
            ];

            // Add edit action only for reserved, active, or overdue rentals
            if (['reserved', 'active', 'overdue'].includes(rental.status)) {
                actions.push({
                    label: 'Redaktə et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('rentals.edit', rental.id))
                });
            }

            // Add delete action only for cancelled rentals
            if (rental.status === 'cancelled') {
                actions.push({
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDeleteAction(rental)
                });
            }

            return actions;
        }

        // Multiple rentals selected - show bulk delete only
        return [
            {
                label: 'Toplu Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

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
                    selectable={true}
                    bulkActions={getBulkActions}

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

                    onRowDoubleClick={handleRowDoubleClick}

                    mobileClickable={true}

                    hideMobileActions={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}
