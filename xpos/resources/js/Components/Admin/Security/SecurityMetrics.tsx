import React, { memo } from 'react';

interface SecurityMetricsProps {
    metrics: {
        total_events: number;
        critical_events: number;
        failed_logins: number;
        blocked_ips: number;
        unresolved_events: number;
    };
}

const SecurityMetrics = memo(({ metrics }: SecurityMetricsProps) => {
    const cards = [
        {
            title: 'Security Events',
            value: metrics.total_events,
            subtitle: 'Last 24 hours',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            color: 'text-blue-600 bg-blue-100',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Critical Events',
            value: metrics.critical_events,
            subtitle: metrics.critical_events > 0 ? 'Requires attention' : 'All clear',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
            color: metrics.critical_events > 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100',
            bgColor: metrics.critical_events > 0 ? 'bg-red-50' : 'bg-green-50'
        },
        {
            title: 'Failed Logins',
            value: metrics.failed_logins,
            subtitle: 'Last 24 hours',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
            ),
            color: metrics.failed_logins > 50 ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100',
            bgColor: metrics.failed_logins > 50 ? 'bg-red-50' : 'bg-yellow-50'
        },
        {
            title: 'Blocked IPs',
            value: metrics.blocked_ips,
            subtitle: 'Currently active',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 5.636m0 12.728L18.364 5.636" />
                </svg>
            ),
            color: 'text-orange-600 bg-orange-100',
            bgColor: 'bg-orange-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <div key={index} className={`${card.bgColor} rounded-lg p-6 border`}>
                    <div className="flex items-center">
                        <div className={`${card.color} rounded-lg p-2`}>
                            {card.icon}
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-gray-900">
                            {card.value.toLocaleString()}
                        </h3>
                        <p className="text-sm font-medium text-gray-600 mt-1">
                            {card.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {card.subtitle}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
});

SecurityMetrics.displayName = 'SecurityMetrics';

export default SecurityMetrics;