// Dashboard calculation utilities

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        maximumFractionDigits: 0
    }).format(amount);
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
        month: 'short',
        day: 'numeric'
    });
};

export const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

export const calculateGrowthTrend = (data: Array<{ value: number }>, periods = 2) => {
    if (data.length < periods) return { trend: 0, isPositive: true };
    
    const recent = data.slice(-periods);
    const earlier = data.slice(-periods * 2, -periods);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, item) => sum + item.value, 0) / earlier.length;
    
    const trend = calculatePercentageChange(recentAvg, earlierAvg);
    
    return {
        trend: Math.abs(trend),
        isPositive: trend >= 0
    };
};

export const getStockLevelStatus = (current: number, minimum: number) => {
    // Handle edge cases first
    if (current <= 0) {
        return { 
            level: 'critical' as const, 
            color: 'bg-red-500', 
            textColor: 'text-red-800',
            bgColor: 'bg-red-100',
            label: 'Bitmiş' 
        };
    }
    
    // If minimum is 0 or negative, but we have stock, consider it sufficient
    if (minimum <= 0) {
        return { 
            level: 'ok' as const, 
            color: 'bg-green-400', 
            textColor: 'text-green-800',
            bgColor: 'bg-green-100',
            label: 'Kifayət' 
        };
    }
    
    const percentage = (current / minimum) * 100;
    
    if (percentage <= 50) {
        return { 
            level: 'low' as const, 
            color: 'bg-red-400', 
            textColor: 'text-red-700',
            bgColor: 'bg-red-100',
            label: 'Çox az' 
        };
    }
    if (percentage <= 100) {
        return { 
            level: 'warning' as const, 
            color: 'bg-yellow-400', 
            textColor: 'text-yellow-800',
            bgColor: 'bg-yellow-100',
            label: 'Az' 
        };
    }
    
    return { 
        level: 'ok' as const, 
        color: 'bg-green-400', 
        textColor: 'text-green-800',
        bgColor: 'bg-green-100',
        label: 'Kifayət' 
    };
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export const getStatusLabel = (status: string) => {
    switch (status) {
        case 'completed': return 'Tamamlandı';
        case 'pending': return 'Gözləyir';
        case 'cancelled': return 'Ləğv edildi';
        default: return status;
    }
};

export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const throttle = <T extends (...args: any[]) => void>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};