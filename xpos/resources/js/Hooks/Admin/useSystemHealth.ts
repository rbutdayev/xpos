import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface SystemMetrics {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    database_connections: number;
    active_sessions: number;
    queue_status: QueueStatus[];
    error_rate: number;
    response_time: number;
    cache_status: CacheStatus;
    storage_health: StorageHealth;
}

interface QueueStatus {
    name: string;
    pending: number;
    failed: number;
    status: 'healthy' | 'warning' | 'unknown';
}

interface CacheStatus {
    status: string;
    hit_rate: number;
    memory_usage: number;
    error?: string;
}

interface StorageHealth {
    local: {
        status: string;
        free_space?: number;
        total_space?: number;
        error?: string;
    };
    azure?: {
        status: string;
        configured: boolean;
    };
}

interface AccountUsage {
    id: number;
    name: string;
    plan: string;
    status: 'active' | 'suspended';
    total_users: number;
    active_users: number;
    last_activity: string | null;
    created_at: string;
}

interface PerformanceMetric {
    timestamp: string;
    response_time: number;
    error_rate: number;
    requests: number;
    cpu_usage: number;
    memory_usage: number;
}

interface OverallHealth {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    last_check: string;
}

interface SystemHealthData {
    system: SystemMetrics;
    accounts: AccountUsage[];
    performance: PerformanceMetric[];
    overall: OverallHealth;
}

interface UseSystemHealthOptions {
    refreshInterval?: number;
    autoRefresh?: boolean;
    onError?: (error: Error) => void;
    onStatusChange?: (status: OverallHealth['status']) => void;
}

interface UseSystemHealthReturn {
    data: SystemHealthData | null;
    metrics: SystemMetrics | null;
    accounts: AccountUsage[];
    performance: PerformanceMetric[];
    overallHealth: OverallHealth | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    refresh: () => Promise<void>;
    refreshMetrics: () => Promise<void>;
    refreshAccounts: () => Promise<void>;
    refreshPerformance: (hours?: number) => Promise<void>;
    isRefreshing: boolean;
}

export const useSystemHealth = (options: UseSystemHealthOptions = {}): UseSystemHealthReturn => {
    const {
        refreshInterval = 30000,
        autoRefresh = true,
        onError,
        onStatusChange
    } = options;

    const [data, setData] = useState<SystemHealthData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousStatus = useRef<OverallHealth['status'] | null>(null);
    const onErrorRef = useRef(onError);
    const onStatusChangeRef = useRef(onStatusChange);

    // Update refs when callbacks change
    useEffect(() => {
        onErrorRef.current = onError;
        onStatusChangeRef.current = onStatusChange;
    });

    const handleError = useCallback((err: any, context: string) => {
        const errorMessage = err.response?.data?.message || err.message || `Error in ${context}`;
        console.error(`System Health ${context}:`, err);
        setError(errorMessage);
        onErrorRef.current?.(new Error(errorMessage));
    }, []);

    const fetchMetrics = useCallback(async (): Promise<SystemMetrics | null> => {
        try {
            const response = await axios.get('/admin/api/system-health/metrics');
            if (response.data.success) {
                return response.data.data.system;
            }
            throw new Error(response.data.error || 'Failed to fetch metrics');
        } catch (err) {
            handleError(err, 'metrics fetch');
            return null;
        }
    }, [handleError]);

    const fetchAccounts = useCallback(async (): Promise<AccountUsage[]> => {
        try {
            const response = await axios.get('/admin/api/system-health/account-usage');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.error || 'Failed to fetch account usage');
        } catch (err) {
            handleError(err, 'account usage fetch');
            return [];
        }
    }, [handleError]);

    const fetchPerformance = useCallback(async (hours: number = 24): Promise<PerformanceMetric[]> => {
        try {
            const response = await axios.get('/admin/api/system-health/performance', {
                params: { hours }
            });
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.error || 'Failed to fetch performance data');
        } catch (err) {
            handleError(err, 'performance data fetch');
            return [];
        }
    }, [handleError]);

    const fetchOverallHealth = useCallback(async (): Promise<OverallHealth | null> => {
        try {
            const response = await axios.get('/admin/api/system-health/health-check');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.error || 'Failed to fetch health status');
        } catch (err) {
            handleError(err, 'health check');
            return null;
        }
    }, [handleError]);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        
        try {
            const [metricsData, accountsData, performanceData, healthData] = await Promise.all([
                fetchMetrics(),
                fetchAccounts(),
                fetchPerformance(),
                fetchOverallHealth()
            ]);

            if (metricsData && healthData) {
                const newData: SystemHealthData = {
                    system: metricsData,
                    accounts: accountsData,
                    performance: performanceData,
                    overall: healthData
                };

                setData(newData);
                setLastUpdated(new Date());

                // Check for status changes
                if (previousStatus.current !== healthData.status) {
                    onStatusChangeRef.current?.(healthData.status);
                    previousStatus.current = healthData.status;
                }
            }
        } catch (err) {
            handleError(err, 'full refresh');
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, [fetchMetrics, fetchAccounts, fetchPerformance, fetchOverallHealth]);

    const refreshMetrics = useCallback(async () => {
        if (!data || isRefreshing) return;
        
        try {
            const metricsData = await fetchMetrics();
            const healthData = await fetchOverallHealth();
            
            if (metricsData && healthData) {
                setData(prev => prev ? {
                    ...prev,
                    system: metricsData,
                    overall: healthData
                } : null);
                setLastUpdated(new Date());
            }
        } catch (err) {
            handleError(err, 'metrics refresh');
        }
    }, [data, isRefreshing, fetchMetrics, fetchOverallHealth, handleError]);

    const refreshAccounts = useCallback(async () => {
        if (!data) return;
        
        const accountsData = await fetchAccounts();
        setData(prev => prev ? {
            ...prev,
            accounts: accountsData
        } : null);
    }, [data, fetchAccounts]);

    const refreshPerformance = useCallback(async (hours: number = 24) => {
        if (!data) return;
        
        const performanceData = await fetchPerformance(hours);
        setData(prev => prev ? {
            ...prev,
            performance: performanceData
        } : null);
    }, [data, fetchPerformance]);

    // Initial load
    useEffect(() => {
        refresh();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto refresh
    useEffect(() => {
        if (!autoRefresh || refreshInterval <= 0) return;

        const interval = setInterval(async () => {
            // Only auto-refresh if we have initial data and not currently loading/refreshing
            if (!isLoading && !isRefreshing && data) {
                try {
                    const metricsData = await fetchMetrics();
                    const healthData = await fetchOverallHealth();
                    
                    if (metricsData && healthData) {
                        setData(prev => prev ? {
                            ...prev,
                            system: metricsData,
                            overall: healthData
                        } : null);
                        setLastUpdated(new Date());
                    }
                } catch (err) {
                    handleError(err, 'auto refresh');
                }
            }
        }, refreshInterval);

        intervalRef.current = interval;

        return () => {
            clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval, isLoading, isRefreshing, data, fetchMetrics, fetchOverallHealth, handleError]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        data,
        metrics: data?.system || null,
        accounts: data?.accounts || [],
        performance: data?.performance || [],
        overallHealth: data?.overall || null,
        isLoading,
        error,
        lastUpdated,
        refresh,
        refreshMetrics,
        refreshAccounts,
        refreshPerformance,
        isRefreshing
    };
};