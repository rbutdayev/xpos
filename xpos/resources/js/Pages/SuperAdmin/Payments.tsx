import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { EyeIcon, PencilIcon, TrashIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface AccountPayment {
    id: number;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'pending' | 'paid' | 'overdue';
    notes?: string;
}

interface ActiveModule {
    module_id: string;
    module_name: string;
    price: number;
}

interface Account {
    id: number;
    company_name: string;
    email: string;
    phone?: string;
    monthly_payment_amount?: number;
    payment_start_date?: string;
    is_active: boolean;
    users_count: number;
    payment_status: string;
    latest_payment?: AccountPayment;
    next_due_date?: string;
    active_modules?: ActiveModule[];
    module_total?: number;
}

interface Props {
    accounts: {
        data: Account[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search?: string;
    status?: string;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function SuperAdminPayments({ accounts, search, status, flash }: Props) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [statusFilter, setStatusFilter] = useState(status || '');
    const [editingPaymentSettings, setEditingPaymentSettings] = useState<Account | null>(null);
    const [hoveredAccount, setHoveredAccount] = useState<number | null>(null);

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        monthly_payment_amount: '',
        payment_start_date: '',
    });

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        window.location.href = `/admin/payments?${params.toString()}`;
    };

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('');
        window.location.href = '/admin/payments';
    };

    const handleMarkAsPaid = (accountId: number, companyName: string) => {
        if (confirm(`${companyName} üçün ödənişi ödənilmiş kimi qeyd etmək istədiyinizdən əminsiniz?`)) {
            router.post(route('superadmin.payments.mark-paid', accountId), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleMarkAsUnpaid = (accountId: number, companyName: string) => {
        if (confirm(`${companyName} üçün ödənişi ödənilməmiş kimi qeyd etmək istədiyinizdən əminsiniz?`)) {
            router.post(route('superadmin.payments.mark-unpaid', accountId), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleEditPaymentSettings = (account: Account) => {
        setEditingPaymentSettings(account);
        setEditData({
            monthly_payment_amount: account.monthly_payment_amount?.toString() || '',
            payment_start_date: account.payment_start_date || '',
        });
    };

    const handleUpdatePaymentSettings = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPaymentSettings) {
            put(route('superadmin.payments.update-settings', editingPaymentSettings.id), {
                onSuccess: () => {
                    setEditingPaymentSettings(null);
                    resetEdit();
                },
                preserveScroll: true,
            });
        }
    };

    const handleToggleAccountStatus = (accountId: number, isActive: boolean, companyName: string) => {
        const action = isActive ? 'dayandırmaq' : 'aktivləşdirmək';
        if (confirm(`${companyName} hesabını ${action} istədiyinizdən əminsiniz?`)) {
            router.patch(route('superadmin.payments.toggle-status', accountId), {}, {
                preserveScroll: true,
            });
        }
    };

    // Handle double-click to view account details
    const handleRowDoubleClick = (account: Account) => {
        // For now, just open the edit payment settings
        handleEditPaymentSettings(account);
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} hesabı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('superadmin.payments.bulk-delete'), {
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
    const getBulkActions = (selectedIds: (string | number)[], selectedAccounts: Account[]): BulkAction[] => {
        // If only ONE account is selected, show individual actions
        if (selectedIds.length === 1 && selectedAccounts.length === 1) {
            const account = selectedAccounts[0];

            const actions: BulkAction[] = [
                {
                    label: 'Modul Tarixçəsinə Bax',
                    icon: <ClockIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('superadmin.payments.module-history', account.id))
                },
                {
                    label: 'Redaktə',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => handleEditPaymentSettings(account)
                }
            ];

            // Add payment-specific actions if payment settings exist
            if (account.monthly_payment_amount) {
                if (account.payment_status !== 'paid') {
                    actions.unshift({
                        label: 'Ödənilmiş qeyd et',
                        icon: <EyeIcon className="w-4 h-4" />,
                        variant: 'view' as const,
                        onClick: () => handleMarkAsPaid(account.id, account.company_name)
                    });
                } else {
                    actions.unshift({
                        label: 'Ödənilməmiş qeyd et',
                        icon: <EyeIcon className="w-4 h-4" />,
                        variant: 'secondary' as const,
                        onClick: () => handleMarkAsUnpaid(account.id, account.company_name)
                    });
                }
            }

            // Add toggle status action
            actions.push({
                label: account.is_active ? 'Dayandır' : 'Aktivləşdir',
                icon: <PencilIcon className="w-4 h-4" />,
                variant: account.is_active ? 'danger' as const : 'view' as const,
                onClick: () => handleToggleAccountStatus(account.id, account.is_active, account.company_name)
            });

            actions.push({
                label: 'Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: () => {
                    if (confirm(`${account.company_name} hesabını silmək istədiyinizə əminsiniz?`)) {
                        router.delete(route('superadmin.payments.destroy', account.id));
                    }
                }
            });

            return actions;
        }

        // Multiple accounts selected - show bulk actions
        return [
            {
                label: 'Toplu Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };


    const getStatusBadge = (status: string) => {
        const badges = {
            paid: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            overdue: 'bg-red-100 text-red-800',
            none: 'bg-gray-100 text-gray-800',
        };
        const labels = {
            paid: 'Ödənilib',
            pending: 'Gözləyir',
            overdue: 'Gecikmiş',
            none: 'Təyin edilməyib',
        };
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges] || badges.none}`}>
                {labels[status as keyof typeof labels] || 'Bilinmir'}
            </span>
        );
    };

    // Define table columns
    const tableColumns = [
        {
            key: 'company_name',
            label: 'Şirkət',
            sortable: true,
            render: (account: Account) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {account.company_name}
                    </div>
                    <div className="text-sm text-gray-500">
                        {account.email}
                    </div>
                </div>
            )
        },
        {
            key: 'monthly_payment_amount',
            label: 'Aylıq Məbləğ',
            sortable: true,
            render: (account: Account) => {
                if (!account.monthly_payment_amount && !account.module_total) {
                    return <span className="text-sm text-gray-400">-</span>;
                }

                const hasModules = account.active_modules && account.active_modules.length > 0;
                const showBreakdown = hasModules && account.module_total;

                return (
                    <div
                        className="relative"
                        onMouseEnter={() => setHoveredAccount(account.id)}
                        onMouseLeave={() => setHoveredAccount(null)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-900">
                                {account.monthly_payment_amount || 0} ₼
                            </div>
                            {showBreakdown && (
                                <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                            )}
                        </div>

                        {/* Tooltip */}
                        {showBreakdown && hoveredAccount === account.id && (
                            <div className="absolute z-10 left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3">
                                <div className="text-xs font-semibold text-gray-700 mb-2">
                                    Modul Tərkibi
                                </div>
                                <div className="space-y-1.5">
                                    {account.active_modules?.map((module) => (
                                        <div key={module.module_id} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">{module.module_name}</span>
                                            <span className="font-medium text-gray-900">{module.price.toFixed(2)} ₼</span>
                                        </div>
                                    ))}
                                    <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-700">Aylıq Ödəniş</span>
                                        <span className="text-xs font-bold text-indigo-700">{account.module_total?.toFixed(2)} ₼</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'next_due_date',
            label: 'Növbəti Ödəniş',
            sortable: true,
            render: (account: Account) => (
                account.next_due_date ? (
                    <div className="text-sm text-gray-900">
                        {new Date(account.next_due_date).toLocaleDateString('az-AZ')}
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">-</span>
                )
            )
        },
        {
            key: 'payment_status',
            label: 'Status',
            sortable: true,
            render: (account: Account) => getStatusBadge(account.payment_status)
        },
        {
            key: 'is_active',
            label: 'Hesab',
            sortable: true,
            render: (account: Account) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    account.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {account.is_active ? 'Aktiv' : 'Dayandırılıb'}
                </span>
            )
        }
    ];

    const tableFilters = [
        {
            key: 'status',
            type: 'dropdown' as const,
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'paid', label: 'Ödənilib' },
                { value: 'pending', label: 'Gözləyir' },
                { value: 'overdue', label: 'Gecikmiş' }
            ]
        }
    ];

    return (
        <SuperAdminLayout title="Ödənişlər İdarəsi">
            <Head title="Ödənişlər - Super Admin" />

            {flash?.success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Uğurlu</h3>
                            <div className="mt-2 text-sm text-green-700">{flash.success}</div>
                        </div>
                    </div>
                </div>
            )}

            {flash?.error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Xəta</h3>
                            <div className="mt-2 text-sm text-red-700">{flash.error}</div>
                        </div>
                    </div>
                </div>
            )}

                    {/* Edit Payment Settings Modal */}
                    {editingPaymentSettings && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Ödəniş Təyinatlarını Redaktə Et
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {editingPaymentSettings.company_name}
                                    </p>
                                    <form onSubmit={handleUpdatePaymentSettings} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Aylıq Ödəniş Məbləği (AZN) *</label>
                                            <TextInput
                                                type="number"
                                                step="0.01"
                                                value={editData.monthly_payment_amount}
                                                onChange={(e) => setEditData('monthly_payment_amount', e.target.value)}
                                                className={editErrors.monthly_payment_amount ? 'border-red-500' : ''}
                                                required
                                            />
                                            {editErrors.monthly_payment_amount && <span className="text-red-500 text-xs">{editErrors.monthly_payment_amount}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ödəniş Başlanğıc Tarixi *</label>
                                            <TextInput
                                                type="date"
                                                value={editData.payment_start_date}
                                                onChange={(e) => setEditData('payment_start_date', e.target.value)}
                                                className={editErrors.payment_start_date ? 'border-red-500' : ''}
                                                required
                                            />
                                            {editErrors.payment_start_date && <span className="text-red-500 text-xs">{editErrors.payment_start_date}</span>}
                                            <p className="text-xs text-gray-500 mt-1">Bu tarixdən etibarən aylıq ödənişlər hesablanacaq</p>
                                        </div>

                                        <div className="flex justify-end space-x-2">
                                            <SecondaryButton
                                                type="button"
                                                onClick={() => {
                                                    setEditingPaymentSettings(null);
                                                    resetEdit();
                                                }}
                                            >
                                                Ləğv et
                                            </SecondaryButton>
                                            <PrimaryButton type="submit" disabled={editProcessing}>
                                                {editProcessing ? 'Yenilənir...' : 'Yenilə'}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payments Table */}
                    <SharedDataTable
                        data={{
                            ...accounts,
                            links: [],
                            from: (accounts.current_page - 1) * accounts.per_page + 1,
                            to: Math.min(accounts.current_page * accounts.per_page, accounts.total)
                        }}
                        columns={tableColumns as any}
                        selectable={true}
                        bulkActions={getBulkActions}
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Hesab axtar..."
                        filters={tableFilters}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        title="Hesablar"
                        subtitle={`Cəmi ${accounts.total} hesab`}
                        emptyState={{
                            icon: <EyeIcon className="w-12 h-12" />,
                            title: 'Hesab tapılmadı',
                            description: 'Heç bir hesab qeydə alınmayıb'
                        }}
                        fullWidth={true}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={(account: Account) =>
                            `cursor-pointer hover:bg-blue-50 transition-all duration-200`
                        }
                    />
        </SuperAdminLayout>
    );
}
