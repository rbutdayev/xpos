import React, { memo } from 'react';
import SettingsCard from '@/Components/Admin/SettingsCard';
import { 
    ServerIcon,
    CloudIcon,
    WifiIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ResourceUsageProps {
    usage: {
        error_rate: number;
        response_time: number;
        cache_status: {
            status: string;
            hit_rate: number;
            memory_usage: number;
        };
        storage_health: {
            local: {
                status: string;
                free_space?: number;
                total_space?: number;
            };
            azure?: {
                status: string;
                configured: boolean;
            };
        };
    } | null;
}

const ResourceUsage = memo(({ usage }: ResourceUsageProps) => {
    if (!usage) {
        return (
            <SettingsCard className="animate-pulse">
                <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded"></div>
                                <div className="h-8 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </SettingsCard>
        );
    }

    const formatBytes = (bytes: number): string => {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = bytes / Math.pow(1024, i);
        
        return `${size.toFixed(1)} ${sizes[i]}`;
    };

    const formatResponseTime = (ms: number): string => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const getStatusColor = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'healthy':
            case 'sağlam':
                return 'text-green-700 bg-green-100 border-green-300';
            case 'warning':
            case 'diqqət':
                return 'text-yellow-700 bg-yellow-100 border-yellow-300';
            case 'error':
            case 'xəta':
                return 'text-red-700 bg-red-100 border-red-300';
            default:
                return 'text-gray-700 bg-gray-100 border-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'healthy':
            case 'sağlam':
                return <WifiIcon className="h-4 w-4 text-green-500" />;
            case 'warning':
            case 'diqqət':
                return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
            case 'error':
            case 'xəta':
                return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
            default:
                return <ServerIcon className="h-4 w-4 text-gray-500" />;
        }
    };

    const diskUsagePercent = usage.storage_health.local.free_space && usage.storage_health.local.total_space 
        ? Math.round(((usage.storage_health.local.total_space - usage.storage_health.local.free_space) / usage.storage_health.local.total_space) * 100)
        : null;

    return (
        <SettingsCard>
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <ServerIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Sistem Performansı
                </h3>

                <div className="space-y-4">
                    {/* Response Time */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">
                                Cavab Müddəti
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                usage.response_time > 1000 
                                    ? 'bg-red-100 text-red-700'
                                    : usage.response_time > 500 
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                            }`}>
                                {formatResponseTime(usage.response_time)}
                            </span>
                        </div>
                    </div>

                    {/* Error Rate */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-700">
                                Xəta Nisbəti
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                usage.error_rate > 5 
                                    ? 'bg-red-100 text-red-700'
                                    : usage.error_rate > 2 
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                            }`}>
                                {usage.error_rate.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Cache Status */}
                    <div className={`p-3 border rounded-lg ${getStatusColor(usage.cache_status.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                {getStatusIcon(usage.cache_status.status)}
                                <span className="text-sm font-medium">
                                    Keş Sistemi
                                </span>
                            </div>
                            <span className="text-xs font-medium capitalize">
                                {usage.cache_status.status}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <div className="text-xs text-gray-600">Hit Rate</div>
                                <div className="text-sm font-semibold">
                                    {usage.cache_status.hit_rate}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div
                                        className="h-1.5 bg-blue-500 rounded-full"
                                        style={{ width: `${usage.cache_status.hit_rate}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600">Yaddaş İstifadəsi</div>
                                <div className="text-sm font-semibold">
                                    {usage.cache_status.memory_usage}%
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div
                                        className={`h-1.5 rounded-full ${
                                            usage.cache_status.memory_usage > 90 ? 'bg-red-500' :
                                            usage.cache_status.memory_usage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${usage.cache_status.memory_usage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Storage Status */}
                    <div className="space-y-3">
                        {/* Local Storage */}
                        <div className={`p-3 border rounded-lg ${getStatusColor(usage.storage_health.local.status)}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <ServerIcon className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Lokal Yaddaş
                                    </span>
                                </div>
                                <span className="text-xs font-medium capitalize">
                                    {usage.storage_health.local.status}
                                </span>
                            </div>
                            
                            {diskUsagePercent !== null && (
                                <div>
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Disk İstifadəsi</span>
                                        <span>{diskUsagePercent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                        <div
                                            className={`h-1.5 rounded-full ${
                                                diskUsagePercent > 90 ? 'bg-red-500' :
                                                diskUsagePercent > 80 ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${diskUsagePercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>
                                            Boş: {formatBytes(usage.storage_health.local.free_space || 0)}
                                        </span>
                                        <span>
                                            Ümumi: {formatBytes(usage.storage_health.local.total_space || 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Azure Storage */}
                        {usage.storage_health.azure && (
                            <div className={`p-3 border rounded-lg ${getStatusColor(usage.storage_health.azure.status)}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <CloudIcon className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            Azure Blob Storage
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            usage.storage_health.azure.configured 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {usage.storage_health.azure.configured ? 'Konfiqurasiya edilib' : 'Konfiqurasiya edilməyib'}
                                        </span>
                                        <span className="text-xs font-medium capitalize">
                                            {usage.storage_health.azure.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Son yoxlama: {new Date().toLocaleTimeString('az')}
                    </p>
                </div>
            </div>
        </SettingsCard>
    );
});

ResourceUsage.displayName = 'ResourceUsage';

export default ResourceUsage;