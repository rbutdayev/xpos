import React, { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { useSystemHealth } from '@/Hooks/Admin/useSystemHealth';
import SuperAdminNav from '@/Components/SuperAdminNav';
import SystemMetrics from '@/Components/Admin/Health/SystemMetrics';
import QueueMonitor from '@/Components/Admin/Health/QueueMonitor';
import ResourceUsage from '@/Components/Admin/Health/ResourceUsage';
import PerformanceChart from '@/Components/Admin/Health/PerformanceChart';
import { 
    ArrowPathIcon, 
    ExclamationTriangleIcon, 
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface SystemHealthPageProps {
    initialMetrics?: any;
    error?: string;
    refreshInterval?: number;
}

export default function SystemHealth({ 
    initialMetrics, 
    error: initialError,
    refreshInterval = 30000 
}: SystemHealthPageProps) {
    const [performanceHours, setPerformanceHours] = useState(24);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const {
        data,
        metrics,
        accounts,
        performance,
        overallHealth,
        isLoading,
        error,
        lastUpdated,
        refresh,
        refreshPerformance,
        isRefreshing
    } = useSystemHealth({
        refreshInterval: 60000, // Reduce to 60 seconds to prevent too frequent updates
        autoRefresh: true,
        onStatusChange: (status) => {
            // Handle status changes (could trigger notifications)
            console.log('System health status changed to:', status);
        },
        onError: (error) => {
            console.error('System health error:', error);
        }
    });

    const handleRefresh = useCallback(async () => {
        await refresh();
    }, [refresh]);

    const handlePerformanceHoursChange = useCallback(async (hours: number) => {
        setPerformanceHours(hours);
        await refreshPerformance(hours);
    }, [refreshPerformance]);

    const handleExport = useCallback(async (format: 'json' | 'csv') => {
        try {
            const response = await fetch(`/admin/api/system-health/export?format=${format}&hours=${performanceHours}`);
            const data = await response.json();
            
            if (data.success) {
                // Create download
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
                    type: format === 'json' ? 'application/json' : 'text/csv' 
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename || `system_health_report.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
        setShowExportMenu(false);
    }, [performanceHours]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'critical':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'warning':
                return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            case 'critical':
                return 'text-red-700 bg-red-50 border-red-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    return (
        <>
            <Head title="Sistemin statusu - Super Admin" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Sistemin statusu
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Real vaxt sistem performansı və resurs istifadəsi monitorinqi
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Navigation */}
                    <SuperAdminNav />

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            {lastUpdated && (
                                <span className="text-sm text-gray-500">
                                    Son yeniləmə: {lastUpdated.toLocaleTimeString('az')}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                    İxrac et
                                </button>
                                
                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                        <div className="py-1">
                                            <button
                                                onClick={() => handleExport('json')}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                            >
                                                JSON formatında
                                            </button>
                                            <button
                                                onClick={() => handleExport('csv')}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                            >
                                                CSV formatında
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? 'Yenilənir...' : 'Yenilə'}
                            </button>
                        </div>
                    </div>

                    {/* Error State */}
                    {(initialError || error) && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Sistem status məlumatları yüklənə bilmədi
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{initialError || error}</p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 rounded-md disabled:opacity-50"
                                        >
                                            {isRefreshing ? 'Yenilənir...' : 'Yenidən cəhd et'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading state */}
                    {isLoading && !data && (
                        <div className="animate-pulse">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-lg shadow h-48" />
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white rounded-lg shadow h-64" />
                                ))}
                            </div>
                        </div>
                    )}

            {/* Content */}
            {data && (
                <>
                    {/* Overall Health Status */}
                    {overallHealth && (
                        <div className={`rounded-lg border p-4 mb-6 ${getStatusColor(overallHealth.status)}`}>
                            <div className="flex items-center">
                                {getStatusIcon(overallHealth.status)}
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">
                                        Sistem Vəziyyəti: {
                                            overallHealth.status === 'healthy' ? 'Sağlam' :
                                            overallHealth.status === 'warning' ? 'Diqqət tələb edir' :
                                            overallHealth.status === 'critical' ? 'Kritik' : 'Naməlum'
                                        }
                                    </h3>
                                    {overallHealth.issues.length > 0 && (
                                        <div className="mt-2 text-sm">
                                            <ul className="list-disc list-inside">
                                                {overallHealth.issues.map((issue, index) => (
                                                    <li key={index}>{issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Metrics Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <SystemMetrics metrics={metrics} />
                        <ResourceUsage usage={metrics} />
                        <QueueMonitor queues={metrics?.queue_status || []} />
                    </div>

                    {/* Charts and Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <PerformanceChart 
                            data={performance} 
                            hours={performanceHours}
                            onHoursChange={handlePerformanceHoursChange}
                        />
                        
                        {/* Account Resource Overview */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Hesab Resurs İstifadəsi
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4 max-h-80 overflow-y-auto">
                                    {accounts.length > 0 ? accounts.map((account) => (
                                        <div key={account.id} className="flex items-center justify-between border-b pb-3">
                                            <div>
                                                <div className="font-medium text-gray-900">{account.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {account.plan} • {account.total_users} istifadəçi
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    account.status === 'active' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {account.status === 'active' ? 'Aktiv' : 'Dayandırılıb'}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-gray-500 text-sm">Məlumat yoxdur</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional System Information */}
                    {metrics && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Cache Status */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Keş Statusu</h3>
                                </div>
                                <div className="p-6">
                                    <dl className="grid grid-cols-1 gap-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="mt-1 text-sm text-gray-900 capitalize">
                                                {metrics.cache_status.status}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Hit Rate</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {metrics.cache_status.hit_rate}%
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Memory Usage</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {metrics.cache_status.memory_usage}%
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Storage Status */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Yaddaş Statusu</h3>
                                </div>
                                <div className="p-6">
                                    <dl className="grid grid-cols-1 gap-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Lokal Yaddaş</dt>
                                            <dd className="mt-1 text-sm text-gray-900 capitalize">
                                                {metrics.storage_health.local.status}
                                            </dd>
                                        </div>
                                        {metrics.storage_health.azure && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Azure Blob</dt>
                                                <dd className="mt-1 text-sm text-gray-900 capitalize">
                                                    {metrics.storage_health.azure.status}
                                                </dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Məlumat Bazası Bağlantıları</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {metrics.database_connections}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                )}
                </div>
            </div>
        </>
    );
}