/**
 * Mock Data for Account Owner / Admin Dashboard
 *
 * This file contains realistic mock data based on the specification
 * in DASHBOARD_SPECIFICATION.md for testing and design purposes.
 *
 * NO SQL - Pure frontend mockup data for design and layout testing
 */

export interface FinancialMetrics {
    revenue: {
        value: number;
        growth: number;
        currency: string;
    };
    expenses: {
        value: number;
        growth: number;
    };
    profit: {
        value: number;
        growth: number;
        margin: number;
    };
    pendingPayments: {
        value: number;
        count: number;
    };
}

export interface OperationalMetrics {
    activeCustomers: number;
    newCustomers: number;
    productsCount: number;
    productsInStock: number;
    stockValue: {
        cost: number;
        sale: number;
        potentialProfit: number;
    };
    stockTurnover: number;
}

export interface ServiceMetrics {
    pending: number;
    inProgress: number;
    completedThisMonth: number;
    completedGrowth: number;
    revenue: number;
    revenueGrowth: number;
}

export interface RentalMetrics {
    active: number;
    monthlyRevenue: number;
    pendingReturns: number;
    overdue: number;
}

export interface InventoryAlerts {
    lowStock: number;
    outOfStock: number;
    negativeStock: number;
    pendingGoodsReceipts: number;
    overdue?: number;
}

export interface StockByUnit {
    unit: string;
    quantity: number;
    skuCount: number;
    value: number;
}

export interface CreditStatistics {
    totalOutstanding: number;
    creditsGivenThisMonth: number;
    paymentsReceivedThisMonth: number;
    activeCreditCustomers: number;
}

export interface SalesTrendData {
    date: string;
    revenue: number;
    salesCount: number;
}

export interface PaymentMethodsData {
    labels: string[];
    values: number[];
}

export interface TopProduct {
    id: number;
    name: string;
    category: string;
    soldQuantity: number;
    unit: string;
    revenue: number;
}

export interface RecentSale {
    id: number;
    customer: string;
    date: string;
    time: string;
    items: number;
    amount: number;
    status: string;
}

export interface LowStockProduct {
    id: number;
    name: string;
    warehouse: string;
    current: number;
    min: number;
    unit: string;
}

export interface ExpenseBreakdown {
    category: string;
    amount: number;
    percentage: number;
}

/**
 * Account Owner Dashboard Mock Data
 */
