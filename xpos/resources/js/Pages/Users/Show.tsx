import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    BriefcaseIcon,
    CalendarIcon,
    ClockIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    LanguageIcon,
    DevicePhoneMobileIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChartBarIcon,
    BanknotesIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Branch {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    branch_id?: number;
    branch?: Branch;
    position?: string;
    hire_date?: string;
    hourly_rate?: number;
    notes?: string;
    last_login_at?: string;
    created_at: string;
    language?: string;
    kiosk_enabled?: boolean;
    has_kiosk_pin?: boolean;
}

interface Stats {
    total_sales: number;
    total_sales_amount: number;
}

interface Props {
    user: User;
    roleText: string;
    stats: Stats;
}

export default function Show({ user, roleText, stats }: Props) {
    const { t } = useTranslation('users');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${user.name} - ${t('show.title')}`} />

            <div className="py-12">
                <div className="px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{t('show.title')}</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {t('show.userId')}: {user.id}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={route('users.index')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                {t('show.back')}
                            </Link>
                            <Link
                                href={route('users.edit', user.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-600"
                            >
                                {t('show.edit')}
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <div className="flex items-center mb-6">
                                        <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                            <UserIcon className="h-10 w-10 text-white" />
                                        </div>
                                        <div className="ml-5">
                                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    user.status === 'active'
                                                        ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                                                        : 'bg-red-100 text-red-800 ring-1 ring-red-600/20'
                                                }`}>
                                                    {user.status === 'active' ? '✓ ' + t('form.active') : '✕ ' + t('form.inactive')}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 ring-1 ring-blue-600/20">
                                                    <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
                                                    {roleText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">{t('show.contactInfo')}</h3>
                                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                            <div className="flex items-start group">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                    <EnvelopeIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                </div>
                                                <div className="ml-4 min-w-0 flex-1">
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.email')}</dt>
                                                    <dd className="mt-1 text-sm font-medium text-gray-900 break-words">{user.email}</dd>
                                                </div>
                                            </div>

                                            {user.phone && (
                                                <div className="flex items-start group">
                                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                        <PhoneIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="ml-4 min-w-0 flex-1">
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.phone')}</dt>
                                                        <dd className="mt-1 text-sm font-medium text-gray-900">{user.phone}</dd>
                                                    </div>
                                                </div>
                                            )}

                                            {user.branch && (
                                                <div className="flex items-start group">
                                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                        <BuildingOfficeIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="ml-4 min-w-0 flex-1">
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('form.branch')}</dt>
                                                        <dd className="mt-1 text-sm font-medium text-gray-900">{user.branch.name}</dd>
                                                    </div>
                                                </div>
                                            )}

                                            {user.language && (
                                                <div className="flex items-start group">
                                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                        <LanguageIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="ml-4 min-w-0 flex-1">
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.language')}</dt>
                                                        <dd className="mt-1 text-sm font-medium text-gray-900">{user.language === 'az' ? 'Azərbaycan' : 'English'}</dd>
                                                    </div>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                </div>
                            </div>

                            {/* Employee Information */}
                            {(user.position || user.hire_date || user.hourly_rate || user.notes) && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">{t('show.employeeInfo')}</h3>
                                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                            {user.position && (
                                                <div className="flex items-start group">
                                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                        <BriefcaseIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="ml-4 min-w-0 flex-1">
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.position')}</dt>
                                                        <dd className="mt-1 text-sm font-medium text-gray-900">{user.position}</dd>
                                                    </div>
                                                </div>
                                            )}

                                            {user.hire_date && (
                                                <div className="flex items-start group">
                                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                        <CalendarIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="ml-4 min-w-0 flex-1">
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.hireDate')}</dt>
                                                        <dd className="mt-1 text-sm font-medium text-gray-900">{formatDate(user.hire_date)}</dd>
                                                    </div>
                                                </div>
                                            )}

                                            {user.hourly_rate && (
                                                <div className="flex items-start group">
                                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                        <BanknotesIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                    </div>
                                                    <div className="ml-4 min-w-0 flex-1">
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.hourlyRate')}</dt>
                                                        <dd className="mt-1 text-sm font-medium text-gray-900">{user.hourly_rate} AZN</dd>
                                                    </div>
                                                </div>
                                            )}
                                        </dl>

                                        {user.notes && (
                                            <div className="mt-6 pt-6 border-t">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50">
                                                        <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                                                    </div>
                                                    <div className="ml-4 min-w-0 flex-1">
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('show.notes')}</dt>
                                                        <dd className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{user.notes}</dd>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Activity Statistics */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                        <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
                                        {t('show.activityStats')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{t('show.totalSales')}</p>
                                                    <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total_sales}</p>
                                                </div>
                                                <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
                                                    <ChartBarIcon className="h-6 w-6 text-blue-700" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">{t('show.salesAmount')}</p>
                                                    <p className="text-2xl font-bold text-green-900 mt-2">{formatCurrency(stats.total_sales_amount)}</p>
                                                </div>
                                                <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                                                    <BanknotesIcon className="h-6 w-6 text-green-700" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - System & Kiosk Info */}
                        <div className="space-y-6">
                            {/* Kiosk Access */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center">
                                        <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-gray-500" />
                                        {t('show.kioskAccess')}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                {user.kiosk_enabled ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                                                ) : (
                                                    <XCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{t('show.kioskStatus')}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.kiosk_enabled ? t('show.kioskEnabled') : t('show.kioskDisabled')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                user.kiosk_enabled
                                                    ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {user.kiosk_enabled ? t('show.kioskActive') : t('show.kioskInactive')}
                                            </span>
                                        </div>

                                        {user.kiosk_enabled && (
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-xs font-medium text-blue-800">{t('show.kioskLoginId')}</p>
                                                        <p className="mt-1 text-sm font-mono font-bold text-blue-900">{user.id}</p>
                                                        <p className="mt-2 text-xs text-blue-700">
                                                            {user.has_kiosk_pin ? `✓ ${t('show.kioskPinConfigured')}` : t('show.kioskPinNotSet')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* System Information */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">{t('show.systemInfo')}</h3>
                                    <dl className="space-y-4">
                                        {user.last_login_at && (
                                            <div className="flex items-start group">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                    <ClockIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                                </div>
                                                <div className="ml-4 min-w-0 flex-1">
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.lastLogin')}</dt>
                                                    <dd className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(user.last_login_at)}</dd>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start group">
                                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                                <CalendarIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                                            </div>
                                            <div className="ml-4 min-w-0 flex-1">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('show.createdAt')}</dt>
                                                <dd className="mt-1 text-sm font-medium text-gray-900">{formatDate(user.created_at)}</dd>
                                            </div>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">{t('show.quickActions')}</h3>
                                <div className="space-y-2">
                                    <Link
                                        href={route('users.edit', user.id)}
                                        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        <span>{t('show.editUser')}</span>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
