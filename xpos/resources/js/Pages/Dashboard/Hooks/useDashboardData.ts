import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import dashboardCache from '../Utils/cache';

interface DashboardData {
    kpis: any;
    sales: any[];
    products: any[];
    recent: any[];
    lowStock: any[];
    financial: any;
}

interface LoadingState {
    kpis: boolean;
    sales: boolean;
    products: boolean;
    recent: boolean;
    lowStock: boolean;
    financial: boolean;
}

export const useDashboardData = (initialData: any) => {
    const [widgets, setWidgets] = useState<DashboardData>({
        kpis: initialData.stats || {},
        sales: initialData.sales_chart_data || [],
        products: initialData.top_products || [],
        recent: initialData.recent_sales || [],
        lowStock: initialData.low_stock_products || [],
        financial: initialData.financial_data || {}
    });

    const [loading, setLoading] = useState<LoadingState>({
        kpis: false,
        sales: false,
        products: false,
        recent: false,
        lowStock: false,
        financial: false
    });

    const [errors, setErrors] = useState<Partial<Record<keyof DashboardData, string>>>({});
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    const refreshWidget = useCallback(async (widgetName: keyof DashboardData, silent = false, force = false) => {
        const cacheKey = dashboardCache.generateKey(`dashboard_${widgetName}`);
        
        // Check cache first unless forced refresh
        if (!force && dashboardCache.has(cacheKey)) {
            const cachedData = dashboardCache.get(cacheKey);
            if (cachedData) {
                setWidgets(prev => ({ ...prev, [widgetName]: cachedData }));
                setErrors(prev => ({ ...prev, [widgetName]: undefined }));
                return;
            }
        }

        if (!silent) {
            setLoading(prev => ({ ...prev, [widgetName]: true }));
        }
        
        try {
            // For now, we'll use Inertia.js visit to refresh data
            // In a real implementation, you'd make individual API calls
            const response = await fetch(`/api/dashboard/${widgetName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Cache the data with appropriate TTL
                const ttl = getWidgetCacheTTL(widgetName);
                dashboardCache.set(cacheKey, data, ttl);
                
                setWidgets(prev => ({ ...prev, [widgetName]: data }));
                setErrors(prev => ({ ...prev, [widgetName]: undefined }));
            }
        } catch (error) {
            console.error(`Failed to refresh ${widgetName}:`, error);
            setErrors(prev => ({ 
                ...prev, 
                [widgetName]: `Widget yüklənmədi: ${error instanceof Error ? error.message : 'Naməlum xəta'}` 
            }));
        } finally {
            setLoading(prev => ({ ...prev, [widgetName]: false }));
        }
    }, []);

    const getWidgetCacheTTL = useCallback((widgetName: keyof DashboardData): number => {
        const ttlMap = {
            kpis: 2 * 60 * 1000,      // 2 minutes
            recent: 1 * 60 * 1000,    // 1 minute
            lowStock: 5 * 60 * 1000,  // 5 minutes  
            financial: 10 * 60 * 1000, // 10 minutes
            sales: 10 * 60 * 1000,     // 10 minutes
            products: 15 * 60 * 1000   // 15 minutes
        };
        return ttlMap[widgetName] || 5 * 60 * 1000;
    }, []);

    const refreshAll = useCallback(() => {
        // Clear cache for all widgets
        dashboardCache.clear();
        
        router.reload({ only: ['stats', 'sales_chart_data', 'top_products', 'recent_sales', 'low_stock_products', 'financial_data'] });
        setLastRefresh(Date.now());
    }, []);

    const invalidateCache = useCallback((widgetName?: keyof DashboardData) => {
        if (widgetName) {
            const cacheKey = dashboardCache.generateKey(`dashboard_${widgetName}`);
            dashboardCache.delete(cacheKey);
        } else {
            dashboardCache.clear();
        }
    }, []);

    // Auto-refresh critical widgets every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            refreshWidget('kpis', true);
            refreshWidget('recent', true);
            refreshWidget('lowStock', true);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [refreshWidget]);

    // Auto-refresh less critical widgets every 15 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            refreshWidget('products', true);
            refreshWidget('sales', true);
            refreshWidget('financial', true);
        }, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, [refreshWidget]);

    return { 
        widgets, 
        loading, 
        errors,
        refreshWidget, 
        refreshAll,
        invalidateCache,
        lastRefresh 
    };
};