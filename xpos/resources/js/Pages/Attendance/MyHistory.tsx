import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ClockIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

interface AttendanceRecord {
    id: number;
    check_in: string;
    check_out: string | null;
    duration: number | null;
    status: 'present' | 'late' | 'incomplete';
    branch_name: string;
    date: string;
}

interface Stats {
    total_days: number;
    total_hours: number;
}

interface Props {
    records: AttendanceRecord[];
    stats: Stats;
    filters: {
        date_from?: string;
        date_to?: string;
    };
    locale?: string;
}

export default function MyHistory({ records, stats, filters, locale }: Props) {
    const { t, i18n } = useTranslation('attendance');
    const { locale: backendLocale } = usePage().props as any;

    // Use backend-determined locale (user → account → company → system default)
    const effectiveLocale = locale || backendLocale || 'az';

    // Initialize i18n with backend locale on mount
    useEffect(() => {
        if (i18n.language !== effectiveLocale) {
            i18n.changeLanguage(effectiveLocale);
        }
    }, [effectiveLocale, i18n]);
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        router.visit(`/attendance/my-history?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        router.visit('/attendance/my-history', {
            preserveState: false,
        });
    };

    const formatDuration = (minutes: number | null): string => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatTime = (datetime: string): string => {
        return new Date(datetime).toLocaleTimeString('az-AZ', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleDateString('az-AZ', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {t('status.present')}
                    </span>
                );
            case 'late':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {t('status.late')}
                    </span>
                );
            case 'incomplete':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        {t('status.incomplete')}
                    </span>
                );
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('my_history.title')} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('my_history.title')}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {t('my_history.description')}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('stats.total_days')}
                                        </dt>
                                        <dd className="text-2xl font-bold text-gray-900">
                                            {stats.total_days}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ClockIcon className="h-8 w-8 text-green-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('stats.total_hours')}
                                        </dt>
                                        <dd className="text-2xl font-bold text-gray-900">
                                            {formatDuration(stats.total_hours)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('filters.date_from')}
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('filters.date_to')}
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleFilter}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                    {t('actions.filter')}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                    {t('actions.reset')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Records */}
                <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
                    {records.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {records.map((record) => (
                                <div
                                    key={record.id}
                                    className="p-6 hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        {/* Left: Date & Branch */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-semibold text-gray-900">
                                                        {formatDate(record.date)}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {record.branch_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Check In/Out */}
                                        <div className="flex gap-6">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {t('fields.check_in')}
                                                </p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {formatTime(record.check_in)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {t('fields.check_out')}
                                                </p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {record.check_out ? formatTime(record.check_out) : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {t('fields.duration')}
                                                </p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {formatDuration(record.duration)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: Status */}
                                        <div className="flex-shrink-0">
                                            {getStatusBadge(record.status)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {t('my_history.empty.title')}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('my_history.empty.description')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
