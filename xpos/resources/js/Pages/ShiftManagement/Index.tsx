import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { PageProps } from '@/types';
import SalesNavigation from '@/Components/SalesNavigation';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    PlusCircleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

interface FiscalConfig {
    id: number;
    provider: string;
    name: string;
    shift_open: boolean;
    shift_opened_at: string | null;
    last_z_report_at: string | null;
}

interface ShiftManagementProps extends PageProps {
    fiscalConfig: FiscalConfig | null;
}

export default function Index({ auth, fiscalConfig, discountsEnabled }: ShiftManagementProps) {
    const [loading, setLoading] = useState(false);
    const [shiftStatus, setShiftStatus] = useState<any>(null);
    const [shiftHours, setShiftHours] = useState<number | null>(null);

    const canManageShift = ['admin', 'account_owner', 'branch_manager'].includes(auth.user.role);

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

    const fetchShiftStatus = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/fiscal-printer/shift/status');
            setShiftStatus(response.data);

            if (response.data.success) {
                toast.success('Status yeniləndi');
                // Reload page to get fresh data
                router.reload({ only: ['fiscalConfig'] });
            } else {
                toast.error(response.data.error || 'Status yoxlanılarkən xəta baş verdi');
            }
        } catch (error: any) {
            toast.error('Xəta: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenShift = async () => {
        if (!confirm('Növbəni açmaq istədiyinizə əminsiniz?')) return;

        setLoading(true);
        try {
            const response = await axios.post('/fiscal-printer/shift/open');

            if (response.data.success) {
                toast.success(response.data.message);
                router.reload({ only: ['fiscalConfig'] });
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error('Xəta: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCloseShift = async () => {
        if (!confirm('Növbəni bağlamaq və Z-Hesabat çap etmək istədiyinizə əminsiniz?\n\nBu əməliyyatdan sonra yeni növbə açılmalıdır.')) return;

        setLoading(true);
        try {
            const response = await axios.post('/fiscal-printer/shift/close');

            if (response.data.success) {
                toast.success(response.data.message);
                router.reload({ only: ['fiscalConfig'] });
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error('Xəta: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleXReport = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/fiscal-printer/shift/x-report');

            if (response.data.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error('Xəta: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!fiscalConfig) {
        return (
            <AuthenticatedLayout>
                <Head title="Növbə İdarəetməsi" />
                <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                    <SalesNavigation currentRoute="shift-management" showDiscounts={discountsEnabled}>
                        <Link
                            href={route('pos.index')}
                            className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                        >
                            <PlusCircleIcon className="w-5 h-5 text-white" />
                            <span className="font-semibold">Satış et</span>
                        </Link>
                    </SalesNavigation>
                </div>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    Fiskal Printer Konfiqurasiya Olunmayıb
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Növbə idarəetməsindən istifadə etmək üçün əvvəlcə fiskal printer konfiqurasiya edin.
                                </p>
                                <div className="mt-6">
                                    <PrimaryButton
                                        onClick={() => router.visit('/fiscal-printer')}
                                    >
                                        Fiskal Printer Konfiqurasiyası
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const isShiftExpired = shiftHours !== null && shiftHours >= 24;
    const isShiftNearExpiration = shiftHours !== null && shiftHours >= 23;

    return (
        <AuthenticatedLayout>
            <Head title="Növbə İdarəetməsi" />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <SalesNavigation currentRoute="shift-management" showDiscounts={discountsEnabled}>
                    <Link
                        href={route('pos.index')}
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    >
                        <PlusCircleIcon className="w-5 h-5 text-white" />
                        <span className="font-semibold">Satış et</span>
                    </Link>
                </SalesNavigation>
            </div>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Növbə İdarəetməsi
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Fiskal printer növbəsini idarə edin və hesabatlar çap edin
                                    </p>
                                </div>
                                <ClockIcon className="h-12 w-12 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Current Status */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Cari Status
                                </h3>
                                <SecondaryButton
                                    onClick={fetchShiftStatus}
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Yenilə
                                </SecondaryButton>
                            </div>

                            <div className={`rounded-lg p-6 ${
                                fiscalConfig.shift_open
                                    ? isShiftExpired
                                        ? 'bg-red-50 border-2 border-red-200'
                                        : isShiftNearExpiration
                                        ? 'bg-yellow-50 border-2 border-yellow-200'
                                        : 'bg-green-50 border-2 border-green-200'
                                    : 'bg-gray-50 border-2 border-gray-200'
                            }`}>
                                <div className="flex items-center gap-4">
                                    {fiscalConfig.shift_open ? (
                                        <>
                                            {isShiftExpired ? (
                                                <XCircleIcon className="h-10 w-10 text-red-500" />
                                            ) : isShiftNearExpiration ? (
                                                <ExclamationTriangleIcon className="h-10 w-10 text-yellow-500" />
                                            ) : (
                                                <CheckCircleIcon className="h-10 w-10 text-green-500" />
                                            )}
                                            <div className="flex-1">
                                                <p className={`text-lg font-semibold ${
                                                    isShiftExpired
                                                        ? 'text-red-900'
                                                        : isShiftNearExpiration
                                                        ? 'text-yellow-900'
                                                        : 'text-green-900'
                                                }`}>
                                                    {isShiftExpired
                                                        ? '⚠️ Növbə Vaxtı Bitib!'
                                                        : isShiftNearExpiration
                                                        ? '⚠️ Diqqət: Növbə Tezliklə Bitəcək!'
                                                        : '✓ Növbə Açıqdır'}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Açılma vaxtı: {new Date(fiscalConfig.shift_opened_at!).toLocaleString('az-AZ')}
                                                </p>
                                                {shiftHours !== null && (
                                                    <p className={`text-2xl font-bold mt-2 ${
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
                                                    <p className="text-sm text-red-700 mt-2 font-medium">
                                                        Növbə 24 saatdan çox olub. Dərhal növbəni bağlayın!
                                                    </p>
                                                )}
                                                {isShiftNearExpiration && !isShiftExpired && (
                                                    <p className="text-sm text-yellow-700 mt-2 font-medium">
                                                        Növbə tezliklə 24 saata çatacaq. Növbəni bağlamağa hazırlaşın.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <XCircleIcon className="h-10 w-10 text-gray-400" />
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    Növbə Bağlıdır
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    İşə başlamaq üçün növbəni açın
                                                </p>
                                                {fiscalConfig.last_z_report_at && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Son Z-Hesabat: {new Date(fiscalConfig.last_z_report_at).toLocaleString('az-AZ')}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Provider Info */}
                            <div className="mt-4 text-sm text-gray-600">
                                <span className="font-medium">Provayder:</span> {fiscalConfig.provider.toUpperCase()}
                                <span className="mx-2">•</span>
                                <span className="font-medium">Cihaz:</span> {fiscalConfig.name}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-6">
                                Əməliyyatlar
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Open Shift */}
                                {!fiscalConfig.shift_open && canManageShift && (
                                    <div className="col-span-full">
                                        <PrimaryButton
                                            onClick={handleOpenShift}
                                            disabled={loading}
                                            className="w-full py-4 text-lg flex items-center justify-center gap-2"
                                        >
                                            <CheckCircleIcon className="h-6 w-6" />
                                            Növbəni Aç
                                        </PrimaryButton>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Yeni növbə açın və işə başlayın
                                        </p>
                                    </div>
                                )}

                                {/* X-Report */}
                                {fiscalConfig.shift_open && (
                                    <div>
                                        <SecondaryButton
                                            onClick={handleXReport}
                                            disabled={loading}
                                            className="w-full py-4 text-lg flex items-center justify-center gap-2"
                                        >
                                            <DocumentTextIcon className="h-6 w-6" />
                                            X-Hesabat Çap Et
                                        </SecondaryButton>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Ara hesabat (növbə bağlanmır)
                                        </p>
                                    </div>
                                )}

                                {/* Close Shift */}
                                {fiscalConfig.shift_open && canManageShift && (
                                    <div>
                                        <DangerButton
                                            onClick={handleCloseShift}
                                            disabled={loading}
                                            className="w-full py-4 text-lg flex items-center justify-center gap-2"
                                        >
                                            <XCircleIcon className="h-6 w-6" />
                                            Növbəni Bağla və Z-Hesabat
                                        </DangerButton>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Növbəni bitir və Z-hesabat çap et
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Permission Notice */}
                            {fiscalConfig.shift_open && !canManageShift && (
                                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">
                                        <ExclamationTriangleIcon className="h-5 w-5 inline mr-2 text-gray-400" />
                                        Növbəni açmaq və bağlamaq üçün menecerlə əlaqə saxlayın.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="text-sm font-medium text-blue-900 mb-3">
                            Məlumat
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• Növbə maksimum 24 saat açıq qala bilər</li>
                            <li>• X-Hesabat növbəni bağlamadan ara məlumat verir</li>
                            <li>• Z-Hesabat növbəni bağlayır və yeni növbə açılmalıdır</li>
                            <li>• Növbə bağlı olduqda fiskal çek çap olunmur</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
