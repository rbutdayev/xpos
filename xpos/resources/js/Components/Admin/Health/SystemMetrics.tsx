import React, { memo } from 'react';
import SettingsCard from '@/Components/Admin/SettingsCard';
import { 
    CpuChipIcon,
    CircleStackIcon,
    ServerIcon,
    UsersIcon
} from '@heroicons/react/24/outline';

interface SystemMetricsProps {
    metrics: {
        cpu_usage: number;
        memory_usage: number;
        disk_usage: number;
        active_sessions: number;
        database_connections: number;
    } | null;
}

interface MetricBarProps {
    label: string;
    value: number;
    max?: number;
    color?: 'green' | 'yellow' | 'red' | 'blue';
    icon?: React.ComponentType<{ className?: string }>;
    suffix?: string;
}

const MetricBar = memo(({ 
    label, 
    value, 
    max = 100, 
    color = 'blue',
    icon: Icon,
    suffix = '%'
}: MetricBarProps) => {
    const percentage = Math.min((value / max) * 100, 100);
    
    const colorClasses = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500'
    };

    const getColor = (value: number, max: number): 'green' | 'yellow' | 'red' => {
        const percent = (value / max) * 100;
        if (percent >= 90) return 'red';
        if (percent >= 75) return 'yellow';
        return 'green';
    };

    const autoColor = color === 'blue' && suffix === '%' ? getColor(value, max) : color;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                    {value.toFixed(1)}{suffix}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${colorClasses[autoColor]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
});

MetricBar.displayName = 'MetricBar';

const SystemMetrics = memo(({ metrics }: SystemMetricsProps) => {
    if (!metrics) {
        return (
            <SettingsCard className="animate-pulse">
                <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded"></div>
                                <div className="h-2 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </SettingsCard>
        );
    }

    return (
        <SettingsCard>
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <ServerIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Sistem Resursları
                </h3>
                
                <div className="space-y-4">
                    <MetricBar 
                        label="CPU İstifadəsi" 
                        value={metrics.cpu_usage} 
                        icon={CpuChipIcon}
                        suffix="%"
                    />
                    
                    <MetricBar 
                        label="Yaddaş İstifadəsi" 
                        value={metrics.memory_usage} 
                        icon={CircleStackIcon}
                        suffix="%"
                    />
                    
                    <MetricBar 
                        label="Disk İstifadəsi" 
                        value={metrics.disk_usage} 
                        suffix="%"
                    />
                    
                    <div className="pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <UsersIcon className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Aktiv Sesiyalar
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                    {metrics.active_sessions}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <CircleStackIcon className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                        DB Bağlantıları
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                    {metrics.database_connections}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsCard>
    );
});

SystemMetrics.displayName = 'SystemMetrics';

export default SystemMetrics;