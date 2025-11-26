import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    PrinterIcon,
} from '@heroicons/react/24/outline';
import AdvancedPagination from '@/Components/AdvancedPagination';

interface Sale {
    sale_id: number;
    sale_number: string;
    total: number;
}

interface Job {
    id: number;
    sale_id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    provider: string;
    fiscal_number: string | null;
    error_message: string | null;
    retry_count: number;
    is_retriable: boolean;
    next_retry_at: string | null;
    created_at: string;
    picked_up_at: string | null;
    completed_at: string | null;
    sale: Sale;
}

interface Props {
    jobs: {
        data: Job[];
        links: any;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    statusCounts: {
        all: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    filters: {
        status?: string;
        search?: string;
    };
}

export default function JobQueue({ jobs, statusCounts, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedJobs, setSelectedJobs] = useState<number[]>([]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('fiscal-printer-jobs.index'),
            { search, status: selectedStatus },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get(
            route('fiscal-printer-jobs.index'),
            { search, status },
            { preserveState: true }
        );
    };

    const handleRetry = (jobId: number) => {
        if (confirm('Bu işi təkrar növbəyə əlavə etmək istədiyinizə əminsiniz?')) {
            router.post(route('fiscal-printer-jobs.retry', jobId));
        }
    };

    const handleDelete = (jobId: number) => {
        if (confirm('Bu işi silmək istədiyinizə əminsiniz?')) {
            router.delete(route('fiscal-printer-jobs.destroy', jobId));
        }
    };

    const handleBulkDelete = () => {
        if (selectedJobs.length === 0) {
            alert('Heç bir iş seçilməyib');
            return;
        }

        if (confirm(`${selectedJobs.length} işi silmək istədiyinizə əminsiniz?`)) {
            router.post(route('fiscal-printer-jobs.bulk-delete'), {
                job_ids: selectedJobs,
            });
            setSelectedJobs([]);
        }
    };

    const toggleJobSelection = (jobId: number) => {
        setSelectedJobs((prev) =>
            prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
        );
    };

    const toggleAllJobs = () => {
        if (selectedJobs.length === jobs.data.length) {
            setSelectedJobs([]);
        } else {
            setSelectedJobs(jobs.data.map((job) => job.id));
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: {
                icon: ClockIcon,
                text: 'Gözləyir',
                class: 'bg-yellow-100 text-yellow-800',
            },
            processing: {
                icon: ArrowPathIcon,
                text: 'İşlənir',
                class: 'bg-blue-100 text-blue-800 animate-pulse',
            },
            completed: {
                icon: CheckCircleIcon,
                text: 'Tamamlandı',
                class: 'bg-green-100 text-green-800',
            },
            failed: {
                icon: XCircleIcon,
                text: 'Uğursuz',
                class: 'bg-red-100 text-red-800',
            },
        };

        const badge = badges[status as keyof typeof badges];
        if (!badge) return null;

        const Icon = badge.icon;

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}
            >
                <Icon className="w-4 h-4 mr-1" />
                {badge.text}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('az-AZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Fiskal Printer Növbəsi
                    </h2>
                </div>
            }
        >
            <Head title="Fiskal Printer Növbəsi" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {flash.error}
                        </div>
                    )}

                    {/* Status Tabs */}
                    <div className="bg-white shadow sm:rounded-lg mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                                {[
                                    { key: 'all', label: 'Hamısı', count: statusCounts.all },
                                    { key: 'pending', label: 'Gözləyir', count: statusCounts.pending },
                                    { key: 'processing', label: 'İşlənir', count: statusCounts.processing },
                                    { key: 'completed', label: 'Tamamlandı', count: statusCounts.completed },
                                    { key: 'failed', label: 'Uğursuz', count: statusCounts.failed },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleStatusFilter(tab.key)}
                                        className={`${
                                            selectedStatus === tab.key
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        {tab.label}
                                        <span
                                            className={`${
                                                selectedStatus === tab.key
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'bg-gray-100 text-gray-900'
                                            } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Search and Actions */}
                    <div className="bg-white shadow sm:rounded-lg mb-6 p-4">
                        <div className="flex justify-between items-center">
                            <form onSubmit={handleSearch} className="flex-1 max-w-md">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Satış nömrəsinə görə axtar..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                            </form>

                            {selectedJobs.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    <TrashIcon className="w-4 h-4 mr-2" />
                                    Seçilmişləri sil ({selectedJobs.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Jobs Table */}
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={
                                                jobs.data.length > 0 &&
                                                selectedJobs.length === jobs.data.length
                                            }
                                            onChange={toggleAllJobs}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Satış
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fiskal №
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Xəta
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Təkrar sayı
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
                                {jobs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                            <PrinterIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                            <p className="text-lg font-medium">Heç bir iş tapılmadı</p>
                                        </td>
                                    </tr>
                                ) : (
                                    jobs.data.map((job) => (
                                        <tr key={job.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedJobs.includes(job.id)}
                                                    onChange={() => toggleJobSelection(job.id)}
                                                    disabled={job.status === 'completed'}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{job.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {job.sale ? (
                                                    <a
                                                        href={route('sales.show', job.sale.sale_id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {job.sale.sale_number}
                                                    </a>
                                                ) : (
                                                    `Satış #${job.sale_id}`
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(job.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {job.fiscal_number || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                                                {job.error_message || '-'}
                                                {job.error_message && !job.is_retriable && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        (təkrar edilə bilməz)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {job.retry_count}/3
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(job.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {job.status === 'failed' && job.is_retriable && (
                                                        <button
                                                            onClick={() => handleRetry(job.id)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Təkrar et"
                                                        >
                                                            <ArrowPathIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {job.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleDelete(job.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Sil"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {jobs.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <AdvancedPagination data={jobs} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
