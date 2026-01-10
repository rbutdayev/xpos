import { Head } from '@inertiajs/react';
import StatCard from '@/Components/StatCard';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';

interface AccountStats {
    total: number;
    active: number;
    suspended: number;
    created_this_month: number;
}

interface UserStats {
    total: number;
    active: number;
    inactive: number;
    created_this_month: number;
}

interface Stats {
    total_accounts: number;
    active_accounts: number;
    total_users: number;
    active_users: number;
    accounts: AccountStats;
    users: UserStats;
    roles: Record<string, number>;
}

interface Props {
    stats: Stats;
    error?: string;
}

export default function SuperAdminDashboard({ stats, error }: Props) {
    return (
        <SuperAdminLayout title="Super Admin Panel">
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                {/* Subtitle */}
                <p className="text-sm text-gray-600">
                    Sistem idarəsi və monitorinq
                </p>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Sistem Xətası
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Cəmi Hesablar"
                            value={stats.total_accounts}
                            color="blue"
                        />
                        <StatCard
                            title="Aktiv Hesablar"
                            value={stats.active_accounts}
                            color="green"
                        />
                        <StatCard
                            title="Cəmi İstifadəçilər"
                            value={stats.total_users}
                            color="purple"
                        />
                        <StatCard
                            title="Aktiv İstifadəçilər"
                            value={stats.active_users}
                            color="green"
                        />
                    </div>

                    {/* Detailed Statistics */}
                    <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Account Statistics */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
                                <h3 className="text-lg font-semibold text-gray-900">Hesab Statistikası</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-700">{stats.accounts.total}</div>
                                        <div className="text-sm text-gray-600 mt-1">Ümumi</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{stats.accounts.active}</div>
                                        <div className="text-sm text-gray-600 mt-1">Aktiv</div>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">{stats.accounts.suspended}</div>
                                        <div className="text-sm text-gray-600 mt-1">Dayandırılmış</div>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-700">{stats.accounts.created_this_month}</div>
                                        <div className="text-sm text-gray-600 mt-1">Bu ay yaradılan</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Statistics */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
                                <h3 className="text-lg font-semibold text-gray-900">İstifadəçi Statistikası</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-700">{stats.users.total}</div>
                                        <div className="text-sm text-gray-600 mt-1">Ümumi</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{stats.users.active}</div>
                                        <div className="text-sm text-gray-600 mt-1">Aktiv</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-100 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-600">{stats.users.inactive}</div>
                                        <div className="text-sm text-gray-600 mt-1">Qeyri-aktiv</div>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-700">{stats.users.created_this_month}</div>
                                        <div className="text-sm text-gray-600 mt-1">Bu ay əlavə olundu</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role Distribution */}
                    {Object.keys(stats.roles).length > 0 && (
                        <div className="mb-8">
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Rol Paylanması</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {Object.entries(stats.roles).map(([role, count]) => (
                                            <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                                                <div className="text-xl font-bold text-gray-900">{count as number}</div>
                                                <div className="text-xs text-gray-600 mt-1 capitalize">{role.replace('_', ' ')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Hesabları İdarə Et</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Müştəri hesablarını yarat, redaktə et və idarə et
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/accounts"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                    >
                                        Hesabları Gör
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Ödənişlər</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Hesab ödənişlərini idarə et və izlə
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/payments"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                    >
                                        Ödənişlər
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">İstifadəçi Monitorinqi</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Bütün sistəm istifadəçilərini izlə və idarə et
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/users"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                    >
                                        İstifadəçiləri Gör
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Loaylıq Kartları</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Fiziki loaylıq kartlarını yaradın və idarə edin
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/loyalty-cards"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                    >
                                        Kartlar
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Fiskal Printerlər</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Fiskal printer provayderləri və inteqrasiyalar
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/fiscal-printer-providers"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                    >
                                        Printerlər
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Sistemin statusu</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Real vaxt sistem monitorinqi və performans təhlili
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/system-health"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                    >
                                        Status Paneli
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Təhlükəsizlik Mərkəzi</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Təhlükəsizlik monitorinqi və audit logları
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/security"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                    >
                                        Təhlükəsizlik Paneli
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Object Store</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Object storage parametrlərini konfiqurasiya et
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/storage-settings"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                    >
                                        Storage Parametrləri
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </SuperAdminLayout>
    );
}