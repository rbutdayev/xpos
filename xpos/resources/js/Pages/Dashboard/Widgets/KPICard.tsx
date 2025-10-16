import { ReactNode, memo } from 'react';
import { getKPIColorClasses, getTrendColorClasses } from '../Utils/widgetHelpers';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
        period: string;
    };
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

const KPICard = memo(function KPICard({ 
    title, 
    value, 
    icon, 
    trend, 
    color = 'blue' 
}: KPICardProps) {
    const colorClass = getKPIColorClasses(color);
    const trendColorClass = trend ? getTrendColorClasses(trend.isPositive) : '';

    const formattedValue = typeof value === 'number' && value > 999 
        ? value.toLocaleString('az-AZ') 
        : value;

    return (
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClass}`}>
                    {icon}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-500 truncate" title={title}>
                        {title}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 truncate" title={String(formattedValue)}>
                        {formattedValue}
                    </p>
                    {trend && (
                        <div className={`text-sm ${trendColorClass} flex items-center mt-1`}>
                            <span className="mr-1 flex-shrink-0">
                                {trend.isPositive ? '↗' : '↘'}
                            </span>
                            <span className="truncate">
                                {Math.abs(trend.value)}% {trend.period}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default KPICard;