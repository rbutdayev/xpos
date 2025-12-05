import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface FiscalConfig {
    id: number;
    provider: string;
    name: string;
    shift_open: boolean;
    shift_opened_at: string | null;
    last_z_report_at: string | null;
}

interface ShiftStatusWidgetProps {
    fiscalConfig: FiscalConfig | null;
    compact?: boolean;
}

export default function ShiftStatusWidget({ fiscalConfig, compact = false }: ShiftStatusWidgetProps) {
    const [shiftHours, setShiftHours] = useState<number | null>(null);

    // Calculate shift duration
    useEffect(() => {
        if (fiscalConfig?.shift_open && fiscalConfig.shift_opened_at) {
            const updateDuration = () => {
                const opened = new Date(fiscalConfig.shift_opened_at!);
                const now = new Date();
                const hours = Math.floor((now.getTime() - opened.getTime()) / (1000 * 60 * 60));
                setShiftHours(hours);
            };

            updateDuration();
            const interval = setInterval(updateDuration, 60000); // Update every minute

            return () => clearInterval(interval);
        } else {
            setShiftHours(null);
        }
    }, [fiscalConfig]);

    if (!fiscalConfig) {
        return null;
    }

    const isShiftExpired = shiftHours !== null && shiftHours >= 24;
    const isShiftNearExpiration = shiftHours !== null && shiftHours >= 23;

    if (compact) {
        // Compact version for POS header
        return (
            <Link
                href="/shift-management"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    fiscalConfig.shift_open
                        ? isShiftExpired
                            ? 'bg-red-100 hover:bg-red-200 text-red-900'
                            : isShiftNearExpiration
                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900'
                            : 'bg-green-100 hover:bg-green-200 text-green-900'
                        : 'bg-red-100 hover:bg-red-200 text-red-900'
                }`}
            >
                {fiscalConfig.shift_open ? (
                    <>
                        {isShiftExpired ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        ) : isShiftNearExpiration ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                        ) : (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        )}
                        <div className="text-left">
                            <div className="text-xs font-medium">
                                {isShiftExpired
                                    ? 'Növbə Bitib!'
                                    : isShiftNearExpiration
                                    ? 'Növbə Bitir'
                                    : 'Növbə Açıq'}
                            </div>
                            {shiftHours !== null && (
                                <div className="text-xs">{shiftHours} saat</div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                        <div className="text-xs font-medium">Növbə Bağlı</div>
                    </>
                )}
            </Link>
        );
    }

    // Full version for dashboard/other pages
    return (
        <Link
            href="/shift-management"
            className={`block rounded-lg p-4 shadow-sm transition-all hover:shadow-md ${
                fiscalConfig.shift_open
                    ? isShiftExpired
                        ? 'bg-red-50 border-2 border-red-200'
                        : isShiftNearExpiration
                        ? 'bg-yellow-50 border-2 border-yellow-200'
                        : 'bg-green-50 border-2 border-green-200'
                    : 'bg-gray-50 border-2 border-gray-200'
            }`}
        >
            <div className="flex items-center gap-3">
                {fiscalConfig.shift_open ? (
                    <>
                        {isShiftExpired ? (
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                        ) : isShiftNearExpiration ? (
                            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                        ) : (
                            <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                            <p className={`text-sm font-semibold ${
                                isShiftExpired
                                    ? 'text-red-900'
                                    : isShiftNearExpiration
                                    ? 'text-yellow-900'
                                    : 'text-green-900'
                            }`}>
                                {isShiftExpired
                                    ? 'Növbə Vaxtı Bitib!'
                                    : isShiftNearExpiration
                                    ? 'Növbə Tezliklə Bitəcək'
                                    : 'Fiskal Növbə Açıq'}
                            </p>
                            {shiftHours !== null && (
                                <p className={`text-lg font-bold mt-1 ${
                                    isShiftExpired
                                        ? 'text-red-600'
                                        : isShiftNearExpiration
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                }`}>
                                    {shiftHours} saat
                                </p>
                            )}
                            {isShiftExpired && (
                                <p className="text-xs text-red-700 mt-1">
                                    Dərhal növbəni bağlayın!
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <XCircleIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                                Fiskal Növbə Bağlı
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                Növbəni açın
                            </p>
                        </div>
                    </>
                )}
            </div>
        </Link>
    );
}
