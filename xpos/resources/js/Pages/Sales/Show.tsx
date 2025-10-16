import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrintModal from '@/Components/PrintModal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import { PageProps, Sale } from '@/types';

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
    const [showPrintModal, setShowPrintModal] = React.useState(false);

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
            pending: 'Gözləyir',
            completed: 'Tamamlandı',
            cancelled: 'Ləğv edildi',
            refunded: 'Geri qaytarıldı',
        };
        return labels[status as keyof typeof labels] || status;
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels = {
            'nağd': 'Nağd',
            'kart': 'Kart',
            'köçürmə': 'Köçürmə',
            'naxşiyyə': 'Naxşiyyə',
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
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Satış #{sale.sale_number}
                    </h2>
                    <div className="flex gap-2">
                        <Link href={route('sales.index')}>
                            <SecondaryButton>
                                Siyahıya qayıt
                            </SecondaryButton>
                        </Link>
                        {sale.status === 'pending' && (
                            <Link href={route('sales.edit', sale.sale_id)}>
                                <PrimaryButton>
                                    Düzəliş et
                                </PrimaryButton>
                            </Link>
                        )}
                        <PrimaryButton onClick={() => setShowPrintModal(true)}>
                            Çap et
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title={`Satış #${sale.sale_number}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Sale Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Satış nömrəsi</h3>
                                <p className="text-lg font-semibold">{sale.sale_number}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                <StatusBadge 
                                    status={sale.status} 
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Satış tarixi</h3>
                                <p className="text-lg">{formatDate(sale.sale_date)}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Ümumi məbləğ</h3>
                                <p className="text-lg font-semibold text-green-600">{formatCurrency(sale.total || 0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Branch Info */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Satış məlumatları</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Müştəri</h4>
                                {sale.customer ? (
                                    <div>
                                        <p className="font-medium">{sale.customer.name}</p>
                                        {sale.customer.phone && <p className="text-sm text-gray-600">{sale.customer.phone}</p>}
                                        {sale.customer.email && <p className="text-sm text-gray-600">{sale.customer.email}</p>}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Müştəri seçilməyib</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Filial</h4>
                                <p className="font-medium">{sale.branch.name}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Satış işçisi</h4>
                                <p className="font-medium">{sale.user.name}</p>
                            </div>
                        </div>
                        {sale.notes && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Qeydlər</h4>
                                <p className="text-gray-700">{sale.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Negative Stock Alerts */}
                    {sale.negative_stock_alerts && sale.negative_stock_alerts.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-red-900 mb-4">⚠️ Mənfi stok xəbərdarlıqları</h3>
                            <div className="space-y-3">
                                {sale.negative_stock_alerts.map((alert) => (
                                    <div key={alert.alert_id} className="bg-white p-4 rounded border border-red-200">
                                        <p className="font-medium text-red-800">{alert.product?.name}</p>
                                        <p className="text-sm text-red-600">{alert.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(alert.alert_date)} | Status: {alert.status}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sale Items */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Satış məhsulları</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Məhsul
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Say
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vahid qiyməti
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Endirim
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cəm
                                            </th>
                                            {sale.has_negative_stock && (
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Stok səviyyəsi
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
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Cəmi hesablama</h3>
                        <div className="max-w-md ml-auto space-y-2">
                            <div className="flex justify-between">
                                <span>Ara cəm:</span>
                                <span className="font-medium">{formatCurrency(sale.subtotal || 0)}</span>
                            </div>
                            {(sale.tax_amount || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span>Vergi:</span>
                                    <span className="font-medium">{formatCurrency(sale.tax_amount || 0)}</span>
                                </div>
                            )}
                            {(sale.discount_amount || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span>Endirim:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(sale.discount_amount || 0)}</span>
                                </div>
                            )}
                            <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                <span>Ümumi cəm:</span>
                                <span>{formatCurrency(sale.total || 0)}</span>
                            </div>
                        </div>
                    </div>

                     {/* Payments */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Ödənişlər</h3>
                        {sale.payments.length === 0 ? (
                            <p className="text-gray-500">Ödəniş məlumatı yoxdur</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Üsul
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Məbləğ
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Əməliyyat ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tarix
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
                                        <span>Ödənilən cəm:</span>
                                        <span className="font-medium">{formatCurrency(totalPaid || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Qalan balans:</span>
                                        <span className={`font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(remainingBalance || 0)}
                                        </span>
                                    </div>
                                    {remainingBalance <= 0 && (
                                        <div className="flex justify-between text-green-600 font-semibold">
                                            <span>✓ Tam ödənilmiş</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Credit Status */}
                    {sale.is_credit_sale && sale.customer_credit && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Kredit məlumatları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Kredit statusu</h4>
                                    <div>
                                        {sale.customer_credit.status === 'paid' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✅ Tam ödənilmiş
                                            </span>
                                        ) : sale.customer_credit.status === 'partial' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                ⏳ Qismən ödənilmiş
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                ❌ Ödənilməmiş
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Kredit məbləği</h4>
                                    <p className="text-lg font-semibold">{formatCurrency(sale.customer_credit.amount || 0)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Qalan məbləğ</h4>
                                    <p className={`text-lg font-semibold ${(sale.customer_credit.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(sale.customer_credit.remaining_amount || 0)}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Son ödəmə tarixi</h4>
                                    <p className="text-lg">
                                        {sale.customer_credit.due_date ? new Date(sale.customer_credit.due_date).toLocaleDateString('az-AZ') : 'Müəyyən edilməyib'}
                                    </p>
                                </div>
                            </div>
                            {sale.customer_credit.description && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Kredit təsviri</h4>
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
            />
        </AuthenticatedLayout>
    );
}