import React, { memo, useMemo } from 'react';
import SettingsCard from '@/Components/Admin/SettingsCard';
import { 
    ChartBarIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetric {
    timestamp: string;
    response_time: number;
    error_rate: number;
    requests: number;
    cpu_usage: number;
    memory_usage: number;
}

interface PerformanceChartProps {
    data: PerformanceMetric[];
    hours: number;
    onHoursChange: (hours: number) => void;
}

const PerformanceChart = memo(({ data, hours, onHoursChange }: PerformanceChartProps) => {
    const timeOptions = [
        { value: 1, label: '1 saat' },
        { value: 6, label: '6 saat' },
        { value: 12, label: '12 saat' },
        { value: 24, label: '24 saat' },
        { value: 72, label: '3 gün' },
        { value: 168, label: '1 həftə' }
    ];

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return null;

        const sortedData = [...data].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const maxResponseTime = Math.max(...sortedData.map(d => d.response_time));
        const maxErrorRate = Math.max(...sortedData.map(d => d.error_rate));
        const maxRequests = Math.max(...sortedData.map(d => d.requests));
        const maxCpuUsage = Math.max(...sortedData.map(d => d.cpu_usage));
        const maxMemoryUsage = Math.max(...sortedData.map(d => d.memory_usage));

        const avgResponseTime = sortedData.reduce((sum, d) => sum + d.response_time, 0) / sortedData.length;
        const avgErrorRate = sortedData.reduce((sum, d) => sum + d.error_rate, 0) / sortedData.length;
        const totalRequests = sortedData.reduce((sum, d) => sum + d.requests, 0);

        return {
            data: sortedData,
            maxResponseTime,
            maxErrorRate,
            maxRequests,
            maxCpuUsage,
            maxMemoryUsage,
            avgResponseTime,
            avgErrorRate,
            totalRequests
        };
    }, [data]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('az', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    if (!processedData || processedData.data.length === 0) {
        return (
            <SettingsCard>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
                            Performans Metrikleri
                        </h3>
                        <select
                            value={hours}
                            onChange={(e) => onHoursChange(Number(e.target.value))}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                        >
                            {timeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="text-center py-6">
                        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Performans məlumatı yoxdur
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Seçilmiş vaxt aralığı üçün məlumat mövcud deyil.
                        </p>
                    </div>
                </div>
            </SettingsCard>
        );
    }

    return (
        <SettingsCard>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Performans Metrikleri
                    </h3>
                    <select
                        value={hours}
                        onChange={(e) => onHoursChange(Number(e.target.value))}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                    >
                        {timeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                            {formatDuration(processedData.avgResponseTime)}
                        </div>
                        <div className="text-xs text-gray-600">Orta Cavab Müddəti</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-lg font-semibold ${
                            processedData.avgErrorRate > 5 ? 'text-red-600' : 
                            processedData.avgErrorRate > 2 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                            {processedData.avgErrorRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Orta Xəta Nisbəti</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                            {processedData.totalRequests.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Ümumi Sorğular</div>
                    </div>
                </div>

                {/* Simple Charts */}
                <div className="space-y-6">
                    {/* Response Time Chart */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Cavab Müddəti (ms)
                        </h4>
                        <div className="space-y-2">
                            {processedData.data.slice(-8).map((metric, index) => {
                                const height = (metric.response_time / processedData.maxResponseTime) * 100;
                                const isHigh = metric.response_time > processedData.avgResponseTime * 1.5;
                                
                                return (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className="text-xs text-gray-500 w-12">
                                            {formatTime(metric.timestamp)}
                                        </div>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${
                                                    isHigh ? 'bg-red-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${height}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-700 w-16 text-right">
                                            {formatDuration(metric.response_time)}
                                        </div>
                                        {isHigh && (
                                            <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Rate Chart */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Xəta Nisbəti (%)
                        </h4>
                        <div className="space-y-2">
                            {processedData.data.slice(-8).map((metric, index) => {
                                const height = processedData.maxErrorRate > 0 ? 
                                    (metric.error_rate / processedData.maxErrorRate) * 100 : 0;
                                const isHigh = metric.error_rate > 5;
                                
                                return (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className="text-xs text-gray-500 w-12">
                                            {formatTime(metric.timestamp)}
                                        </div>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${
                                                    isHigh ? 'bg-red-500' : 
                                                    metric.error_rate > 2 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${height}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-700 w-16 text-right">
                                            {metric.error_rate.toFixed(1)}%
                                        </div>
                                        {isHigh && (
                                            <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resource Usage */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Resurs İstifadəsi
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>CPU</span>
                                    <span>{processedData.data[processedData.data.length - 1]?.cpu_usage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 bg-blue-500 rounded-full"
                                        style={{ 
                                            width: `${(processedData.data[processedData.data.length - 1]?.cpu_usage || 0)}%` 
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Yaddaş</span>
                                    <span>{processedData.data[processedData.data.length - 1]?.memory_usage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 bg-purple-500 rounded-full"
                                        style={{ 
                                            width: `${(processedData.data[processedData.data.length - 1]?.memory_usage || 0)}%` 
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Son {processedData.data.length} məlumat nöqtəsi göstərilir • 
                        Son yeniləmə: {new Date().toLocaleTimeString('az')}
                    </p>
                </div>
            </div>
        </SettingsCard>
    );
});

PerformanceChart.displayName = 'PerformanceChart';

export default PerformanceChart;