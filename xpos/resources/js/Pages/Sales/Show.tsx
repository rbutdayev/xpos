import React, { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrintModal from '@/Components/PrintModal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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
}

export default function Show({ auth, sale }: SalesShowProps) {
    const { t } = useTranslation('sales');
    const [showPrintModal, setShowPrintModal] = React.useState(false);
    const [fiscalPrintStatus, setFiscalPrintStatus] = useState<string | null>(null);
    const [fiscalPrintLoading, setFiscalPrintLoading] = useState(false);
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

    const totalPaid = sale.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
    const remainingBalance = (Number(sale.total) || 0) - totalPaid;

    return (
        <AuthenticatedLayout>
            <Head title={`Satış #${sale.sale_number}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
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

                    {/* Sale Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
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
                        {sale.notes && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">{t('fields.notes')}</h4>
                                <p className="text-gray-700">{sale.notes}</p>
                            </div>
                        )}
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