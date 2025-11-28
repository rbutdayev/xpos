import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import { ColorVariant, COLORS } from '@/config/colors';

export interface TrendData {
    value: number;
    isPositive: boolean;
}

export interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: TrendData;
    variant?: ColorVariant;
    icon?: React.ReactNode;
}

/**
 * Modern KPI Card Component - Clean Minimal Design
 *
 * White card with colored icon only:
 * - primary: Default state, main metrics (blue icon)
 * - success: Positive metrics (green icon)
 * - danger: Critical alerts (red icon)
 * - warning: Attention needed (yellow icon)
 */
export function KPICard({
    title,
    value,
    subtitle,
    trend,
    variant = 'primary',
    icon,
}: KPICardProps) {
    const colorConfig = COLORS[variant];

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-4 sm:p-6 transition-shadow duration-200">
            {/* Header with colored icon and trend */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                {icon && (
                    <div className={`${colorConfig.text} p-2 sm:p-3 ${colorConfig.light} rounded-lg`}>
                        {icon}
                    </div>
                )}
                {trend && (
                    <TrendBadge value={trend.value} isPositive={trend.isPositive} variant={variant} />
                )}
            </div>

            {/* Content */}
            <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {title}
                </p>
                <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Trend Badge Component
 * Shows percentage change with up/down arrow (colored based on direction)
 */
function TrendBadge({ value, isPositive, variant }: TrendData & { variant?: ColorVariant }) {
    const trendColor = isPositive ? 'text-green-600' : 'text-red-600';

    return (
        <div className={`flex items-center space-x-1 text-xs sm:text-sm font-medium ${trendColor}`}>
            {isPositive ? (
                <ArrowUpIcon className="h-3 sm:h-4 w-3 sm:w-4" />
            ) : (
                <ArrowDownIcon className="h-3 sm:h-4 w-3 sm:w-4" />
            )}
            <span>{Math.abs(value)}%</span>
        </div>
    );
}

/**
 * Lightweight KPI Card Variant
 * Simplified version without gradients for less visual weight
 */
export function LightKPICard({
    title,
    value,
    subtitle,
    variant = 'primary',
    icon,
}: Omit<KPICardProps, 'trend'>) {
    const colorConfig = COLORS[variant];

    return (
        <div className={`${colorConfig.light} border ${colorConfig.border} rounded-lg p-4 sm:p-6`}>
            <div className="flex items-center justify-between mb-3">
                {icon && (
                    <div className={`${colorConfig.solid} bg-opacity-10 p-3 rounded-lg`}>
                        {icon}
                    </div>
                )}
            </div>

            <div>
                <p className={`text-xs sm:text-sm font-medium ${COLORS.neutral.textMuted} mb-1`}>
                    {title}
                </p>
                <p className={`text-2xl sm:text-3xl font-bold ${COLORS.neutral.textDark}`}>
                    {value}
                </p>
                {subtitle && (
                    <p className={`text-xs sm:text-sm ${COLORS.neutral.textMuted} mt-1`}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
