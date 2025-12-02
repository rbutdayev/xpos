import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface AccountPayment {
    id: number;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'pending' | 'paid' | 'overdue';
    notes?: string;
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

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        monthly_payment_amount: '',
        payment_start_date: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        window.location.href = `/admin/payments?${params.toString()}`;
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

    return (
        <>
            <Head title="Ödənişlər - Super Admin" />

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Ödənişlər İdarəsi
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Hesabların ödəniş statusunu idarə edin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                    <SuperAdminNav />

                    {/* Search and Filter */}
                    <div className="mb-6">
                        <form onSubmit={handleSearch} className="flex items-center space-x-2">
                            <TextInput
                                type="text"
                                placeholder="Hesab axtar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            >
                                <option value="">Bütün statuslar</option>
                                <option value="paid">Ödənilib</option>
                                <option value="pending">Gözləyir</option>
                                <option value="overdue">Gecikmiş</option>
                            </select>
                            <SecondaryButton type="submit">Axtar</SecondaryButton>
                        </form>
                    </div>

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
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Hesablar ({accounts.total})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Şirkət
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aylıq Məbləğ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Növbəti Ödəniş
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hesab
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Əməliyyatlar
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {accounts.data.map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {account.company_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {account.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {account.monthly_payment_amount ? (
                                                    <div className="text-sm text-gray-900">
                                                        {account.monthly_payment_amount} ₼
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {account.next_due_date ? (
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(account.next_due_date).toLocaleDateString('az-AZ')}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(account.payment_status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    account.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {account.is_active ? 'Aktiv' : 'Dayandırılıb'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {account.monthly_payment_amount && account.payment_status !== 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(account.id, account.company_name)}
                                                            className="text-green-600 hover:text-green-900 font-medium"
                                                        >
                                                            Ödə
                                                        </button>
                                                    )}
                                                    {account.monthly_payment_amount && account.payment_status === 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkAsUnpaid(account.id, account.company_name)}
                                                            className="text-yellow-600 hover:text-yellow-900"
                                                        >
                                                            Ödənilməmiş
                                                        </button>
                                                    )}
                                                    {account.monthly_payment_amount && (
                                                        <button
                                                            onClick={() => handleEditPaymentSettings(account)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Redaktə
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleAccountStatus(account.id, account.is_active, account.company_name)}
                                                        className={account.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                                                    >
                                                        {account.is_active ? 'Dayandır' : 'Aktivləşdir'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {accounts.last_page > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {accounts.current_page > 1 && (
                                        <a
                                            href={`/admin/payments?page=${accounts.current_page - 1}`}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Əvvəlki
                                        </a>
                                    )}
                                    {accounts.current_page < accounts.last_page && (
                                        <a
                                            href={`/admin/payments?page=${accounts.current_page + 1}`}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Növbəti
                                        </a>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">{accounts.current_page}</span> / <span className="font-medium">{accounts.last_page}</span> səhifə
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
