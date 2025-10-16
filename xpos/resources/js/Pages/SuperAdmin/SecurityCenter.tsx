import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import SecurityMetrics from '../../Components/Admin/Security/SecurityMetrics';
import ThreatMonitor from '../../Components/Admin/Security/ThreatMonitor';
import LoginAttempts from '../../Components/Admin/Security/LoginAttempts';
import IPBlocklist from '../../Components/Admin/Security/IPBlocklist';
import AuditViewer from '../../Components/Admin/Security/AuditViewer';
import { useSecurity } from '../../Hooks/Admin/useSecurity';

interface SecurityCenterProps {
    metrics: {
        total_events: number;
        critical_events: number;
        failed_logins: number;
        blocked_ips: number;
        unresolved_events: number;
    };
    recentEvents: any[];
    recentAttempts: any[];
    blockedIPs: any[];
}

export default function SecurityCenter({ 
    metrics: initialMetrics, 
    recentEvents: initialEvents, 
    recentAttempts: initialAttempts, 
    blockedIPs: initialBlockedIPs 
}: SecurityCenterProps) {
    const {
        securityEvents,
        loginAttempts,
        blockedIPs,
        metrics,
        loading,
        blockIP,
        unblockIP,
        resolveEvent,
        loadAuditLogs,
        refreshData
    } = useSecurity({
        initialMetrics,
        initialEvents,
        initialAttempts,
        initialBlockedIPs
    });

    const [threatLevel, setThreatLevel] = useState<{
        level: 'low' | 'medium' | 'high' | 'critical';
        threats: string[];
    }>({
        level: 'low',
        threats: []
    });

    React.useEffect(() => {
        const level = metrics.critical_events > 0 ? 'critical' :
                     metrics.failed_logins > 50 ? 'high' :
                     metrics.unresolved_events > 10 ? 'medium' : 'low';
        
        const threats = [];
        if (metrics.critical_events > 0) threats.push('Critical security events detected');
        if (metrics.failed_logins > 50) threats.push('High number of failed login attempts');
        if (metrics.unresolved_events > 10) threats.push('Multiple unresolved security events');
        
        setThreatLevel({ level, threats });
    }, [metrics]);

    const getThreatLevelColor = (level: string) => {
        switch (level) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getThreatIcon = (level: string) => {
        switch (level) {
            case 'critical':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            case 'high':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <>
            <Head title="Təhlükəsizlik Mərkəzi - Super Admin" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Təhlükəsizlik və Audit Mərkəzi
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Təhlükəsizlik hadisələrini izləyin, IP ünvanlarını idarə edin və audit loglarını nəzərdən keçirin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-8">
                        {/* Navigation */}
                        <div className="mb-8">
                            <nav className="flex space-x-4">
                                <a
                                    href="/admin"
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Dashboard
                                </a>
                                <a
                                    href="/admin/accounts"
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Hesablar
                                </a>
                                <a
                                    href="/admin/users"
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    İstifadəçilər
                                </a>
                                <a
                                    href="/admin/system-stats"
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Sistem Statistikası
                                </a>
                                <a
                                    href="/admin/system-health"
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Sistemin statusu
                                </a>
                                <a
                                    href="/admin/security"
                                    className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Təhlükəsizlik Mərkəzi
                                </a>
                                <a
                                    href="/admin/storage-settings"
                                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Azure Storage
                                </a>
                            </nav>
                        </div>

                        {/* Action Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Security & Audit Center</h2>
                                <p className="text-gray-600 mt-1">
                                    Monitor security events, manage blocked IPs, and review audit logs
                                </p>
                            </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getThreatLevelColor(threatLevel.level)}`}>
                            {getThreatIcon(threatLevel.level)}
                            <span className="font-medium">
                                Threat Level: {threatLevel.level.toUpperCase()}
                            </span>
                        </div>
                        
                        <button
                            onClick={refreshData}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Refreshing...</span>
                                </div>
                            ) : (
                                'Refresh Data'
                            )}
                        </button>
                    </div>
                </div>

                {/* Metrics Overview */}
                <SecurityMetrics metrics={metrics} />

                {/* Threat Alerts */}
                {threatLevel.threats.length > 0 && (
                    <div className={`p-4 rounded-lg border-l-4 ${
                        threatLevel.level === 'critical' ? 'bg-red-50 border-red-400' :
                        threatLevel.level === 'high' ? 'bg-orange-50 border-orange-400' :
                        'bg-yellow-50 border-yellow-400'
                    }`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {getThreatIcon(threatLevel.level)}
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">
                                    Security Alert - {threatLevel.level.toUpperCase()} Priority
                                </h3>
                                <ul className="mt-2 text-sm list-disc list-inside">
                                    {threatLevel.threats.map((threat, index) => (
                                        <li key={index}>{threat}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Threat Monitor */}
                    <div className="lg:col-span-2">
                        <ThreatMonitor
                            threats={securityEvents}
                            onBlockIP={blockIP}
                            onResolveEvent={resolveEvent}
                        />
                    </div>

                    {/* Login Attempts */}
                    <LoginAttempts
                        attempts={loginAttempts}
                        onBlockIP={blockIP}
                    />

                    {/* IP Blocklist */}
                    <IPBlocklist
                        blockedIPs={blockedIPs}
                        onUnblockIP={unblockIP}
                        onBlockIP={blockIP}
                    />
                </div>

                        {/* Enhanced Audit Logs */}
                        <div className="mt-8">
                            <AuditViewer onLoadAuditLogs={loadAuditLogs} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}