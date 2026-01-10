import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Filter, Column, BulkAction } from '@/Components/SharedDataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { PageProps } from '@/types';
import { EyeIcon, PencilIcon, TrashIcon, CheckIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { getServiceConfig, getCurrentServiceType, routeParamToServiceType, serviceTypeToRouteParam } from '@/config/serviceTypes';

interface TailorService {
    id: number;
    service_number: string;
    customer: {
        id: number;
        name: string;
        phone?: string;
    };
    customer_item?: {
        id: number;
        display_name: string;
    };
    description: string;
    labor_cost: number;
    materials_cost: number;
    total_cost: number;
    received_date: string;
    promised_date?: string;
    status: string;
    status_text: string;
    status_color: string;
    payment_status: string;
    payment_status_text: string;
    payment_status_color: string;
    paid_amount: number;
    credit_amount: number;
    is_overdue: boolean;
}

interface Props extends PageProps {
    services: {
        data: TailorService[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        branch_id?: string;
    };
    branches: Array<{
        id: number;
        name: string;
    }>;
    stats: {
        total_credit: number;
        total_credit_amount: number;
        total_partial: number;
        total_partial_amount: number;
    };
    serviceType?: string;
}

export default function Index({ services, filters, branches, stats, serviceType }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    // Get service type from props or determine from URL/localStorage
    const currentServiceType = serviceType
        ? routeParamToServiceType(serviceType)
        : getCurrentServiceType();
    const serviceConfig = getServiceConfig(currentServiceType);
    const routeParam = serviceTypeToRouteParam(currentServiceType);

    const handleSearch = (search: string) => {
        const newFilters = { ...localFilters, search };
        setLocalFilters(newFilters);
        router.get(route('services.index', { serviceType: routeParam }), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('services.index', { serviceType: routeParam }), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: Column[] = [
        {
            key: 'service_number',
            label: 'Servis №',
            sortable: true,
            render: (service: TailorService) => (
                <div>
                    <Link
                        href={route('services.show', { serviceType: routeParam, tailorService: service.id })}
                        className="text-slate-600 hover:text-slate-800 font-medium"
                    >
                        {service.service_number}
                    </Link>
                    <div className="text-xs text-gray-500 mt-1">
                        {new Date(service.received_date).toLocaleDateString('az-AZ')}
                    </div>
                </div>
            ),
        },
        {
            key: 'customer',
            label: 'Müştəri',
            render: (service: TailorService) => (
                <div>
                    <div className="font-medium text-sm">{service.customer.name}</div>
                    {service.customer_item && (
                        <div className="text-xs text-gray-500">{service.customer_item.display_name}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'description',
            label: 'Xidmət',
            render: (service: TailorService) => (
                <div className="text-sm max-w-md truncate" title={service.description}>
                    {service.description}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (service: TailorService) => (
                <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.status_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''
                    }${
                        service.status_color === 'blue' ? 'bg-blue-100 text-blue-800' : ''
                    }${
                        service.status_color === 'green' ? 'bg-green-100 text-green-800' : ''
                    }${
                        service.status_color === 'purple' ? 'bg-purple-100 text-purple-800' : ''
                    }${
                        service.status_color === 'red' ? 'bg-red-100 text-red-800' : ''
                    }`}>
                        {service.status_text}
                    </span>
                    {service.is_overdue && (
                        <div className="text-xs text-red-600 font-medium">Gecikmiş</div>
                    )}
                </div>
            ),
        },
        {
            key: 'payment_status',
            label: 'Ödəniş',
            render: (service: TailorService) => (
                <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.payment_status_color === 'green' ? 'bg-green-100 text-green-800' : ''
                    }${
                        service.payment_status_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''
                    }${
                        service.payment_status_color === 'red' ? 'bg-red-100 text-red-800' : ''
                    }${
                        service.payment_status_color === 'orange' ? 'bg-orange-100 text-orange-800' : ''
                    }`}>
                        {service.payment_status_text}
                    </span>
                    {service.payment_status === 'partial' && service.credit_amount > 0 && (
                        <div className="text-xs text-orange-600 font-medium">
                            Qalıq: {parseFloat(service.credit_amount as any).toFixed(2)} ₼
                        </div>
                    )}
                    {service.payment_status === 'credit' && service.credit_amount > 0 && (
                        <div className="text-xs text-orange-600 font-medium">
                            Borc: {parseFloat(service.credit_amount as any).toFixed(2)} ₼
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'total_cost',
            label: 'Məbləğ',
            sortable: true,
            render: (service: TailorService) => (
                <div className="text-right font-medium">
                    {parseFloat(service.total_cost as any).toFixed(2)} ₼
                </div>
            ),
        },
    ];

    // Handle double-click to view service
    const handleRowDoubleClick = (service: TailorService) => {
        router.visit(route('services.show', { serviceType: routeParam, tailorService: service.id }));
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        if (confirm(`${selectedIds.length} xidməti silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz və stoklar geri qaytarılacaq.`)) {
            router.delete(route('services.bulk-delete', { serviceType: routeParam }), {
                data: { ids: selectedIds },
                onError: (errors) => {
                    alert('Xidmətləri silməkdə xəta baş verdi.');
                },
                preserveScroll: true
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedServices: TailorService[]): BulkAction[] => {
        // If only ONE service is selected, show individual actions
        if (selectedIds.length === 1 && selectedServices.length === 1) {
            const service = selectedServices[0];

            const actions: BulkAction[] = [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('services.show', { serviceType: routeParam, tailorService: service.id }))
                },
                {
                    label: 'Düzəliş et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('services.edit', { serviceType: routeParam, tailorService: service.id }))
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm('Bu xidməti silmək istədiyinizə əminsiniz?')) {
                            router.delete(route('services.destroy', { serviceType: routeParam, tailorService: service.id }));
                        }
                    }
                }
            ];

            // Add "Mark as Delivered" action if applicable
            if (service.status !== 'delivered' && service.status !== 'cancelled') {
                actions.splice(2, 0, {
                    label: 'Təhvil verildi',
                    icon: <CheckIcon className="w-4 h-4" />,
                    variant: 'success' as const,
                    onClick: () => {
                        if (confirm('Bu xidməti təhvil verildi olaraq işarələmək istədiyinizə əminsiniz?')) {
                            router.patch(route('services.update-status', { serviceType: routeParam, tailorService: service.id }), {
                                status: 'delivered'
                            });
                        }
                    }
                });
            }

            return actions;
        }

        // Multiple services selected - show bulk delete
        return [
            {
                label: 'Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    const tableFilters: Filter[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                { value: 'received', label: 'Qəbul edildi' },
                { value: 'in_progress', label: 'İşləniir' },
                { value: 'completed', label: 'Tamamlandı' },
                { value: 'delivered', label: 'Təhvil verildi' },
                { value: 'cancelled', label: 'Ləğv edildi' },
            ],
            value: localFilters.status || '',
            onChange: (value) => handleFilter('status', value),
        },
        {
            key: 'branch_id',
            label: 'Filial',
            type: 'dropdown',
            options: [
                { value: '', label: 'Hamısı' },
                ...branches.map(b => ({ value: b.id.toString(), label: b.name })),
            ],
            value: localFilters.branch_id || '',
            onChange: (value) => handleFilter('branch_id', value),
        },
        {
            key: 'date_from',
            label: 'Tarixdən',
            type: 'date',
            value: localFilters.date_from || '',
            onChange: (value) => handleFilter('date_from', value),
        },
        {
            key: 'date_to',
            label: 'Tarixədək',
            type: 'date',
            value: localFilters.date_to || '',
            onChange: (value) => handleFilter('date_to', value),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={serviceConfig.name} />

            <div className="py-12">
                <div className="w-full">
                    {/* Header with Create Button */}
                    <div className="mb-6 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-gray-900">{serviceConfig.name}</h1>
                            <Link
                                href={route('services.create', { serviceType: routeParam })}
                                className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600 focus:bg-blue-700 active:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <PlusCircleIcon className="w-5 h-5 mr-2" />
                                Yeni Xidmət
                            </Link>
                        </div>
                    </div>

                    {/* Payment Statistics */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-800">Tam Borc</p>
                                    <p className="text-2xl font-bold text-orange-900">{stats.total_credit}</p>
                                    <p className="text-sm text-orange-600 mt-1">
                                        Məbləğ: {parseFloat(stats.total_credit_amount as any).toFixed(2)} ₼
                                    </p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-full">
                                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Qismən Ödəniş</p>
                                    <p className="text-2xl font-bold text-yellow-900">{stats.total_partial}</p>
                                    <p className="text-sm text-yellow-600 mt-1">
                                        Qalan borc: {parseFloat(stats.total_partial_amount as any).toFixed(2)} ₼
                                    </p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <SharedDataTable
                            data={{
                                data: services.data,
                                links: services.links,
                                current_page: services.meta?.current_page || 1,
                                last_page: services.meta?.last_page || 1,
                                total: services.meta?.total || 0,
                                per_page: services.meta?.per_page || 15,
                                from: services.meta?.from || 0,
                                to: services.meta?.to || 0
                            }}
                            columns={columns}
                            filters={tableFilters}
                            selectable={true}
                            bulkActions={getBulkActions}
                            searchValue={localFilters.search || ''}
                            searchPlaceholder="Servis №, müştəri və ya xidmət axtarın..."
                            emptyState={{
                                title: serviceConfig.emptyStateTitle,
                                description: serviceConfig.emptyStateDesc
                            }}
                            onSearchChange={(search: string) => handleSearch(search)}
                            onRowDoubleClick={handleRowDoubleClick}
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
