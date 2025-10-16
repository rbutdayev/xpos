import React, { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import SettingsCard from '../SettingsCard';

interface Threat {
    id: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ip_address?: string;
    created_at: string;
    resolved_at?: string;
}

interface ThreatMonitorProps {
    threats: Threat[];
    onBlockIP: (ip: string) => void;
    onResolveEvent: (eventId: number) => void;
}

const ThreatMonitor = memo(({ threats, onBlockIP, onResolveEvent }: ThreatMonitorProps) => {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getSeverityTextColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-700 bg-red-100';
            case 'high': return 'text-orange-700 bg-orange-100';
            case 'medium': return 'text-yellow-700 bg-yellow-100';
            case 'low': return 'text-blue-700 bg-blue-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    return (
        <SettingsCard>
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Active Threats</h3>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium">Security Events</h4>
                    <span className="text-sm text-gray-600">
                        {threats.filter(t => !t.resolved_at).length} unresolved
                    </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {threats.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-green-600 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p>No active threats detected</p>
                        </div>
                    ) : (
                        threats.map(threat => (
                            <div key={threat.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(threat.severity)}`} />
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityTextColor(threat.severity)}`}>
                                                    {threat.severity.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(threat.created_at))} ago
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{threat.description}</p>
                                            {threat.ip_address && (
                                                <p className="text-sm text-gray-600 font-mono">{threat.ip_address}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {!threat.resolved_at && (
                                        <div className="flex space-x-2">
                                            {threat.ip_address && (
                                                <button
                                                    onClick={() => onBlockIP(threat.ip_address!)}
                                                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                                                >
                                                    Block IP
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onResolveEvent(threat.id)}
                                                className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                                            >
                                                Resolve
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {threat.resolved_at && (
                                    <div className="mt-2 text-xs text-green-600 font-medium">
                                        ✓ Resolved {formatDistanceToNow(new Date(threat.resolved_at))} ago
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </SettingsCard>
    );
});

ThreatMonitor.displayName = 'ThreatMonitor';

export default ThreatMonitor;