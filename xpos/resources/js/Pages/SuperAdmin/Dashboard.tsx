import { Head } from '@inertiajs/react';
import StatCard from '@/Components/StatCard';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface Stats {
    total_accounts: number;
    active_accounts: number;
    total_users: number;
    active_users: number;
}

interface Props {
    stats: Stats;
    error?: string;
}

export default function SuperAdminDashboard({ stats, error }: Props) {
    return (
        <>
            <Head title="Super Admin Dashboard" />
            
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Super Admin Panel
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Sistem idarəsi və monitorinq
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

                    {/* Navigation */}
                    <SuperAdminNav />

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
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Hesabları Gör
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
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        İstifadəçiləri Gör
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Sistem Statistikası</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Detallı sistem performans məlumatları
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/system-stats"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                                    >
                                        Statistikalar
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
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
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
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Azure Storage</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Microsoft Azure Blob Storage parametrlərini konfiqurasiya et
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/admin/storage-settings"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Azure Parametrləri
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Sistem Təmizliyi</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Cache və log fayllarını təmizlə
                                </p>
                                <div className="mt-4 space-y-2">
                                    <button
                                        onClick={() => window.open('/admin/cache/clear', '_blank')}
                                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cache Təmizlə
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}