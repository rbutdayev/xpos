import React from 'react';
import { Link } from '@inertiajs/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ColorVariant, COLORS } from '@/config/colors';

export interface QuickActionButtonProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    variant?: ColorVariant;
}

/**
 * Quick Action Button Component - Minimal Clean Design
 *
 * Used for primary dashboard actions like "New Sale", "New Service", etc.
 * Clean white design with subtle colored icon accents.
 */
export function QuickActionButton({
    href,
    icon,
    title,
    description,
    variant = 'primary',
}: QuickActionButtonProps) {
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
        <Link
            href={href}
            className="group bg-white hover:bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-200"
        >
            <div className="flex items-center gap-2.5">
                {/* Icon container */}
                <div className={`${iconBgColor} bg-opacity-10 p-2 rounded-lg flex-shrink-0`}>
                    <div className={`w-5 h-5 ${colorConfig.text}`}>
                        {icon}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                        {title}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}

/**
 * Quick Action Grid
 * Container for organizing quick action buttons
 */
export function QuickActionGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {children}
        </div>
    );
}
