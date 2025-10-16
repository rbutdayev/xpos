import { ReactNode } from 'react';

interface Props {
    title: string;
    value: string | number;
    icon?: ReactNode;
    subtitle?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
    trend?: {
        direction: 'up' | 'down' | 'neutral';
        value: string;
        label: string;
    };
    onClick?: () => void;
    className?: string;
}

export default function StatCard({ 
    title, 
    value, 
    icon, 
    subtitle, 
    color = 'gray',
    trend,
    onClick,
    className = ""
}: Props) {
    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue':
                return {
                    bg: 'bg-blue-50',
                    iconBg: 'bg-blue-100',
                    iconText: 'text-blue-600',
                    value: 'text-blue-600'
                };
            case 'green':
                return {
                    bg: 'bg-green-50',
                    iconBg: 'bg-green-100',
                    iconText: 'text-green-600',
                    value: 'text-green-600'
                };
            case 'yellow':
                return {
                    bg: 'bg-yellow-50',
                    iconBg: 'bg-yellow-100',
                    iconText: 'text-yellow-600',
                    value: 'text-yellow-600'
                };
            case 'red':
                return {
                    bg: 'bg-red-50',
                    iconBg: 'bg-red-100',
                    iconText: 'text-red-600',
                    value: 'text-red-600'
                };
            case 'purple':
                return {
                    bg: 'bg-purple-50',
                    iconBg: 'bg-purple-100',
                    iconText: 'text-purple-600',
                    value: 'text-purple-600'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    iconBg: 'bg-gray-100',
                    iconText: 'text-gray-600',
                    value: 'text-gray-900'
                };
        }
    };

    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case 'up':
                return (
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'down':
                return (
                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const colorClasses = getColorClasses(color);

    const CardContent = () => (
        <div className={`${colorClasses.bg} rounded-lg p-6 border border-gray-200 ${className}`}>
            <div className="flex items-center">
                {icon && (
                    <div className={`${colorClasses.iconBg} rounded-md p-3 mr-4`}>
                        <div className={`w-6 h-6 ${colorClasses.iconText}`}>
                            {icon}
                        </div>
                    </div>
                )}
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                        {title}
                    </div>
                    <div className={`text-2xl font-bold ${colorClasses.value} mb-1`}>
                        {typeof value === 'number' ? value.toLocaleString('az-AZ') : value}
                    </div>
                    {subtitle && (
                        <div className="text-sm text-gray-500">
                            {subtitle}
                        </div>
                    )}
                    {trend && (
                        <div className="flex items-center mt-2">
                            {getTrendIcon(trend.direction)}
                            <span className={`ml-1 text-sm font-medium ${
                                trend.direction === 'up' ? 'text-green-600' :
                                trend.direction === 'down' ? 'text-red-600' :
                                'text-gray-500'
                            }`}>
                                {trend.value}
                            </span>
                            <span className="ml-1 text-sm text-gray-500">
                                {trend.label}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className="w-full text-left transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg"
            >
                <CardContent />
            </button>
        );
    }

    return <CardContent />;
}