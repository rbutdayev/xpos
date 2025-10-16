import { useState, useCallback } from 'react';

export const useWidgetRefresh = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Record<string, number>>({});

    const refreshWidget = useCallback(async (widgetName: string, refreshFn: () => Promise<void>) => {
        if (isRefreshing) return;
        
        setIsRefreshing(true);
        try {
            await refreshFn();
            setLastRefreshed(prev => ({ ...prev, [widgetName]: Date.now() }));
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    const getLastRefreshed = useCallback((widgetName: string) => {
        return lastRefreshed[widgetName];
    }, [lastRefreshed]);

    const formatLastRefreshed = useCallback((widgetName: string) => {
        const timestamp = lastRefreshed[widgetName];
        if (!timestamp) return null;
        
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s əvvəl`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m əvvəl`;
        
        const hours = Math.floor(minutes / 60);
        return `${hours}h əvvəl`;
    }, [lastRefreshed]);

    return {
        isRefreshing,
        refreshWidget,
        getLastRefreshed,
        formatLastRefreshed
    };
};