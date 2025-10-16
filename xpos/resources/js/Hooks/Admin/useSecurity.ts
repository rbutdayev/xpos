import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface SecurityMetrics {
    total_events: number;
    critical_events: number;
    failed_logins: number;
    blocked_ips: number;
    unresolved_events: number;
}

interface SecurityEvent {
    id: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    user_id?: number;
    account_id?: number;
    ip_address?: string;
    user_agent?: string;
    geolocation?: any;
    resolved_at?: string;
    created_at: string;
    user?: {
        name: string;
        email: string;
    };
    account?: {
        name: string;
    };
}

interface LoginAttempt {
    id: number;
    email: string;
    ip_address: string;
    success: boolean;
    user_agent?: string;
    attempted_at: string;
}

interface BlockedIP {
    id: number;
    ip_address: string;
    reason: string;
    is_permanent: boolean;
    blocked_at: string;
    expires_at?: string;
    blocked_by?: {
        name: string;
        email: string;
    };
}

interface UseSecurityOptions {
    initialMetrics?: SecurityMetrics;
    initialEvents?: SecurityEvent[];
    initialAttempts?: LoginAttempt[];
    initialBlockedIPs?: BlockedIP[];
}

export const useSecurity = (options: UseSecurityOptions = {}) => {
    const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(options.initialEvents || []);
    const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>(options.initialAttempts || []);
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>(options.initialBlockedIPs || []);
    const [metrics, setMetrics] = useState<SecurityMetrics>(options.initialMetrics || {
        total_events: 0,
        critical_events: 0,
        failed_logins: 0,
        blocked_ips: 0,
        unresolved_events: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleError = (error: any, defaultMessage: string) => {
        console.error(error);
        const message = error.response?.data?.message || defaultMessage;
        setError(message);
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
    };

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [metricsRes, eventsRes, attemptsRes, blockedRes] = await Promise.all([
                axios.get('/admin/security/metrics'),
                axios.get('/admin/security/events?hours=24&per_page=20'),
                axios.get('/admin/security/login-attempts?hours=24&per_page=50'),
                axios.get('/admin/security/blocked-ips')
            ]);

            setMetrics(metricsRes.data.metrics);
            setSecurityEvents(eventsRes.data.data);
            setLoginAttempts(attemptsRes.data.data);
            setBlockedIPs(blockedRes.data);
        } catch (error) {
            handleError(error, 'Failed to refresh security data');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSecurityEvents = useCallback(async (params: any = {}) => {
        try {
            const response = await axios.get('/admin/security/events', { params });
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to load security events');
            return { data: [], meta: {} };
        }
    }, []);

    const loadLoginAttempts = useCallback(async (params: any = {}) => {
        try {
            const response = await axios.get('/admin/security/login-attempts', { params });
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to load login attempts');
            return { data: [], meta: {} };
        }
    }, []);

    const loadAuditLogs = useCallback(async (params: any = {}) => {
        try {
            const response = await axios.get('/admin/security/audit-logs', { params });
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to load audit logs');
            return { data: [], meta: {} };
        }
    }, []);

    const blockIP = useCallback(async (
        ipAddress: string, 
        reason: string = 'Manual block', 
        isPermanent: boolean = false, 
        hours: number = 24
    ) => {
        try {
            const response = await axios.post('/admin/security/block-ip', {
                ip_address: ipAddress,
                reason,
                is_permanent: isPermanent,
                hours
            });

            setBlockedIPs(response.data.blocked_ips);
            
            // Refresh metrics to update blocked count
            const metricsRes = await axios.get('/admin/security/metrics');
            setMetrics(metricsRes.data.metrics);
            
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to block IP address');
            throw error;
        }
    }, []);

    const unblockIP = useCallback(async (ipAddress: string) => {
        try {
            const response = await axios.post('/admin/security/unblock-ip', {
                ip_address: ipAddress
            });

            setBlockedIPs(response.data.blocked_ips);
            
            // Refresh metrics to update blocked count
            const metricsRes = await axios.get('/admin/security/metrics');
            setMetrics(metricsRes.data.metrics);
            
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to unblock IP address');
            throw error;
        }
    }, []);

    const resolveEvent = useCallback(async (eventId: number) => {
        try {
            await axios.post(`/admin/security/events/${eventId}/resolve`);
            
            // Update the event in local state
            setSecurityEvents(prev => prev.map(event => 
                event.id === eventId 
                    ? { ...event, resolved_at: new Date().toISOString() }
                    : event
            ));
            
            // Refresh metrics to update unresolved count
            const metricsRes = await axios.get('/admin/security/metrics');
            setMetrics(metricsRes.data.metrics);
            
        } catch (error) {
            handleError(error, 'Failed to resolve security event');
            throw error;
        }
    }, []);

    const getThreatLevel = useCallback(async () => {
        try {
            const response = await axios.get('/admin/security/threat-level');
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to get threat level');
            return { level: 'low', threats: [], metrics };
        }
    }, [metrics]);

    const exportSecurityReport = useCallback(async (startDate: string, endDate: string, format: 'json' | 'csv' = 'json') => {
        try {
            const response = await axios.post('/admin/security/export-report', {
                start_date: startDate,
                end_date: endDate,
                format
            });
            
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to export security report');
            throw error;
        }
    }, []);

    const getSuspiciousActivity = useCallback(async (params: any = {}) => {
        try {
            const response = await axios.get('/admin/security/suspicious-activity', { params });
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to load suspicious activity');
            return { data: [], meta: {} };
        }
    }, []);

    return {
        // State
        securityEvents,
        loginAttempts,
        blockedIPs,
        metrics,
        loading,
        error,
        
        // Actions
        refreshData,
        loadSecurityEvents,
        loadLoginAttempts,
        loadAuditLogs,
        blockIP,
        unblockIP,
        resolveEvent,
        getThreatLevel,
        exportSecurityReport,
        getSuspiciousActivity,
        
        // Setters for external updates
        setSecurityEvents,
        setLoginAttempts,
        setBlockedIPs,
        setMetrics
    };
};