import React, { memo, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import SettingsCard from '../SettingsCard';

interface AuditLog {
    id: number;
    action: string;
    model_type?: string;
    model_id?: number;
    changes?: any;
    ip_address?: string;
    user_agent?: string;
    geolocation?: {
        country: string;
        city: string;
    };
    device_type?: string;
    created_at: string;
    user?: {
        name: string;
        email: string;
    };
    account?: {
        name: string;
    };
}

interface AuditViewerProps {
    onLoadAuditLogs: (params: any) => Promise<{ data: AuditLog[], meta: any }>;
}

const AuditViewer = memo(({ onLoadAuditLogs }: AuditViewerProps) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        action: '',
        ip: '',
        hours: '24'
    });

    const loadLogs = async () => {
        setLoading(true);
        try {
            const result = await onLoadAuditLogs({
                action: filters.action || undefined,
                ip: filters.ip || undefined,
                hours: filters.hours ? parseInt(filters.hours) : undefined,
                per_page: 20
            });
            setLogs(result.data);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [filters]);

    const getActionColor = (action: string) => {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('delete')) return 'bg-red-100 text-red-800';
        if (lowerAction.includes('create')) return 'bg-green-100 text-green-800';
        if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'bg-blue-100 text-blue-800';
        if (lowerAction.includes('login')) return 'bg-purple-100 text-purple-800';
        if (lowerAction.includes('view') || lowerAction.includes('show')) return 'bg-gray-100 text-gray-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    const getDeviceIcon = (deviceType?: string) => {
        switch (deviceType) {
            case 'mobile':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                    </svg>
                );
            case 'tablet':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
        }
    };

    return (
        <SettingsCard>
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Enhanced Audit Logs</h3>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Action
                        </label>
                        <input
                            id="action-filter"
                            type="text"
                            value={filters.action}
                            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                            placeholder="Filter by action..."
                            className="border rounded px-3 py-1 text-sm w-48"
                        />
                    </div>

                    <div>
                        <label htmlFor="ip-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            IP Address
                        </label>
                        <input
                            id="ip-filter"
                            type="text"
                            value={filters.ip}
                            onChange={(e) => setFilters(prev => ({ ...prev, ip: e.target.value }))}
                            placeholder="Filter by IP..."
                            className="border rounded px-3 py-1 text-sm w-36"
                        />
                    </div>

                    <div>
                        <label htmlFor="hours-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Time Range
                        </label>
                        <select
                            id="hours-filter"
                            value={filters.hours}
                            onChange={(e) => setFilters(prev => ({ ...prev, hours: e.target.value }))}
                            className="border rounded px-3 py-1 text-sm"
                        >
                            <option value="1">Last Hour</option>
                            <option value="24">Last 24 Hours</option>
                            <option value="168">Last Week</option>
                            <option value="720">Last Month</option>
                            <option value="">All Time</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={loadLogs}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-600 mt-2">Loading audit logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No audit logs found for the current filters
                            </div>
                        ) : (
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">User</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Action</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Details</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Location</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Device</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-3">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {log.user?.name || 'System'}
                                                    </div>
                                                    {log.user?.email && (
                                                        <div className="text-xs text-gray-500">
                                                            {log.user.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="max-w-xs">
                                                    {log.model_type && (
                                                        <div className="text-gray-600">
                                                            {log.model_type} #{log.model_id}
                                                        </div>
                                                    )}
                                                    {log.ip_address && (
                                                        <div className="text-xs text-gray-500 font-mono mt-1">
                                                            {log.ip_address}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {log.geolocation && (
                                                    <div className="text-xs text-gray-600">
                                                        <div>{log.geolocation.city}</div>
                                                        <div>{log.geolocation.country}</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="flex items-center text-gray-600">
                                                    {getDeviceIcon(log.device_type)}
                                                    <span className="ml-1 text-xs capitalize">
                                                        {log.device_type || 'unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-gray-600">
                                                <div className="text-xs">
                                                    {formatDistanceToNow(new Date(log.created_at))} ago
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </SettingsCard>
    );
});

AuditViewer.displayName = 'AuditViewer';

export default AuditViewer;