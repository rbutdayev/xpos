import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    last_login_at?: string;
}

interface Account {
    id: number;
    company_name: string;
    email: string;
    phone?: string;
    address?: string;
    subscription_plan: string;
    is_active: boolean;
    monthly_payment_amount?: number;
    payment_start_date?: string;
    created_at: string;
    users: User[];
}

interface Stats {
    total_users: number;
    active_users: number;
    last_login?: string;
}

interface Props {
    account: Account;
    stats: Stats;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function AccountDetails({ account, stats, flash }: Props) {
    const [showClearDataModal, setShowClearDataModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // Map database enum values to display names
    const planDisplay: Record<string, string> = {
        'starter': 'Başlanğıc',
        'professional': 'Professional',
        'enterprise': 'Korporativ',
    };

    const roleDisplay: Record<string, string> = {
        'account_owner': 'Hesab Sahibi',
        'admin': 'Administrator',
        'manager': 'Menecər',
        'cashier': 'Kassir',
        'warehouse_manager': 'Anbar Menecəri',
    };

    const handleClearData = () => {
        if (confirmText === account.company_name) {
            router.post(route('superadmin.accounts.clear-data', account.id), {}, {
                preserveScroll: false,
                onSuccess: () => {
                    setShowClearDataModal(false);
                    setConfirmText('');
                },
            });
        }
    };

    return (
        <SuperAdminLayout title={account.company_name}>
            <Head title={`${account.company_name} - Hesab Detalları`} />

            <Link href="/admin/accounts" className="text-slate-600 hover:text-slate-900 text-sm mb-4 inline-block">
                ← Hesablara qayıt
            </Link>

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

                    {/* Account Info Card */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Hesab Məlumatları
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        ID: {account.id}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                        account.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {account.is_active ? 'Aktiv' : 'Dayandırılıb'}
                                    </span>
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                        account.subscription_plan === 'enterprise'
                                            ? 'bg-purple-100 text-purple-800'
                                            : account.subscription_plan === 'professional'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {planDisplay[account.subscription_plan] || account.subscription_plan}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-sm text-gray-900">{account.email}</p>
                                </div>
                                {account.phone && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Telefon</label>
                                        <p className="mt-1 text-sm text-gray-900">{account.phone}</p>
                                    </div>
                                )}
                                {account.address && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                                        <p className="mt-1 text-sm text-gray-900">{account.address}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Yaradılma Tarixi</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(account.created_at).toLocaleDateString('az-AZ')}
                                    </p>
                                </div>
                                {account.monthly_payment_amount && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Aylıq Ödəniş</label>
                                        <p className="mt-1 text-sm text-gray-900">{account.monthly_payment_amount} AZN</p>
                                    </div>
                                )}
                                {account.payment_start_date && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ödəniş Başlanğıcı</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {new Date(account.payment_start_date).toLocaleDateString('az-AZ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Statistics Card */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Statistika
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Ümumi İstifadəçilər</p>
                                    <p className="text-2xl font-bold text-blue-900">{stats.total_users}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium">Aktiv İstifadəçilər</p>
                                    <p className="text-2xl font-bold text-green-900">{stats.active_users}</p>
                                </div>
                                {stats.last_login && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600 font-medium">Son Giriş</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(stats.last_login).toLocaleString('az-AZ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                İstifadəçilər ({account.users.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rol
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Son Giriş
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {account.users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">
                                                    {roleDisplay[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {user.status === 'active' ? 'Aktiv' : 'Deaktiv'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.last_login_at
                                                    ? new Date(user.last_login_at).toLocaleDateString('az-AZ')
                                                    : 'Heç vaxt'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white shadow rounded-lg border-2 border-red-200">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-red-900 mb-4">
                                Təhlükəli Əməliyyatlar
                            </h3>
                            <div className="space-y-4">
                                <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
                                    <h4 className="text-md font-semibold text-orange-900 mb-2">
                                        Məlumatları Təmizlə
                                    </h4>
                                    <p className="text-sm text-orange-700 mb-3">
                                        Bu əməliyyat bütün transaksiya məlumatlarını (satışlar, məhsullar, müştərilər, təchizatçılar, xərclər) siləcək.
                                        Hesab, istifadəçilər və əsas konfiqurasiya saxlanacaq.
                                    </p>
                                    <p className="text-sm text-orange-700 mb-3">
                                        <strong>Saxlanacaq:</strong> Hesab, istifadəçilər, şirkət, filiallar, anbarlar, kateqoriyalar, parametrlər
                                    </p>
                                    <p className="text-sm text-orange-700 mb-3">
                                        <strong>Silinəcək:</strong> Satışlar, məhsullar, müştərilər, təchizatçılar, inventar hərəkətləri, xərclər, bütün qeydlər
                                    </p>
                                    <SecondaryButton
                                        onClick={() => setShowClearDataModal(true)}
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        Məlumatları Təmizlə
                                    </SecondaryButton>
                                </div>

                                <div className="border border-red-300 bg-red-50 p-4 rounded-lg">
                                    <h4 className="text-md font-semibold text-red-900 mb-2">
                                        Hesabı Sil
                                    </h4>
                                    <p className="text-sm text-red-700 mb-3">
                                        Bu əməliyyat hesabı və BÜTÜN əlaqəli məlumatları həmişəlik siləcək. Bu əməliyyat geri alına bilməz!
                                    </p>
                                    <SecondaryButton
                                        onClick={() => {
                                            if (confirm(`${account.company_name} hesabını VƏ BÜTÜN MƏLUMATLARINI SİLMƏK istədiyinizdən əminsiniz? Bu əməliyyat geri alına bilməz!`)) {
                                                router.delete(route('superadmin.accounts.destroy', account.id));
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Hesabı Həmişəlik Sil
                                    </SecondaryButton>
                                </div>
                            </div>
                        </div>
                    </div>

            {/* Clear Data Confirmation Modal */}
            {showClearDataModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <svg className="h-12 w-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Məlumatları Təmizləmək İstədiyinizdən Əminsiniz?
                                    </h3>
                                </div>
                            </div>

                            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-md p-4">
                                <p className="text-sm text-orange-900 mb-2">
                                    <strong>Bu əməliyyat geri alına bilməz!</strong> Aşağıdakı məlumatlar silinəcək:
                                </p>
                                <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                                    <li>Bütün satışlar və ödənişlər</li>
                                    <li>Bütün məhsullar və inventar</li>
                                    <li>Bütün müştərilər və təchizatçılar</li>
                                    <li>Bütün inventar hərəkətləri və transfer</li>
                                    <li>Bütün xərclər və qeydlər</li>
                                    <li>Bütün rental və xidmət məlumatları</li>
                                </ul>
                                <p className="text-sm text-green-800 mt-3">
                                    <strong>Saxlanacaq:</strong> Hesab, istifadəçilər, şirkət, filiallar, anbarlar, kateqoriyalar, sistem parametrləri
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Davam etmək üçün şirkət adını yazın: <strong>{account.company_name}</strong>
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
                                    placeholder={account.company_name}
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <SecondaryButton
                                    onClick={() => {
                                        setShowClearDataModal(false);
                                        setConfirmText('');
                                    }}
                                >
                                    Ləğv et
                                </SecondaryButton>
                                <PrimaryButton
                                    onClick={handleClearData}
                                    disabled={confirmText !== account.company_name}
                                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                                >
                                    Məlumatları Təmizlə
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
