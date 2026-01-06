import React, { useEffect, useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrintModal from '@/Components/PrintModal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import StatusBadge from '@/Components/StatusBadge';
import { PageProps, Sale } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface SalesShowProps extends PageProps {
    sale: Sale & {
        customer?: {
            id: number;
            name: string;
            phone?: string;
            email?: string;
        };
        branch: {
            id: number;
            name: string;
        };
        user: {
            id: number;
            name: string;
        };
        deleted_by_user?: {
            id: number;
            name: string;
        };
        items: Array<{
            item_id: number;
            product: {
                id: number;
                name: string;
                sku: string;
            };
            quantity: number;
            unit_price: number;
            discount_amount: number;
            total: number;
            stock_level_at_sale?: number;
        }>;
        payments: Array<{
            payment_id: number;
            method: string;
            amount: number;
            transaction_id?: string;
            card_type?: string;
            reference_number?: string;
            notes?: string;
            created_at: string;
        }>;
        negative_stock_alerts?: Array<{
            alert_id: number;
            product: {
                id: number;
                name: string;
            };
            quantity_sold: number;
            stock_level: number;
            message: string;
            status: string;
            alert_date: string;
        }>;
    };
    canDeleteSales: boolean;
}

export default function Show({ auth, sale, canDeleteSales }: SalesShowProps) {
    const { t } = useTranslation('sales');
    const [showPrintModal, setShowPrintModal] = React.useState(false);
    const [fiscalPrintStatus, setFiscalPrintStatus] = useState<string | null>(null);
    const [fiscalPrintLoading, setFiscalPrintLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { flash } = usePage<any>().props;

    // Fiscal printer status polling
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        let timeout: NodeJS.Timeout | null = null;

        const pollFiscalStatus = async () => {
            try {
                const response = await fetch(`/api/jobs/sale/${sale.sale_id}/status`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    console.error('Failed to fetch fiscal status');
                    return;
                }

                const data = await response.json();

                if (data.status === 'completed') {
                    setFiscalPrintStatus('completed');
                    setFiscalPrintLoading(false);
                    toast.success(t('messages.fiscalPrintCompleted', { fiscalNumber: data.fiscal_number }), {
                        duration: 5000,
                        icon: '✅'
                    });
                    if (interval) clearInterval(interval);
                } else if (data.status === 'failed') {
                    setFiscalPrintStatus('failed');
                    setFiscalPrintLoading(false);
                    toast.error(t('messages.fiscalPrintError', { error: data.error || 'Unknown error' }), {
                        duration: 7000,
                        icon: '❌'
                    });
                    if (interval) clearInterval(interval);
                } else if (data.status === 'pending' || data.status === 'processing') {
                    setFiscalPrintStatus(data.status);
                    setFiscalPrintLoading(true);
                }
            } catch (error) {
                console.error('Error polling fiscal status:', error);
            }
        };

        // Start polling if this is a new sale (from flash)
        if (flash?.auto_print && flash?.print_sale_id === sale.sale_id) {
            setFiscalPrintLoading(true);
            pollFiscalStatus(); // Initial poll
            interval = setInterval(pollFiscalStatus, 2000); // Poll every 2 seconds

            // Stop polling after 2 minutes
            timeout = setTimeout(() => {
                if (interval) clearInterval(interval);
                if (fiscalPrintLoading) {
                    setFiscalPrintLoading(false);
                    toast.error(t('messages.fiscalPrintTimeout'), {
                        duration: 5000
                    });
                }
            }, 120000);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (timeout) clearTimeout(timeout);
        };
    }, [flash, sale.sale_id]);

    // Auto-print detection
    useEffect(() => {
        console.log('Flash data:', flash);
        console.log('Auto print enabled:', flash?.auto_print);
        console.log('Print sale ID:', flash?.print_sale_id);
        console.log('Current sale ID:', sale.sale_id);

        if (flash?.auto_print && flash?.print_sale_id === sale.sale_id) {
            console.log('Auto-print triggered!');
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                setShowPrintModal(true);
            }, 500);
        } else {
            console.log('Auto-print NOT triggered');
        }
    }, [flash, sale.sale_id]);

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'yellow',
            completed: 'green',
            cancelled: 'red',
            refunded: 'gray',
        };
        return colors[status as keyof typeof colors] || 'gray';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            pending: t('status.pending'),
            completed: t('status.completed'),
            cancelled: t('status.cancelled'),
            refunded: t('status.refunded'),
        };
        return labels[status as keyof typeof labels] || status;
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels = {
            'nağd': t('paymentMethods.cash'),
            'kart': t('paymentMethods.card'),
            'köçürmə': t('paymentMethods.transfer'),
        };
        return labels[method as keyof typeof labels] || method;
    };

    const formatCurrency = (amount: number | null | undefined) => {
        return `${(Number(amount) || 0).toFixed(2)} ₼`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ');
    };

    const handleDeleteSale = () => {
        if (!confirm('Bu satışı silmək istədiyinizə əminsiniz? Stoklar bərpa ediləcək və məbləğ sistemdən çıxarılacaq.')) {
            return;
        }

        router.delete(route('sales.destroy', sale.sale_id), {
            onSuccess: () => {
                toast.success('Satış uğurla silindi');
            },
            onError: (errors) => {
                toast.error(errors[0] || 'Xəta baş verdi');
            },
        });
    };

    const handleRestoreSale = () => {
        if (!confirm('Bu satışı bərpa etmək istədiyinizə əminsiniz? DIQQƏT: Stoklar avtomatik çıxarılmayacaq!')) {
            return;
        }

        router.post(route('sales.restore', sale.sale_id), {}, {
            onSuccess: () => {
                toast.success('Satış bərpa edildi');
            },
            onError: (errors) => {
                toast.error(errors[0] || 'Xəta baş verdi');
            },
        });
    };

    const totalPaid = sale.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
    const remainingBalance = (Number(sale.total) || 0) - totalPaid;
    const isDeleted = !!sale.deleted_at;

    return (
        <AuthenticatedLayout>
            <Head title={`Satış #${sale.sale_number}`} />

            <div className="py-12">
                <div className="px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Fiscal Print Status Banner */}
                    {fiscalPrintLoading && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        {t('messages.fiscalPrintWaiting', { status: fiscalPrintStatus === 'processing' ? t('messages.processing') : t('messages.queued') })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deleted Sale Banner */}
                    {isDeleted && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-700 font-medium">
                                        Bu satış silinib - {formatDate(sale.deleted_at!)}
                                    </p>
                                    {sale.deleted_by_user && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Silən: {sale.deleted_by_user.name}
                                        </p>
                                    )}
                                </div>
                                {canDeleteSales && (
                                    <PrimaryButton onClick={handleRestoreSale} className="ml-4">
                                        Bərpa et
                                    </PrimaryButton>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sale Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">{t('show.saleInfo')}</h2>
                            <div className="flex gap-2">
                                {!isDeleted && (
                                    <PrimaryButton onClick={() => setShowPrintModal(true)}>
                                        {t('actions.printReceipt')}
                                    </PrimaryButton>
                                )}
                                {canDeleteSales && !isDeleted && (
                                    <DangerButton onClick={handleDeleteSale}>
                                        Sil
                                    </DangerButton>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">{t('fields.saleNumber')}</h3>
                                <p className="text-lg font-semibold">{sale.sale_number}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">{t('fields.status')}</h3>
                                <StatusBadge
                                    status={sale.status}
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">{t('saleDate')}</h3>
                                <p className="text-lg">{formatDate(sale.sale_date)}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">{t('totalAmount')}</h3>
                                <p className="text-lg font-semibold text-green-600">{formatCurrency(sale.total || 0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Branch Info */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.saleInfo')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">{t('fields.customer')}</h4>
                                {sale.customer ? (
                                    <div>
                                        <p className="font-medium">{sale.customer.name}</p>
                                        {sale.customer.phone && <p className="text-sm text-gray-600">{sale.customer.phone}</p>}
                                        {sale.customer.email && <p className="text-sm text-gray-600">{sale.customer.email}</p>}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">{t('messages.customerNotSelected')}</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">{t('branch')}</h4>
                                <p className="font-medium">{sale.branch.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">{t('employee')}</h4>
                                <p className="font-medium">{sale.user.name}</p>
                            </div>
                        </div>

                        {/* Notes and Location - Side by side in smaller boxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {/* Notes Box - Only show if notes exist */}
                            {sale.notes && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {t('fields.notes')}
                                    </h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{sale.notes}</p>
                                </div>
                            )}

                            {/* Location Box - Show if GPS coordinates OR manual address exists */}
                            {((sale.visit_latitude && sale.visit_longitude) || sale.visit_address) && (() => {
                                const hasGPS = sale.visit_latitude && sale.visit_longitude;
                                const lat = hasGPS ? Number(sale.visit_latitude) : null;
                                const lng = hasGPS ? Number(sale.visit_longitude) : null;

                                return (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Visit Location
                                            </h4>
                                            {hasGPS && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    Map
                                                </a>
                                            )}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            {sale.visit_address && (
                                                <div>
                                                    <span className="text-xs text-blue-700 font-medium">Address:</span>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sale.visit_address)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-800 hover:text-blue-600 underline decoration-dotted block mt-1"
                                                    >
                                                        {sale.visit_address}
                                                    </a>
                                                </div>
                                            )}
                                            {hasGPS && (
                                                <div>
                                                    <span className="text-xs text-blue-700 font-medium">GPS:</span>
                                                    <p className="text-gray-800 font-mono text-xs">{lat!.toFixed(6)}, {lng!.toFixed(6)}</p>
                                                </div>
                                            )}
                                            {sale.visit_timestamp && (
                                                <div>
                                                    <span className="text-xs text-blue-700 font-medium">Time:</span>
                                                    <p className="text-gray-800 text-xs">{formatDate(sale.visit_timestamp)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Negative Stock Alerts */}
                    {sale.negative_stock_alerts && sale.negative_stock_alerts.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-red-900 mb-4">{t('show.negativeStockAlerts')}</h3>
                            <div className="space-y-3">
                                {sale.negative_stock_alerts.map((alert) => (
                                    <div key={alert.alert_id} className="bg-white p-4 rounded border border-red-200">
                                        <p className="font-medium text-red-800">{alert.product?.name}</p>
                                        <p className="text-sm text-red-600">{alert.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(alert.alert_date)} | {t('fields.status')}: {alert.status}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sale Items */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.saleItems')}</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('show.product')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('show.quantity')}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('show.unitPrice')}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('show.discount')}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('show.total')}
                                            </th>
                                            {sale.has_negative_stock && (
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t('show.stockLevel')}
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sale.items.map((item) => (
                                            <tr key={item.item_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.product?.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.product?.sku}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {item.quantity || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {formatCurrency(item.unit_price || 0)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {formatCurrency(item.discount_amount || 0)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    {formatCurrency(item.total || 0)}
                                                </td>
                                                {sale.has_negative_stock && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {item.stock_level_at_sale !== undefined ? item.stock_level_at_sale : '-'}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.totalCalculation')}</h3>
                        <div className="max-w-md ml-auto space-y-2">
                            <div className="flex justify-between">
                                <span>{t('show.subtotal')}:</span>
                                <span className="font-medium">{formatCurrency(sale.subtotal || 0)}</span>
                            </div>
                            {(sale.tax_amount || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span>{t('show.tax')}:</span>
                                    <span className="font-medium">{formatCurrency(sale.tax_amount || 0)}</span>
                                </div>
                            )}
                            {(sale.discount_amount || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span>{t('show.discount')}:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(sale.discount_amount || 0)}</span>
                                </div>
                            )}
                            <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                <span>{t('show.totalAmount')}:</span>
                                <span>{formatCurrency(sale.total || 0)}</span>
                            </div>
                        </div>
                    </div>

                     {/* Payments */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.payments')}</h3>
                        {sale.payments.length === 0 ? (
                            <p className="text-gray-500">{t('messages.noPaymentInfo')}</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t('show.method')}
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t('show.amount')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t('show.transactionId')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t('show.date')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sale.payments.map((payment) => (
                                                <tr key={payment.payment_id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {getPaymentMethodLabel(payment.method)}
                                                        {payment.card_type && (
                                                            <span className="text-xs text-gray-500 ml-1">({payment.card_type})</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                        {formatCurrency(payment.amount || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {payment.transaction_id || payment.reference_number || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(payment.created_at || '')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="max-w-md ml-auto space-y-2 border-t pt-4">
                                    <div className="flex justify-between">
                                        <span>{t('show.totalPaid')}:</span>
                                        <span className="font-medium">{formatCurrency(totalPaid || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('show.remainingBalance')}:</span>
                                        <span className={`font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(remainingBalance || 0)}
                                        </span>
                                    </div>
                                    {remainingBalance <= 0 && (
                                        <div className="flex justify-between text-green-600 font-semibold">
                                            <span>{t('show.fullyPaid')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Credit Status */}
                    {sale.is_credit_sale && sale.customer_credit && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('show.creditInfo')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t('show.creditStatus')}</h4>
                                    <div>
                                        {sale.customer_credit.status === 'paid' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {t('show.fullyPaidBadge')}
                                            </span>
                                        ) : sale.customer_credit.status === 'partial' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                {t('show.partiallyPaidBadge')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                {t('show.unpaidBadge')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t('show.creditAmount')}</h4>
                                    <p className="text-lg font-semibold">{formatCurrency(sale.customer_credit.amount || 0)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t('show.remainingAmount')}</h4>
                                    <p className={`text-lg font-semibold ${(sale.customer_credit.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(sale.customer_credit.remaining_amount || 0)}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t('show.dueDate')}</h4>
                                    <p className="text-lg">
                                        {sale.customer_credit.due_date ? new Date(sale.customer_credit.due_date).toLocaleDateString('az-AZ') : t('show.notSpecified')}
                                    </p>
                                </div>
                            </div>
                            {sale.customer_credit.description && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t('show.creditDescription')}</h4>
                                    <p className="text-gray-700">{sale.customer_credit.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <PrintModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                resourceType="sale"
                resourceId={sale.sale_id}
                title={`Satış: ${sale.sale_number}`}
                autoTrigger={flash?.auto_print && flash?.print_sale_id === sale.sale_id}
            />
        </AuthenticatedLayout>
    );
}