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
                    <TrendBadge value={trend.value} isPositive={trend.isPositive} />
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
function TrendBadge({ value, isPositive }: TrendData) {
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

/**
 * Compact KPI Card Component - Modern Professional Design
 *
 * Features:
 * - Compact size with proper text proportions
 * - Corner gradient accent on hover
 * - Consistent bottom line design
 * - Tight spacing optimized for 6+ cards per row
 */
export function CompactKPICard({
    title,
    value,
    subtitle,
    trend,
    variant = 'primary',
    icon,
}: KPICardProps) {
    const colorConfig = COLORS[variant];

    // Color mappings for icon backgrounds
    const iconColorMap: Record<ColorVariant, string> = {
        primary: 'bg-blue-500',
        success: 'bg-green-500',
        danger: 'bg-red-500',
        warning: 'bg-yellow-500',
    };

    const iconBgColor = iconColorMap[variant];

    return (
        <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 p-4 transition-all duration-200 overflow-hidden flex flex-col h-[195px]">
            {/* Corner gradient accent - top right */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${colorConfig.gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-200 rounded-bl-xl`}></div>

            {/* Top section - Icon and Trend */}
            <div className="flex items-start justify-between mb-3">
                {/* Icon */}
                {icon && (
                    <div className={`${iconBgColor} bg-opacity-10 p-2.5 rounded-lg flex-shrink-0`}>
                        <div className={`w-5 h-5 ${colorConfig.text}`}>
                            {icon}
                        </div>
                    </div>
                )}

                {/* Trend badge */}
                {trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                        trend.isPositive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}>
                        {trend.isPositive ? (
                            <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                            <ArrowDownIcon className="h-3 w-3" />
                        )}
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>

            {/* Middle section - Value and Title */}
            <div className="flex-1 flex flex-col justify-center mb-3 min-h-0">
                <p className="text-xl font-bold text-gray-900 leading-tight mb-2 truncate">
                    {value}
                </p>
                <h3 className="text-sm font-semibold text-gray-700 leading-snug line-clamp-2">
                    {title}
                </h3>
            </div>

            {/* Bottom section - Subtitle (always shown with border) */}
            <div className="pt-2 border-t border-gray-100 mt-auto">
                <p className="text-xs text-gray-500 truncate">
                    {subtitle || '\u00A0'}
                </p>
            </div>
        </div>
    );
}
