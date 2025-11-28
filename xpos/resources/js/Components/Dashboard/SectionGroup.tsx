import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

interface SectionGroupProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: 'default' | 'highlight';
}

/**
 * Section Group Component
 * Groups related KPI cards with a visual container and header
 * Creates visual hierarchy and organization on the dashboard
 */
export function SectionGroup({
    title,
    description,
    icon,
    children,
    variant = 'default',
}: SectionGroupProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className={`
            ${variant === 'highlight'
                ? 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200'
                : 'bg-white border border-gray-200'
            }
            rounded-xl shadow-sm p-4 sm:p-5
        `}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    {/* Optional icon */}
                    {icon && (
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg text-white shadow-sm">
                            <div className="w-5 h-5">
                                {icon}
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {title}
                        </h2>
                        {description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Info tooltip */}
                {description && (
                    <div className="relative">
                        <InformationCircleIcon
                            className="h-5 w-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        />
                        {showTooltip && (
                            <div className="absolute z-50 right-0 top-6 w-64 p-3 bg-white text-gray-700 text-sm rounded-xl shadow-xl border border-gray-200 animate-fadeIn">
                                <div className="absolute -top-2 right-2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                                {description}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cards Grid - Tight spacing for compact layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
                {children}
            </div>
        </div>
    );
}

/**
 * Compact Section Header
 * Lightweight header without the full section container
 */
export function CompactSectionHeader({
    title,
    subtitle,
    action,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div>
                <h2 className="text-lg font-bold text-gray-900">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
}
