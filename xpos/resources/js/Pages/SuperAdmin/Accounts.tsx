import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface Account {
    id: number;
    company_name: string;
    email: string;
    phone?: string;
    subscription_plan: string;
    is_active: boolean;
    users_count: number;
    created_at: string;
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
    plan?: string;
    plans: {
        başlanğıc: string;
        professional: string;
        enterprise: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function SuperAdminAccounts({ accounts, search, plan, plans, flash }: Props) {
    const [searchTerm, setSearchTerm] = useState(search || '');
    const [planFilter, setPlanFilter] = useState(plan || '');
    const [showCreateForm, setShowCreateForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_email: '',
        user_password: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (planFilter) params.append('plan', planFilter);
        window.location.href = `/admin/accounts?${params.toString()}`;
    };

    const handleCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('superadmin.accounts.store'), {
            onSuccess: () => {
                reset();
                setShowCreateForm(false);
            },
        });
    };

    const handleDeleteAccount = (account: Account) => {
        if (confirm(`${account.company_name} hesabını silmək istədiyinizdən əminsiniz?`)) {
            router.delete(route('superadmin.accounts.destroy', account.id), {
                preserveScroll: true,
            });
        }
    };

    const handleToggleStatus = (account: Account) => {
        const action = account.is_active ? 'dayandırmaq' : 'aktivləşdirmək';
        if (confirm(`${account.company_name} hesabını ${action} istədiyinizdən əminsiniz?`)) {
            router.patch(route('superadmin.accounts.toggle-status', account.id), {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Hesablar - Super Admin" />
            
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Hesablar İdarəsi
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Bütün müştəri hesablarını idarə edin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">
                                        Uğurlu
                                    </h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        {flash.success}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {flash?.error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Xəta
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {flash.error}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <SuperAdminNav />

                    {/* Search and Create */}
                    <div className="flex justify-between items-center mb-6">
                        <form onSubmit={handleSearch} className="flex items-center space-x-2">
                            <TextInput
                                type="text"
                                placeholder="Hesab axtar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64"
                            />
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            >
                                <option value="">Bütün planlar</option>
                                <option value="başlanğıc">{plans.başlanğıc}</option>
                                <option value="professional">{plans.professional}</option>
                                <option value="enterprise">{plans.enterprise}</option>
                            </select>
                            <SecondaryButton type="submit">
                                Axtar
                            </SecondaryButton>
                        </form>
                        
                        <PrimaryButton onClick={() => setShowCreateForm(true)}>
                            Yeni Hesab
                        </PrimaryButton>
                    </div>

                    {/* Create Account Form */}
                    {showCreateForm && (
                        <div className="bg-white shadow rounded-lg mb-6">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Yeni Hesab Yarat
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    İstifadəçi ilk girişdən sonra quraşdırma sehrbazında şirkət məlumatlarını dolduracaq.
                                </p>

                                <form onSubmit={handleCreateAccount} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Giriş üçün) *</label>
                                        <TextInput
                                            type="email"
                                            value={data.user_email}
                                            onChange={(e) => setData('user_email', e.target.value)}
                                            className={errors.user_email ? 'border-red-500' : ''}
                                            placeholder="email@example.com"
                                            required
                                        />
                                        {errors.user_email && <span className="text-red-500 text-xs">{errors.user_email}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə *</label>
                                        <TextInput
                                            type="password"
                                            value={data.user_password}
                                            onChange={(e) => setData('user_password', e.target.value)}
                                            className={errors.user_password ? 'border-red-500' : ''}
                                            placeholder="Minimum 8 simvol"
                                            required
                                        />
                                        {errors.user_password && <span className="text-red-500 text-xs">{errors.user_password}</span>}
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <SecondaryButton
                                            type="button"
                                            onClick={() => setShowCreateForm(false)}
                                        >
                                            Ləğv et
                                        </SecondaryButton>
                                        <PrimaryButton type="submit" disabled={processing}>
                                            {processing ? 'Yaradılır...' : 'Yarat'}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Accounts Table */}
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
                                            Əlaqə
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            İstifadəçilər
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Yaradılma
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
                                                    ID: {account.id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{account.email}</div>
                                                {account.phone && (
                                                    <div className="text-sm text-gray-500">{account.phone}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    account.subscription_plan === 'enterprise' 
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : account.subscription_plan === 'professional'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {plans[account.subscription_plan as keyof typeof plans]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">{account.users_count}</span>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(account.created_at).toLocaleDateString('az-AZ')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <Link
                                                        href={`/admin/accounts/${account.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Bax
                                                    </Link>
                                                    <button
                                                        onClick={() => handleToggleStatus(account)}
                                                        className={`${
                                                            account.is_active
                                                                ? 'text-orange-600 hover:text-orange-900'
                                                                : 'text-green-600 hover:text-green-900'
                                                        }`}
                                                    >
                                                        {account.is_active ? 'Dayandır' : 'Aktivləşdir'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAccount(account)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="text-sm text-gray-700">
                                Səhifə {accounts.current_page} / {accounts.last_page} ({accounts.total} nəticə)
                            </div>
                            <div className="flex space-x-2">
                                {accounts.current_page > 1 && (
                                    <a
                                        href={`/admin/accounts?page=${accounts.current_page - 1}${search ? '&search=' + encodeURIComponent(search) : ''}`}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        Əvvəlki
                                    </a>
                                )}
                                {accounts.current_page < accounts.last_page && (
                                    <a
                                        href={`/admin/accounts?page=${accounts.current_page + 1}${search ? '&search=' + encodeURIComponent(search) : ''}`}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        Növbəti
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}