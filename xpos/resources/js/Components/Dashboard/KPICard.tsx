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
 * Modern KPI Card Component - Simplified Design
 *
 * Reduced from 8 color variants to 4 semantic variants:
 * - primary: Default state, main metrics
 * - success: Positive metrics (revenue, profit)
 * - danger: Critical alerts (errors, out of stock)
 * - warning: Attention needed (low stock, expenses)
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

    // Build gradient class
    const gradientClass = `bg-gradient-to-br ${colorConfig.gradient}`;

    return (
        <div className={`${gradientClass} text-white rounded-xl shadow-lg p-4 sm:p-6 relative overflow-hidden`}>
            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-16 sm:w-20 h-16 sm:h-20 bg-white/10 rounded-full"></div>

            <div className="relative z-10">
                {/* Header with icon and trend */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    {icon && (
                        <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
                            {icon}
                        </div>
                    )}
                    {trend && (
                        <TrendBadge value={trend.value} isPositive={trend.isPositive} />
                    )}
                </div>

                {/* Content */}
                <div>
                    <p className="text-xs sm:text-sm font-medium text-white/80 truncate">
                        {title}
                    </p>
                    <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold truncate">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-xs sm:text-sm text-white/70 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Trend Badge Component
 * Shows percentage change with up/down arrow
 */
function TrendBadge({ value, isPositive }: TrendData) {
    return (
        <div className="flex items-center space-x-1 text-xs sm:text-sm font-medium text-white">
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
