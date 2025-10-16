import { useMemo, memo } from 'react';
import { formatCurrency, formatShortDate } from '../Utils/dashboardCalculations';
import { calculateChartMaxValue } from '../Utils/widgetHelpers';

interface SalesData {
    date: string;
    sales: number;
    revenue: number;
}

interface SalesChartProps {
    data: SalesData[];
    period: '1day' | '7days' | '30days' | '90days';
}

const SalesChart = memo(function SalesChart({ data, period }: SalesChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        return data.map(item => ({
            ...item,
            formattedDate: formatShortDate(item.date)
        }));
    }, [data]);

    const maxRevenue = useMemo(() => calculateChartMaxValue(chartData, 'revenue'), [chartData]);
    const maxSales = useMemo(() => calculateChartMaxValue(chartData, 'sales'), [chartData]);

    const getPeriodLabel = () => {
        switch (period) {
            case '1day': return 'Bugün (saatlıq)';
            case '7days': return 'Son 7 gün';
            case '30days': return 'Son 30 gün';
            case '90days': return 'Son 90 gün';
            default: return 'Satışlar';
        }
    };

    if (!chartData.length) {
        return (
            <div className="-m-6 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Satış Trendi</h3>
                    <span className="text-sm text-gray-500">{getPeriodLabel()}</span>
                </div>
                <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 mt-2">Məlumat tapılmadı</p>
                </div>
            </div>
        );
    }

    return (
        <div className="-m-6 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Satış Trendi</h3>
                <span className="text-sm text-gray-500">{getPeriodLabel()}</span>
            </div>

            {/* SVG Line Chart */}
            <div className="h-48 w-full">
                <svg className="w-full h-full" viewBox="0 0 400 180">
                    {/* Background Grid Lines */}
                    <defs>
                        <pattern id="grid" width="40" height="36" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 36" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Chart Area */}
                    <g transform="translate(40, 20)">
                        {/* Y-axis labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                            <g key={index}>
                                <line 
                                    x1="0" 
                                    y1={140 - (ratio * 140)} 
                                    x2="320" 
                                    y2={140 - (ratio * 140)} 
                                    stroke="#e5e7eb" 
                                    strokeWidth="0.5"
                                />
                                <text 
                                    x="-5" 
                                    y={140 - (ratio * 140)} 
                                    className="text-xs fill-gray-500" 
                                    textAnchor="end" 
                                    dy="3"
                                >
                                    {formatCurrency(maxRevenue * ratio)}
                                </text>
                            </g>
                        ))}
                        
                        {/* Line Chart */}
                        {chartData.length > 1 && (
                            <polyline
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={chartData.map((item, index) => {
                                    const x = (index / (chartData.length - 1)) * 320;
                                    const y = 140 - ((item.revenue / maxRevenue) * 140);
                                    return `${x},${y}`;
                                }).join(' ')}
                            />
                        )}
                        
                        {/* Data Points */}
                        {chartData.map((item, index) => {
                            const x = (index / Math.max(chartData.length - 1, 1)) * 320;
                            const y = 140 - ((item.revenue / maxRevenue) * 140);
                            return (
                                <g key={index}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="3"
                                        fill="#3b82f6"
                                        className="hover:r-4 transition-all cursor-pointer"
                                    />
                                    {/* Tooltip on hover - simplified */}
                                    <title>
                                        {item.formattedDate}: {formatCurrency(item.revenue)} ({item.sales} satış)
                                    </title>
                                </g>
                            );
                        })}
                        
                        {/* X-axis labels */}
                        {chartData.map((item, index) => {
                            if (index % Math.ceil(chartData.length / 6) === 0) {
                                const x = (index / Math.max(chartData.length - 1, 1)) * 320;
                                return (
                                    <text
                                        key={index}
                                        x={x}
                                        y={155}
                                        className="text-xs fill-gray-500"
                                        textAnchor="middle"
                                    >
                                        {item.formattedDate}
                                    </text>
                                );
                            }
                            return null;
                        })}
                    </g>
                </svg>
            </div>
            
            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-sm text-gray-500">Ümumi Satış</div>
                    <div className="text-lg font-semibold text-gray-900">
                        {chartData.reduce((sum, item) => sum + item.sales, 0)}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Ümumi Gəlir</div>
                    <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(chartData.reduce((sum, item) => sum + item.revenue, 0))}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Orta Gəlir</div>
                    <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(chartData.reduce((sum, item) => sum + item.revenue, 0) / Math.max(chartData.length, 1))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                    <span>Gəlir</span>
                </div>
                <div className="flex items-center">
                    <span className="mr-2">#</span>
                    <span>Satış sayı</span>
                </div>
            </div>
        </div>
    );
});

export default SalesChart;