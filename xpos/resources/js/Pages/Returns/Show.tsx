import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { PageProps } from '@/types';
import {
    ArrowLeftIcon,
    PrinterIcon,
    XCircleIcon,
    CheckCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

interface SaleReturn {
    return_id: number;
    return_number: string;
    sale_id: number;
    sale: {
        sale_number: string;
        fiscal_number?: string;
        items: Array<{
            product: {
                name: string;
            };
            quantity: string;
            unit_price: string;
        }>;
    };
    customer?: {
        name: string;
        phone?: string;
    };
    user?: {
        name: string;
    };
    branch?: {
        name: string;
    };
    subtotal: string;
    tax_amount: string;
    total: string;
    status: 'pending' | 'completed' | 'cancelled';
    reason?: string;
    notes?: string;
    fiscal_number?: string;
    return_date: string;
    items: Array<{
        return_item_id: number;
        product: {
            name: string;
            unit?: string;
        };
        quantity: string;
        unit_price: string;
        total: string;
        reason?: string;
        saleItem: {
            quantity: string;
        };
    }>;
    refunds: Array<{
        refund_id: number;
        method: string;
        amount: string;
        payment?: {
            payment_id: number;
        };
        notes?: string;
    }>;
}

interface ShowReturnsProps extends PageProps {
    return: SaleReturn;
}

export default function Show({ auth, return: returnData }: ShowReturnsProps) {
    const getStatusBadge = (status: string) => {
        const configs = {
            completed: {
                color: 'bg-green-100 text-green-800',
                text: 'Tamamlandı',
                icon: CheckCircleIcon,
            },
            pending: {
                color: 'bg-yellow-100 text-yellow-800',
                text: 'Gözləyir',
                icon: ClockIcon,
            },
            cancelled: {
                color: 'bg-red-100 text-red-800',
                text: 'Ləğv edilib',
                icon: XCircleIcon,
            },
        };

        const config = configs[status as keyof typeof configs] || configs.completed;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="h-4 w-4 mr-1" />
                {config.text}
            </span>
        );
    };

    const getPaymentMethodDisplay = (method: string) => {
        const methods: Record<string, string> = {
            nağd: 'Nağd',
            kart: 'Kart',
            köçürmə: 'Köçürmə',
            kredit: 'Kredit',
        };
        return methods[method] || method;
    };

    const handleCancel = () => {
        if (confirm('Bu qaytarmanı ləğv etmək istədiyinizdən əminsiniz?')) {
            router.post(route('returns.cancel', returnData.return_id));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.visit(route('returns.index'))}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                Qaytarma #{returnData.return_number}
                            </h2>
                            <p className="text-sm text-gray-600">
                                Orijinal satış:{' '}
                                <Link
                                    href={route('sales.show', returnData.sale_id)}
                                    className="text-blue-600 hover:underline"
                                >
                                    {returnData.sale.sale_number}
                                </Link>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {getStatusBadge(returnData.status)}
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PrinterIcon className="h-5 w-5 mr-2" />
                            Çap et
                        </button>
                        {returnData.status === 'completed' && (
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                            >
                                <XCircleIcon className="h-5 w-5 mr-2" />
                                Ləğv et
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Qaytarma #${returnData.return_number}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Müştəri Məlumatları</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-sm text-gray-600">Ad</div>
                                    <div className="font-medium">
                                        {returnData.customer?.name || 'Anonim'}
                                    </div>
                                </div>
                                {returnData.customer?.phone && (
                                    <div>
                                        <div className="text-sm text-gray-600">Telefon</div>
                                        <div className="font-medium">{returnData.customer.phone}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Qaytarma Məlumatları</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-sm text-gray-600">Tarix</div>
                                    <div className="font-medium">
                                        {new Date(returnData.return_date).toLocaleString('az-AZ')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Filial</div>
                                    <div className="font-medium">{returnData.branch?.name || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">İstifadəçi</div>
                                    <div className="font-medium">{returnData.user?.name || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Fiskal Məlumat</h3>
                            <div className="space-y-2">
                                {returnData.fiscal_number ? (
                                    <>
                                        <div>
                                            <div className="text-sm text-gray-600">Fiskal Nömrə</div>
                                            <div className="font-medium">{returnData.fiscal_number}</div>
                                        </div>
                                        {returnData.sale.fiscal_number && (
                                            <div>
                                                <div className="text-sm text-gray-600">Orijinal Fiskal Nömrə</div>
                                                <div className="font-medium">
                                                    {returnData.sale.fiscal_number}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-600">Fiskal qəbz çap edilməyib</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Return Reason */}
                    {(returnData.reason || returnData.notes) && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Səbəb və Qeydlər</h3>
                            {returnData.reason && (
                                <div className="mb-3">
                                    <div className="text-sm text-gray-600 mb-1">Qaytarma səbəbi:</div>
                                    <div className="text-gray-800">{returnData.reason}</div>
                                </div>
                            )}
                            {returnData.notes && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Qeydlər:</div>
                                    <div className="text-gray-800">{returnData.notes}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Returned Items */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Qaytarılan Məhsullar</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Məhsul
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Qaytarılan / Alınmış
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Qiymət
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cəmi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Səbəb
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {returnData.items.map((item) => (
                                        <tr key={item.return_item_id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">
                                                    {item.product.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="font-medium text-red-600">
                                                    {item.quantity} {item.product.unit || 'ədəd'}
                                                </div>
                                                {item.saleItem && (
                                                    <div className="text-xs text-gray-500">
                                                        / {item.saleItem.quantity}{' '}
                                                        {item.product.unit || 'ədəd'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {item.unit_price} ₼
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                                                {item.total} ₼
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {item.reason || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Refunds */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Geri Ödənişlər</h3>
                        <div className="space-y-3">
                            {returnData.refunds.map((refund) => (
                                <div
                                    key={refund.refund_id}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {getPaymentMethodDisplay(refund.method)}
                                        </div>
                                        {refund.notes && (
                                            <div className="text-sm text-gray-600">{refund.notes}</div>
                                        )}
                                    </div>
                                    <div className="font-semibold text-lg">{refund.amount} ₼</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Yekun</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ara cəm:</span>
                                <span className="font-medium">{returnData.subtotal} ₼</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">ƏDV:</span>
                                <span className="font-medium">{returnData.tax_amount} ₼</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold border-t pt-2">
                                <span>ÜMUMİ QAYTARILAN:</span>
                                <span className="text-red-600">{returnData.total} ₼</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
