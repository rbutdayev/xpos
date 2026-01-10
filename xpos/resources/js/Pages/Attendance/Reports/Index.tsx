import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter } from '@/Components/SharedDataTable';
import {
    ClockIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    ArrowDownTrayIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface User {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
}

interface AttendanceRecord {
    id: number;
    user: User;
    branch: Branch;
    check_in: string | null;
    check_out: string | null;
    duration: number | null;
    status: 'present' | 'late' | 'absent' | 'incomplete';
    recorded_at: string;
}

interface Stats {
    total_records: number;
    total_hours: number;
    unique_employees: number;
}

interface Props {
    attendances: {
        data: AttendanceRecord[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    branches: Branch[];
    stats: Stats;
    filters: {
        search?: string;
        branch_id?: number;
        date_from?: string;
        date_to?: string;
        per_page?: number;
    };
}

export default function AttendanceReports({ attendances, branches, stats, filters }: Props) {
    const { t } = useTranslation('attendance');
    const { t: tc } = useTranslation('common');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id?.toString() || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [perPage, setPerPage] = useState(filters.per_page || 25);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (branchFilter) params.append('branch_id', branchFilter);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (perPage) params.append('per_page', perPage.toString());

        router.visit(`/attendance/reports?${params.toString()}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setBranchFilter('');
        setDateFrom('');
        setDateTo('');
        setPerPage(25);
        router.visit('/attendance/reports', {
            preserveState: false,
        });
    };

    const handleExportCSV = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (branchFilter) params.append('branch_id', branchFilter);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        window.location.href = `/attendance/reports/export?${params.toString()}`;
    };

    const formatDuration = (minutes: number | null): string => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatDateTime = (datetime: string | null): string => {
        if (!datetime) return '-';
        return new Date(datetime).toLocaleString('az-AZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('status.present')}</span>;
            case 'late':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{t('status.late')}</span>;
            case 'absent':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{t('status.absent')}</span>;
            case 'incomplete':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{t('status.incomplete')}</span>;
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const columns: Column[] = [
        {
            key: 'user.name',
            label: t('fields.employee'),
            sortable: true,
            render: (record: AttendanceRecord) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                            {record.user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">{record.user.name}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'branch.name',
            label: t('fields.branch'),
            sortable: true,
            render: (record: AttendanceRecord) => (
                <span className="text-sm text-gray-900">{record.branch.name}</span>
            ),
        },
        {
            key: 'check_in',
            label: t('fields.check_in'),
            sortable: true,
            render: (record: AttendanceRecord) => (
                <span className="text-sm text-gray-900">{formatDateTime(record.check_in)}</span>
            ),
        },
        {
            key: 'check_out',
            label: t('fields.check_out'),
            sortable: true,
            render: (record: AttendanceRecord) => (
                <span className="text-sm text-gray-900">{formatDateTime(record.check_out)}</span>
            ),
        },
        {
            key: 'duration',
            label: t('fields.duration'),
            sortable: true,
            align: 'center',
            render: (record: AttendanceRecord) => (
                <span className="text-sm font-medium text-gray-900">{formatDuration(record.duration)}</span>
            ),
        },
        {
            key: 'status',
            label: t('fields.status'),
            sortable: true,
            align: 'center',
            render: (record: AttendanceRecord) => getStatusBadge(record.status),
        },
    ];

    const dataTableFilters: Filter[] = [
        {
            key: 'branch_id',
            type: 'dropdown',
            label: t('filters.branch'),
            placeholder: t('filters.all_branches'),
            value: branchFilter,
            onChange: (value) => setBranchFilter(value),
            options: branches.map((branch) => ({
                value: branch.id.toString(),
                label: branch.name,
            })),
        },
        {
            key: 'date_from',
            type: 'date',
            label: t('filters.date_from'),
            value: dateFrom,
            onChange: (value) => setDateFrom(value),
        },
        {
            key: 'date_to',
            type: 'date',
            label: t('filters.date_to'),
            value: dateTo,
            onChange: (value) => setDateTo(value),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('reports.title')} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {t('reports.title')}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {t('reports.description')}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/attendance/settings"
                                    className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                                    Parametrlər
                                </Link>
                                <button
                                    onClick={handleExportCSV}
                                    className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                    {t('actions.export_csv')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('stats.total_records')}
                                        </dt>
                                        <dd className="text-2xl font-bold text-gray-900">
                                            {stats.total_records}
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

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <UserGroupIcon className="h-8 w-8 text-purple-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('stats.unique_employees')}
                                        </dt>
                                        <dd className="text-2xl font-bold text-gray-900">
                                            {stats.unique_employees}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <SharedDataTable
                    data={attendances}
                    columns={columns}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder={t('filters.search_placeholder')}
                    filters={dataTableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    onPerPageChange={(newPerPage) => {
                        setPerPage(newPerPage);
                        const params = new URLSearchParams(window.location.search);
                        params.set('per_page', newPerPage.toString());
                        router.visit(`/attendance/reports?${params.toString()}`, {
                            preserveState: true,
                            preserveScroll: true,
                        });
                    }}
                    emptyState={{
                        title: t('empty.title'),
                        description: t('empty.description'),
                    }}
                />
            </div>
        </AuthenticatedLayout>
    );
}