export const accountOwnerDashboardMock = {
    // Account and User Info
    user: {
        id: 1,
        name: 'Rüslan Məmmədov',
        role: 'account_owner',
    },

    account: {
        name: 'xPOS Demo Mağaza',
        modules: {
            servicesEnabled: true,
            rentalsEnabled: true,
            shopEnabled: true,
            loyaltyEnabled: true,
            discountsEnabled: true,
        },
    },

    // Financial Metrics
    financial: {
        revenue: {
            value: 45230,
            growth: 12.5,
            currency: 'AZN',
        },
        expenses: {
            value: 12450,
            growth: 5.2,
        },
        profit: {
            value: 32780,
            growth: 18.3,
            margin: 72.5,
        },
        pendingPayments: {
            value: 8500,
            count: 15,
        },
    } as FinancialMetrics,

    // Operational Metrics
    operational: {
        activeCustomers: 1247,
        newCustomers: 23,
        productsCount: 3450,
        productsInStock: 3431,
        stockValue: {
            cost: 98500,
            sale: 125300,
            potentialProfit: 26800,
        },
        stockTurnover: 4.2,
    } as OperationalMetrics,

    // Service Metrics (conditional - if services_module_enabled)
    services: {
        pending: 18,
        inProgress: 12,
        completedThisMonth: 145,
        completedGrowth: 15,
        revenue: 8450,
        revenueGrowth: 8.5,
    } as ServiceMetrics,

    // Rental Metrics (conditional - if rent_module_enabled)
    rentals: {
        active: 45,
        monthlyRevenue: 3200,
        pendingReturns: 7,
        overdue: 3,
    } as RentalMetrics,

    // Inventory Alerts
    alerts: {
        lowStock: 12,
        outOfStock: 5,
        negativeStock: 2,
        pendingGoodsReceipts: 8,
    } as InventoryAlerts,

    // Online Orders (conditional - if shop_enabled)
    onlineOrders: {
        pending: 5,
    },

    // Stock by Unit
    stockByUnit: [
        { unit: 'Ədəd', quantity: 1245, skuCount: 520, value: 45200 },
        { unit: 'Metr', quantity: 850.5, skuCount: 85, value: 12300 },
        { unit: 'Kq', quantity: 420.75, skuCount: 45, value: 8500 },
        { unit: 'Litr', quantity: 150, skuCount: 20, value: 2100 },
        { unit: 'Qutu', quantity: 340, skuCount: 68, value: 15200 },
        { unit: 'Dəst', quantity: 89, skuCount: 15, value: 4800 },
    ] as StockByUnit[],

    // Credit Statistics
    credits: {
        totalOutstanding: 15400,
        creditsGivenThisMonth: 8200,
        paymentsReceivedThisMonth: 6500,
        activeCreditCustomers: 45,
    } as CreditStatistics,

    // Sales Trend Chart Data (Last 10 days)
    salesTrend: [
        { date: '2025-11-20', revenue: 3800, salesCount: 42 },
        { date: '2025-11-21', revenue: 4200, salesCount: 48 },
        { date: '2025-11-22', revenue: 3950, salesCount: 45 },
        { date: '2025-11-23', revenue: 4500, salesCount: 52 },
        { date: '2025-11-24', revenue: 3600, salesCount: 38 },
        { date: '2025-11-25', revenue: 5100, salesCount: 58 },
        { date: '2025-11-26', revenue: 4800, salesCount: 55 },
        { date: '2025-11-27', revenue: 5500, salesCount: 62 },
        { date: '2025-11-28', revenue: 4900, salesCount: 56 },
        { date: '2025-11-29', revenue: 5230, salesCount: 59 },
    ] as SalesTrendData[],

    // Payment Methods Distribution
    paymentMethods: {
        labels: ['Nağd', 'Kart', 'Köçürmə'],
        values: [20350, 15830, 9050], // AZN amounts
    } as PaymentMethodsData,

    // Top 5 Products by Revenue
    topProducts: [
        {
            id: 1,
            name: 'iPhone 15 Pro',
            category: 'Elektronika',
            soldQuantity: 28,
            unit: 'ədəd',
            revenue: 45200,
        },
        {
            id: 2,
            name: 'Samsung Galaxy S24',
            category: 'Elektronika',
            soldQuantity: 35,
            unit: 'ədəd',
            revenue: 38500,
        },
        {
            id: 3,
            name: 'Parça - Tüll',
            category: 'Toxuculuq',
            soldQuantity: 245.5,
            unit: 'metr',
            revenue: 12250,
        },
        {
            id: 4,
            name: 'Ayaqqabı - Nike Air',
            category: 'Geyim',
            soldQuantity: 42,
            unit: 'ədəd',
            revenue: 8400,
        },
        {
            id: 5,
            name: 'Laptop - MacBook Air',
            category: 'Elektronika',
            soldQuantity: 12,
            unit: 'ədəd',
            revenue: 28800,
        },
    ] as TopProduct[],

    // Expense Breakdown by Category
    expenseBreakdown: [
        { category: 'Əməliyyat xərcləri', amount: 5200, percentage: 41.8 },
        { category: 'Əmək haqqı', amount: 4500, percentage: 36.1 },
        { category: 'Tədarükçü ödənişləri', amount: 2100, percentage: 16.9 },
        { category: 'Digər xərclər', amount: 650, percentage: 5.2 },
    ] as ExpenseBreakdown[],

    // Recent Sales (Last 10)
    recentSales: [
        {
            id: 1,
            customer: 'Əli Məmmədov',
            date: '2025-11-29',
            time: '10:30',
            items: 5,
            amount: 245.50,
            status: 'Ödənilib',
        },
        {
            id: 2,
            customer: 'Sara Kərimova',
            date: '2025-11-29',
            time: '10:15',
            items: 2,
            amount: 89.00,
            status: 'Ödənilib',
        },
        {
            id: 3,
            customer: 'Kamran Həsənov',
            date: '2025-11-29',
            time: '09:45',
            items: 8,
            amount: 425.75,
            status: 'Ödənilib',
        },
        {
            id: 4,
            customer: 'Anonim',
            date: '2025-11-29',
            time: '09:20',
            items: 3,
            amount: 156.00,
            status: 'Ödənilib',
        },
        {
            id: 5,
            customer: 'Leyla İbrahimova',
            date: '2025-11-28',
            time: '18:50',
            items: 12,
            amount: 680.25,
            status: 'Ödənilib',
        },
        {
            id: 6,
            customer: 'Rəşad Quliyev',
            date: '2025-11-28',
            time: '17:30',
            items: 4,
            amount: 320.00,
            status: 'Borclu',
        },
        {
            id: 7,
            customer: 'Nigar Əliyeva',
            date: '2025-11-28',
            time: '16:15',
            items: 7,
            amount: 495.50,
            status: 'Ödənilib',
        },
        {
            id: 8,
            customer: 'Anonim',
            date: '2025-11-28',
            time: '15:40',
            items: 1,
            amount: 45.00,
            status: 'Ödənilib',
        },
        {
            id: 9,
            customer: 'Tural Məmmədov',
            date: '2025-11-28',
            time: '14:25',
            items: 6,
            amount: 380.00,
            status: 'Ödənilib',
        },
        {
            id: 10,
            customer: 'Səbinə Həmidova',
            date: '2025-11-28',
            time: '13:10',
            items: 9,
            amount: 550.75,
            status: 'Ödənilib',
        },
    ] as RecentSale[],

    // Low Stock Products (Top 10 Urgent)
    lowStockProducts: [
        {
            id: 1,
            name: 'iPhone 15 Pro - 256GB',
            warehouse: 'Əsas Anbar',
            current: 5,
            min: 20,
            unit: 'ədəd',
        },
        {
            id: 2,
            name: 'Samsung Charger - Type-C',
            warehouse: 'Filial 2',
            current: 2,
            min: 10,
            unit: 'ədəd',
        },
        {
            id: 3,
            name: 'Parça - Atlaz Qırmızı',
            warehouse: 'Əsas Anbar',
            current: 15.5,
            min: 50,
            unit: 'metr',
        },
        {
            id: 4,
            name: 'Ayaqqabı - Adidas 42',
            warehouse: 'Filial 1',
            current: 3,
            min: 12,
            unit: 'ədəd',
        },
        {
            id: 5,
            name: 'Laptop Çantası',
            warehouse: 'Əsas Anbar',
            current: 8,
            min: 25,
            unit: 'ədəd',
        },
        {
            id: 6,
            name: 'Mouse - Logitech',
            warehouse: 'Filial 2',
            current: 4,
            min: 15,
            unit: 'ədəd',
        },
        {
            id: 7,
            name: 'Keyboard - Mechanical',
            warehouse: 'Əsas Anbar',
            current: 6,
            min: 20,
            unit: 'ədəd',
        },
        {
            id: 8,
            name: 'HDMI Kabel - 2m',
            warehouse: 'Filial 1',
            current: 10,
            min: 30,
            unit: 'ədəd',
        },
        {
            id: 9,
            name: 'Yağ - Zəytin',
            warehouse: 'Əsas Anbar',
            current: 12.5,
            min: 40,
            unit: 'litr',
        },
        {
            id: 10,
            name: 'Şəkər - Ağ',
            warehouse: 'Filial 2',
            current: 85,
            min: 200,
            unit: 'kq',
        },
    ] as LowStockProduct[],
};

/**
 * Helper function to format currency
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', {
        style: 'currency',
        currency: 'AZN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Helper function to format number
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('az-AZ', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

/**
 * Helper function to format date
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('az-AZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
};
