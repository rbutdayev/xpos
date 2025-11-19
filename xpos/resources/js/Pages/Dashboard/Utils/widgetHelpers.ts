// Widget helper utilities
import { formatAzerbaijaniDate } from '@/utils/dateFormatters';

export const getKPIColorClasses = (color: string) => {
    const colorMap = {
        blue: 'bg-blue-500 text-blue-100',
        green: 'bg-green-500 text-green-100',
        yellow: 'bg-yellow-500 text-yellow-100',
        red: 'bg-red-500 text-red-100',
        purple: 'bg-purple-500 text-purple-100',
        indigo: 'bg-indigo-500 text-indigo-100',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
};

export const getTrendColorClasses = (isPositive: boolean) => ({
    positive: 'text-green-600',
    negative: 'text-red-600'
})[isPositive ? 'positive' : 'negative'];

export const getRankingColor = (index: number) => {
    const colors = [
        'bg-yellow-100 text-yellow-800', // 1st - Gold
        'bg-gray-100 text-gray-800',     // 2nd - Silver  
        'bg-orange-100 text-orange-800', // 3rd - Bronze
        'bg-blue-100 text-blue-800'      // 4th+ - Blue
    ];
    return colors[Math.min(index, colors.length - 1)];
};

export const calculateChartMaxValue = (data: Array<{ [key: string]: any }>, key: string) => {
    return Math.max(...data.map(item => typeof item[key] === 'number' ? item[key] : 0), 1);
};

export const calculateWidgetSpan = (widgetType: string, screenSize: 'sm' | 'md' | 'lg' = 'lg') => {
    const spanMap = {
        sm: {
            kpi: 'col-span-1',
            chart: 'col-span-1',
            list: 'col-span-1',
            financial: 'col-span-1'
        },
        md: {
            kpi: 'col-span-1',
            chart: 'col-span-2',
            list: 'col-span-1',
            financial: 'col-span-2'
        },
        lg: {
            kpi: 'col-span-1',
            chart: 'col-span-2',
            list: 'col-span-1',
            financial: 'col-span-2'
        }
    };
    
    return spanMap[screenSize][widgetType as keyof typeof spanMap.lg] || 'col-span-1';
};

export const getWidgetPriority = (widgetType: string): number => {
    const priorities = {
        kpi: 1,
        financial: 2,
        chart: 3,
        recent: 4,
        products: 5,
        lowStock: 6
    };
    return priorities[widgetType as keyof typeof priorities] || 999;
};

export const shouldShowWidget = (widgetType: string, userRole: string): boolean => {
    const salesmanWidgets = ['kpi', 'recent', 'lowStock'];
    const adminWidgets = ['kpi', 'financial', 'chart', 'recent', 'products', 'lowStock'];
    
    if (userRole === 'sales_staff') {
        return salesmanWidgets.includes(widgetType);
    }
    
    return adminWidgets.includes(widgetType);
};

export const getWidgetRefreshInterval = (widgetType: string): number => {
    // Return intervals in milliseconds
    const intervals = {
        kpi: 5 * 60 * 1000,      // 5 minutes
        recent: 2 * 60 * 1000,   // 2 minutes  
        lowStock: 10 * 60 * 1000, // 10 minutes
        financial: 15 * 60 * 1000, // 15 minutes
        chart: 15 * 60 * 1000,    // 15 minutes
        products: 30 * 60 * 1000  // 30 minutes
    };
    
    return intervals[widgetType as keyof typeof intervals] || 15 * 60 * 1000;
};

export const createWidgetErrorBoundary = (widgetName: string) => {
    return class extends Error {
        constructor(message: string, public widgetName: string) {
            super(message);
            this.name = 'WidgetError';
        }
    };
};

export const formatWidgetData = (data: any, widgetType: string) => {
    if (!data) return null;
    
    switch (widgetType) {
        case 'kpi':
            return {
                ...data,
                formatted_values: Object.keys(data).reduce((acc, key) => {
                    if (key.includes('value') || key.includes('amount') || key.includes('revenue')) {
                        acc[key] = typeof data[key] === 'number' ? data[key].toLocaleString() : data[key];
                    }
                    return acc;
                }, {} as Record<string, any>)
            };
            
        case 'chart':
            return data.map((item: any) => ({
                ...item,
                formattedDate: formatAzerbaijaniDate(item.date, 'short')
            }));
            
        default:
            return data;
    }
};