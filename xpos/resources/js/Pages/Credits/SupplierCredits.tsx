import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { SupplierCredit } from '@/types';
import {
    BanknotesIcon,
    CurrencyDollarIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';

interface Props {
    credits: {
        data: SupplierCredit[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function SupplierCredits({ credits, filters = {} }: Props) {
    const { t } = useTranslation(['common', 'suppliers']);
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');

    const handleSearch = () => {
        router.get(route('credits.supplier'), { search, status }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        router.get(route('credits.supplier'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const deleteCredit = (credit: SupplierCredit) => {
        if (confirm(t('common:messages.confirmDelete', { name: credit.reference_number }))) {
            router.delete(route('credits.supplier.destroy', credit.id));
        }
    };

    const payCredit = (credit: SupplierCredit) => {
        // Navigate to pay page or open modal
        router.visit(route('credits.supplier.pay', credit.id));
    };

    const tableFilters = [
        {
            key: 'status',
            type: 'dropdown' as const,
            label: t('common:labels.status'),
            value: status,
            onChange: setStatus,
            options: [
                { value: '', label: t('common:status.all') },
                { value: 'pending', label: t('common:status.pending') },
                { value: 'partial', label: t('common:status.partial') },
                { value: 'paid', label: t('common:status.paid') }
            ]
        }
    ];

    const tableColumns: any = [
        {
            key: 'reference_number',
            label: t('common:fields.referenceNumber'),
            mobileLabel: t('common:fields.reference') as string,
            sortable: true,
            render: (credit: SupplierCredit) => (
                <div className="flex items-center">
                    <BanknotesIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {credit.reference_number}
                        </div>
                        {credit.description && (
                            <div className="text-xs text-gray-500 truncate">
                                {credit.description}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'supplier',
            label: t('suppliers:title'),
            mobileLabel: 'Supplier',
            sortable: true,
            render: (credit: SupplierCredit) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {credit.supplier?.name || '-'}
                    </div>
                    {(credit.supplier as any)?.phone && (
                        <div className="text-xs text-gray-500">
                            {(credit.supplier as any).phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'amount',
            label: t('common:fields.amount'),
            mobileLabel: t('common:fields.amount') as string,
            sortable: true,
            render: (credit: SupplierCredit) => (
                <div className="text-sm text-right">
                    <div className="font-medium text-gray-900">
                        {credit.amount.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼
                    </div>
                    {credit.remaining_amount > 0 && (
                        <div className="text-xs text-red-600">
                            {t('common:fields.remaining')}: {credit.remaining_amount.toLocaleString('az-AZ', { minimumFractionDigits: 2 })} ₼
                        </div>
                    )}
                </div>
            ),
            className: 'text-right'
        },
        {
            key: 'dates',
            label: t('common:fields.dates'),
            mobileLabel: t('common:fields.date') as string,
            hideOnMobile: true,
            render: (credit: SupplierCredit) => (
                <div className="text-sm text-gray-500">
                    <div>
                        {t('common:fields.creditDate')}: {new Date(credit.credit_date).toLocaleDateString('az-AZ')}
                    </div>
                    {credit.due_date && (
                        <div className={`text-xs ${new Date(credit.due_date) < new Date() && credit.status !== 'paid' ? 'text-red-600 font-medium' : ''}`}>
                            {t('common:fields.dueDate')}: {new Date(credit.due_date).toLocaleDateString('az-AZ')}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: t('common:labels.status'),
            mobileLabel: t('common:labels.status') as string,
            sortable: true,
            render: (credit: SupplierCredit) => {
                const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    partial: 'bg-blue-100 text-blue-800',
                    paid: 'bg-green-100 text-green-800'
                };
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[credit.status] || 'bg-gray-100 text-gray-800'}`}>
                        {t(`common:status.${credit.status}`)}
                    </span>
                );
            }
        },
        {
            key: 'branch',
            label: t('common:fields.branch'),
            mobileLabel: t('common:fields.branch') as string,
            hideOnMobile: true,
            render: (credit: SupplierCredit) => (
                <div className="text-sm text-gray-900">
                    {credit.branch?.name || '-'}
                </div>
            )
        }
    ];

    // Handle double-click to view credit
    const handleRowDoubleClick = (credit: SupplierCredit) => {
        // If you have a show page, use it, otherwise view details
        // router.visit(route('credits.supplier.show', credit.id));
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = t('common:messages.confirmBulkDelete', { count: selectedIds.length });

        if (!confirm(String(confirmMessage))) {
            return;
        }

        router.post(route('credits.supplier.bulk-delete'), {
            ids: selectedIds
        }, {
            onSuccess: () => {
                // Success message handled by backend
            },
            onError: (errors: any) => {
                alert(t('common:messages.error'));
            },
            preserveScroll: true
        });
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedCredits: SupplierCredit[]): BulkAction[] => {
        // If only ONE credit is selected, show individual actions
        if (selectedIds.length === 1 && selectedCredits.length === 1) {
            const credit = selectedCredits[0];

            const actions: BulkAction[] = [];

            // View action (if you have a show page)
            // actions.push({
            //     label: t('common:actions.view'),
            //     icon: <EyeIcon className="w-4 h-4" />,
            //     variant: 'view' as const,
            //     onClick: () => router.visit(route('credits.supplier.show', credit.id))
            // });

            // Pay action (only if not fully paid)
            if (credit.status !== 'paid' && credit.remaining_amount > 0) {
                actions.push({
                    label: t('common:actions.pay'),
                    icon: <CurrencyDollarIcon className="w-4 h-4" />,
                    variant: 'success' as const,
                    onClick: () => payCredit(credit)
                });
            }

            // Delete action
            actions.push({
                label: t('common:actions.delete'),
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: () => deleteCredit(credit)
            });

            return actions;
        }

        // Multiple credits selected - show bulk actions
        return [
            {
                label: t('common:actions.bulkDelete'),
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('suppliers:supplierCredits')} />

            <div className="w-full">
                <SharedDataTable
                    data={credits}
                    columns={tableColumns}
                    selectable={true}
                    bulkActions={getBulkActions}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={t('common:placeholders.search')}
                    filters={tableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    title={t('suppliers:supplierCredits')}
                    subtitle={t('suppliers:manageSupplierCredits')}
                    createButton={{
                        label: t('suppliers:newSupplierCredit'),
                        href: route('credits.supplier.create')
                    }}
                    emptyState={{
                        icon: <BanknotesIcon className="w-12 h-12" />,
                        title: t('suppliers:emptyState.noCredits'),
                        description: t('suppliers:emptyState.noCreditsDescription')
                    }}
                    fullWidth={true}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={(credit: SupplierCredit) =>
                        `cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                            credit.status === 'paid' ? 'opacity-70' : ''
                        }`
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}
