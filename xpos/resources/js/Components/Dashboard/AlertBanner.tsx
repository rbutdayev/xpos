import React from 'react';
import { Link } from '@inertiajs/react';
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

export type AlertType = 'info' | 'warning' | 'danger' | 'success';

export interface AlertBannerProps {
    type: AlertType;
    message: string;
    actionLabel?: string;
    actionHref?: string;
    icon?: React.ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
}

/**
 * Modern Alert Banner - Cuba Style
 * Clean white card with colored accent and icon
 */
export function AlertBanner({
    type,
    message,
    actionLabel,
    actionHref,
    icon,
    dismissible = false,
    onDismiss,
}: AlertBannerProps) {
    const alertStyles: Record<AlertType, {
        iconBg: string;
        iconColor: string;
        actionColor: string;
        icon: React.ReactNode;
    }> = {
        info: {
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            actionColor: 'text-blue-600 hover:text-blue-700',
            icon: <InformationCircleIcon className="h-5 w-5" />,
        },
        warning: {
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            actionColor: 'text-orange-600 hover:text-orange-700',
            icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        },
        danger: {
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            actionColor: 'text-red-600 hover:text-red-700',
            icon: <XCircleIcon className="h-5 w-5" />,
        },
        success: {
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            actionColor: 'text-green-600 hover:text-green-700',
            icon: <CheckCircleIcon className="h-5 w-5" />,
        },
    };

    const style = alertStyles[type];

    return (
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 ${style.iconBg} p-2.5 rounded-lg`}>
                <div className={style.iconColor}>
                    {icon || style.icon}
                </div>
            </div>

            {/* Message */}
            <p className="flex-1 text-sm font-medium text-gray-700">
                {message}
            </p>

            {/* Action Button */}
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className={`flex items-center gap-1 text-sm font-semibold ${style.actionColor} whitespace-nowrap transition-colors`}
                >
                    {actionLabel}
                    <ChevronRightIcon className="h-4 w-4" />
                </Link>
            )}

            {/* Dismiss Button */}
            {dismissible && onDismiss && (
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}

/**
 * Alert Banner Stack
 */
export function AlertBannerStack({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 gap-3">
            {children}
        </div>
    );
}
