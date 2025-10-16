import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface FilterState {
    timeRange: string;
    warehouse?: { id: number; name: string } | null;
}

export const useDashboardFilters = (initialWarehouse?: any) => {
    const [filters, setFilters] = useState<FilterState>({
        timeRange: '7days',
        warehouse: initialWarehouse || null
    });

    const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        
        // Update URL and fetch new data
        const params = new URLSearchParams();
        params.set('timeRange', updatedFilters.timeRange);
        
        if (updatedFilters.warehouse) {
            params.set('warehouse', updatedFilters.warehouse.id.toString());
        }
        
        router.visit(window.location.pathname, {
            data: Object.fromEntries(params),
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'sales_chart_data', 'top_products', 'recent_sales', 'low_stock_products', 'financial_data']
        });
    }, [filters]);

    return {
        timeRange: filters.timeRange,
        warehouse: filters.warehouse,
        updateFilters
    };
};