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
 * Quick Action Button Component
 *
 * Used for primary dashboard actions like "New Sale", "New Service", etc.
 * Now uses semantic color variants instead of arbitrary colors.
 */
export function QuickActionButton({
    href,
    icon,
    title,
    description,
    variant = 'primary',
}: QuickActionButtonProps) {
    const colorConfig = COLORS[variant];

    // Build color classes based on variant
    const bgClass = colorConfig.solid;
    const hoverClass = colorConfig.hover;
    const ringClass = colorConfig.ring;

    return (
        <Link
            href={href}
            className={`${bgClass} ${hoverClass} text-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:${ringClass}`}
        >
            <div className="flex items-start space-x-3 sm:space-x-4">
                {/* Icon container */}
                <div className="flex-shrink-0">
                    <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
                        {icon}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-lg sm:text-xl font-semibold truncate">
                        {title}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-white/80 line-clamp-2">
                        {description}
                    </p>
                </div>

                {/* Plus icon (desktop only) */}
                <div className="flex-shrink-0 hidden sm:block">
                    <PlusIcon className="h-6 w-6" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {children}
        </div>
    );
}
