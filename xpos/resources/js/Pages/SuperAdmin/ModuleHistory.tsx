import { Head, Link } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Account {
    id: number;
    company_name: string;
    email: string;
}

interface ModuleChange {
    id: number;
    module_id: string;
    module_name: string;
    action: 'enabled' | 'disabled';
    price: number;
    prorated_amount: number;
    new_total: number;
    created_at: string;
}

interface ActiveModule {
    module_id: string;
    module_name: string;
    price: number;
}

interface Props {
    account: Account;
    activeModules: ActiveModule[];
    totalMonthly: number;
    moduleHistory: {
        data: ModuleChange[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function ModuleHistory({ account, activeModules, totalMonthly, moduleHistory }: Props) {
    // Define table columns
    const tableColumns = [
        {
            key: 'created_at',
            label: 'Tarix',
            sortable: true,
            render: (change: ModuleChange) => (
                <div className="text-sm text-gray-900">
                    {new Date(change.created_at).toLocaleDateString('az-AZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            )
        },
        {
            key: 'module_name',
            label: 'Modul',
            sortable: true,
            render: (change: ModuleChange) => (
                <div className="text-sm font-medium text-gray-900">
                    {change.module_name}
                </div>
            )
        },
        {
            key: 'action',
            label: 'Əməliyyat',
            sortable: true,
            render: (change: ModuleChange) => (
                change.action === 'enabled' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 border border-green-200">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Aktivləşdirilib</span>
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200">
                        <XCircleIcon className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-medium text-red-700">Deaktiv edilib</span>
                    </span>
                )
            )
        },
        {
            key: 'price',
            label: 'Qiymət',
            sortable: true,
            render: (change: ModuleChange) => (
                <div className="text-sm text-gray-900">
                    {change.price.toFixed(2)} ₼
                </div>
            )
        },
        {
            key: 'prorated_amount',
            label: 'Günlük Məbləğ',
            sortable: true,
            render: (change: ModuleChange) => (
                <div className="text-sm text-gray-900">
                    {change.prorated_amount.toFixed(2)} ₼
                </div>
            )
        },
        {
            key: 'new_total',
            label: 'Yeni Cəmi',
            sortable: true,
            render: (change: ModuleChange) => (
                <div className="text-sm font-semibold text-gray-900">
                    {change.new_total.toFixed(2)} ₼
                </div>
            )
        }
    ];

    return (
        <SuperAdminLayout
            title="Modul Tarixçəsi"
            actions={
                <Link
                    href={route('superadmin.payments.index')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Ödənişlərə Qayıt
                </Link>
            }
        >
            <Head title={`Modul Tarixçəsi - ${account.company_name}`} />

                    {/* Account Info Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Hesab Məlumatı
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Ad</p>
                                <p className="text-base font-medium text-gray-900">{account.company_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-base font-medium text-gray-900">{account.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Current Billing Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Cari Ödəniş Məlumatı
                        </h2>
                        <div className="mb-4">
                            <p className="text-sm text-gray-700 mb-2">Aylıq Ödəniş Məbləği</p>
                            <p className="text-3xl font-bold text-indigo-900">{totalMonthly.toFixed(2)} ₼</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Aktiv Modullar</p>
                            {activeModules.length > 0 ? (
                                <div className="space-y-2">
                                    {activeModules.map((module) => (
                                        <div
                                            key={module.module_id}
                                            className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-blue-100"
                                        >
                                            <span className="text-sm font-medium text-gray-900">
                                                {module.module_name}
                                            </span>
                                            <span className="text-sm font-semibold text-indigo-700">
                                                {module.price.toFixed(2)} ₼/ay
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                                    <p className="text-sm text-gray-500">Aktiv modul yoxdur</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Dəyişiklik Tarixçəsi
                            </h2>
                        </div>

                        <SharedDataTable
                            data={{
                                ...moduleHistory,
                                links: [],
                                from: (moduleHistory.current_page - 1) * moduleHistory.per_page + 1,
                                to: Math.min(moduleHistory.current_page * moduleHistory.per_page, moduleHistory.total)
                            }}
                            columns={tableColumns as any}
                            selectable={false}
                            emptyState={{
                                icon: <XCircleIcon className="w-12 h-12" />,
                                title: 'Tarixçə yoxdur',
                                description: ''
                            }}
                            fullWidth={true}
                            dense={false}
                        />
                    </div>
        </SuperAdminLayout>
    );
}
