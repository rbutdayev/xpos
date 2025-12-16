import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeftIcon,
    PrinterIcon,
    DocumentTextIcon,
    BuildingStorefrontIcon,
    TruckIcon,
    UserIcon,
    CalendarIcon,
    BanknotesIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    DocumentArrowDownIcon,
    CubeIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { GoodsReceipt } from '@/types';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';

interface Props {
    receipt: GoodsReceipt;
}

export default function Show({ receipt }: Props) {
    const { t } = useTranslation(['inventory', 'common']);
    const [expandedExpenses, setExpandedExpenses] = useState<Set<number>>(new Set());

    const toggleExpense = (expenseId: number) => {
        setExpandedExpenses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(expenseId)) {
                newSet.delete(expenseId);
            } else {
                newSet.add(expenseId);
            }
            return newSet;
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatShortDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate totals
    const subtotal = receipt.items?.reduce((sum, item) =>
        sum + (item.additional_data?.subtotal_before_discount || item.total_cost), 0
    ) || 0;

    const totalDiscount = receipt.items?.reduce((sum, item) =>
        sum + (item.additional_data?.discount_amount || 0), 0
    ) || 0;

    const hasDiscount = receipt.items?.some(item => item.discount_percent > 0);

    // Group expenses - if there's a supplier credit with partial payments, group them
    const groupedExpenses = () => {
        // If there's a supplier credit with partial payments, show it as a group
        if (receipt.supplier_credit && receipt.expenses && receipt.expenses.length > 0) {
            const totalPaid = receipt.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

            return [{
                main: {
                    expense_id: receipt.supplier_credit.id,
                    reference_number: receipt.receipt_number,
                    amount: receipt.supplier_credit.amount,
                    remaining_amount: receipt.supplier_credit.remaining_amount,
                    expense_date: receipt.created_at,
                    description: `Mal qəbulu - ${receipt.receipt_number}`,
                    user: receipt.employee,
                    isSupplierCredit: true
                },
                partialPayments: receipt.expenses,
                totalPaid
            }];
        }

        // Otherwise, just show individual expenses without grouping
        if (receipt.expenses && receipt.expenses.length > 0) {
            return receipt.expenses.map(expense => ({
                main: expense,
                partialPayments: [],
                totalPaid: 0
            }));
        }

        return [];
    };

    // Payment status badge
    const getPaymentStatusBadge = () => {
        const statusConfig = {
            paid: {
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: CheckCircleIcon,
                text: 'Ödənilib'
            },
            partial: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: ClockIcon,
                text: 'Qismən ödənilib'
            },
            unpaid: {
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: ExclamationCircleIcon,
                text: 'Ödənilməyib'
            }
        };

        const config = statusConfig[receipt.payment_status] || statusConfig.unpaid;
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${config.color} font-medium text-sm`}>
                <Icon className="w-4 h-4" />
                {config.text}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${t('goodsReceipts.title')} - ${receipt.receipt_number}`} />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <Link
                                        href={route('goods-receipts.index')}
                                        className="mt-1 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ArrowLeftIcon className="w-5 h-5" />
                                    </Link>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                                {receipt.receipt_number}
                                            </h1>
                                            {getPaymentStatusBadge()}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4" />
                                            {formatDate(receipt.created_at || '')}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={route('goods-receipts.print', receipt.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    <PrinterIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">{t('goodsReceipts.printReceipt')}</span>
                                    <span className="sm:hidden">Çap et</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Products & Summary */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Products List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CubeIcon className="w-6 h-6 text-blue-600" />
                                            <h2 className="text-lg font-semibold text-gray-900">Məhsullar</h2>
                                        </div>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {receipt.items?.length || 1} məhsul
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {receipt.items && receipt.items.length > 0 ? (
                                            receipt.items.map((item, index) => (
                                                <div key={item.id} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start gap-3">
                                                                <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                                    {index + 1}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-semibold text-gray-900 text-base">
                                                                        {item.product?.name}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-500 font-mono mt-1">
                                                                        SKU: {item.product?.sku}
                                                                    </p>
                                                                    {item.variant && (
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                                                {item.variant.size} • {item.variant.color}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {formatCurrency(item.total_cost)}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {item.quantity} {item.unit} × {formatCurrency(item.unit_cost)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {item.discount_percent > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-red-600 font-medium flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    Endirim {item.discount_percent}%
                                                                </span>
                                                                <span className="text-red-600 font-semibold">
                                                                    -{formatCurrency(item.additional_data?.discount_amount || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            // Legacy single product fallback
                                            <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                            {t('goodsReceipts.productName')}
                                                        </label>
                                                        <p className="mt-1 text-base font-semibold text-gray-900">
                                                            {receipt.product?.name}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                {t('labels.sku', { ns: 'common' })}
                                                            </label>
                                                            <p className="mt-1 text-sm font-mono text-gray-900">
                                                                {receipt.product?.sku}
                                                            </p>
                                                        </div>
                                                        {receipt.product?.barcode && (
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                    {t('table.barcode')}
                                                                </label>
                                                                <p className="mt-1 text-sm font-mono text-gray-900">
                                                                    {receipt.product?.barcode}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary Section */}
                                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                        {receipt.items && receipt.items.length > 0 && (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Ara cəm:</span>
                                                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                                                </div>
                                                {hasDiscount && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Endirim:</span>
                                                        <span className="font-medium text-red-600">-{formatCurrency(totalDiscount)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                            <span className="text-base font-semibold text-gray-900">Yekun məbləğ:</span>
                                            <span className="text-2xl font-bold text-blue-600">{formatCurrency(receipt.total_cost)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment History */}
                            {receipt.expenses && receipt.expenses.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BanknotesIcon className="w-6 h-6 text-green-600" />
                                                <h2 className="text-lg font-semibold text-gray-900">Ödəniş Tarixçəsi</h2>
                                            </div>
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                {groupedExpenses().length} əsas ödəniş
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            {groupedExpenses().map((group, groupIndex) => {
                                                const isExpanded = expandedExpenses.has(group.main.expense_id || 0);
                                                const hasPartialPayments = group.partialPayments.length > 0;
                                                const remainingAmount = group.main.remaining_amount || 0;
                                                const isPaid = remainingAmount === 0;

                                                return (
                                                    <div key={group.main.expense_id} className="bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200 overflow-hidden">
                                                        {/* Main Expense */}
                                                        <div className="p-4">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="w-7 h-7 flex items-center justify-center bg-green-600 text-white rounded-full text-xs font-bold">
                                                                            {groupIndex + 1}
                                                                        </span>
                                                                        <span className="font-semibold text-gray-900">{group.main.reference_number}</span>

                                                                        {/* Payment Status Badge */}
                                                                        {hasPartialPayments && (
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                                isPaid
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                            }`}>
                                                                                {isPaid ? 'Tam ödənilib' : 'Qismən ödənilib'}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-4 mt-2 ml-9 text-xs text-gray-600">
                                                                        <span className="flex items-center gap-1">
                                                                            <CalendarIcon className="w-3.5 h-3.5" />
                                                                            {group.main.expense_date && formatShortDate(group.main.expense_date)}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <UserIcon className="w-3.5 h-3.5" />
                                                                            {group.main.user?.name || '-'}
                                                                        </span>
                                                                    </div>

                                                                    {/* Main expense description */}
                                                                    {group.main.description && (
                                                                        <p className="text-xs text-gray-600 mt-2 ml-9">{group.main.description}</p>
                                                                    )}

                                                                    {/* Show partial payments summary */}
                                                                    {hasPartialPayments && (
                                                                        <div className="mt-3 ml-9 flex items-center gap-2">
                                                                            <div className="text-xs text-gray-600">
                                                                                <span className="font-medium">Ödənilib:</span> {formatCurrency(group.totalPaid)}
                                                                                {!isPaid && (
                                                                                    <>
                                                                                        {' • '}
                                                                                        <span className="font-medium text-orange-600">Qalıq:</span>{' '}
                                                                                        <span className="text-orange-600 font-semibold">{formatCurrency(remainingAmount)}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="text-right flex-shrink-0">
                                                                    <div className="text-lg font-bold text-gray-900">
                                                                        {formatCurrency(group.main.amount)}
                                                                    </div>
                                                                    {hasPartialPayments && (
                                                                        <button
                                                                            onClick={() => toggleExpense(group.main.expense_id || 0)}
                                                                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors"
                                                                        >
                                                                            {isExpanded ? (
                                                                                <>
                                                                                    <ChevronUpIcon className="w-3.5 h-3.5" />
                                                                                    Gizlət
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <ChevronDownIcon className="w-3.5 h-3.5" />
                                                                                    {group.partialPayments.length} ödəniş
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Partial Payments */}
                                                        {hasPartialPayments && isExpanded && (
                                                            <div className="bg-white/50 border-t border-green-200 px-4 py-3">
                                                                <div className="space-y-2">
                                                                    {group.partialPayments.map((payment: any, paymentIndex: number) => (
                                                                        <div
                                                                            key={payment.expense_id}
                                                                            className="bg-white p-3 rounded border border-green-100 ml-9"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="w-5 h-5 flex items-center justify-center bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                                                                                            {paymentIndex + 1}
                                                                                        </span>
                                                                                        <span className="text-xs font-medium text-gray-900 font-mono">
                                                                                            {payment.reference_number}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3 mt-1 ml-7 text-xs text-gray-500">
                                                                                        <span className="flex items-center gap-1">
                                                                                            <CalendarIcon className="w-3 h-3" />
                                                                                            {formatShortDate(payment.expense_date)}
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <UserIcon className="w-3 h-3" />
                                                                                            {payment.user?.name || '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                    {payment.notes && (
                                                                                        <p className="text-xs text-gray-500 mt-1 ml-7 italic">{payment.notes}</p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-right flex-shrink-0">
                                                                                    <div className="text-sm font-bold text-green-600">
                                                                                        {formatCurrency(payment.amount)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Details */}
                        <div className="space-y-6">
                            {/* Receipt Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Qəbul Məlumatı</h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Qəbul nömrəsi
                                        </label>
                                        <p className="mt-1 text-sm font-mono font-semibold text-gray-900">
                                            {receipt.receipt_number}
                                        </p>
                                    </div>
                                    {receipt.invoice_number && (
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Faktura nömrəsi
                                            </label>
                                            <p className="mt-1 text-sm font-mono font-semibold text-green-600">
                                                {receipt.invoice_number}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Yaradılma tarixi
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 flex items-center gap-1.5">
                                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                                            {formatDate(receipt.created_at || '')}
                                        </p>
                                    </div>
                                    {receipt.employee && (
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Qəbul edən
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 flex items-center gap-1.5">
                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                                {receipt.employee.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Supplier Info */}
                            {receipt.supplier && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
                                        <div className="flex items-center gap-2">
                                            <TruckIcon className="w-5 h-5 text-green-600" />
                                            <h3 className="font-semibold text-gray-900">Təchizatçı</h3>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Ad
                                            </label>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {receipt.supplier.name}
                                            </p>
                                        </div>
                                        {receipt.supplier.contact_person && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    Əlaqə şəxsi
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {receipt.supplier.contact_person}
                                                </p>
                                            </div>
                                        )}
                                        {receipt.supplier.phone && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    Telefon
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 font-mono">
                                                    {receipt.supplier.phone}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Warehouse Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-4 border-b border-purple-100">
                                    <div className="flex items-center gap-2">
                                        <BuildingStorefrontIcon className="w-5 h-5 text-purple-600" />
                                        <h3 className="font-semibold text-gray-900">Anbar</h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Anbar adı
                                        </label>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {receipt.warehouse?.name}
                                        </p>
                                    </div>
                                    {receipt.warehouse?.location && (
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Ünvan
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {receipt.warehouse?.location}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Status */}
                            {receipt.supplier_credit && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-100">
                                        <div className="flex items-center gap-2">
                                            <BanknotesIcon className="w-5 h-5 text-orange-600" />
                                            <h3 className="font-semibold text-gray-900">Ödəniş Statusu</h3>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Status
                                            </label>
                                            <div className="mt-2">
                                                {getPaymentStatusBadge()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Ümumi məbləğ
                                            </label>
                                            <p className="mt-1 text-xl font-bold text-gray-900">
                                                {formatCurrency(receipt.supplier_credit.amount)}
                                            </p>
                                        </div>
                                        {receipt.supplier_credit.remaining_amount > 0 ? (
                                            <div className="pt-4 border-t border-orange-100">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    Qalıq borc
                                                </label>
                                                <p className="mt-1 text-2xl font-bold text-red-600">
                                                    {formatCurrency(receipt.supplier_credit.remaining_amount)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="pt-4 border-t border-orange-100">
                                                <div className="flex items-center gap-2 text-green-700">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    <span className="font-semibold">Tam ödənilib</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Document */}
                            {receipt.document_path && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100">
                                        <div className="flex items-center gap-2">
                                            <DocumentArrowDownIcon className="w-5 h-5 text-blue-600" />
                                            <h3 className="font-semibold text-gray-900">Əlavə Sənəd</h3>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        Qəbul sənədi
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Görüntülə və ya yüklə
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {receipt.document_view_url && (
                                                    <a
                                                        href={receipt.document_view_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                                                    >
                                                        Bax
                                                    </a>
                                                )}
                                                {receipt.document_download_url && (
                                                    <a
                                                        href={receipt.document_download_url}
                                                        download
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                                    >
                                                        Yüklə
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {receipt.notes && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                                            <h3 className="font-semibold text-gray-900">Qeydlər</h3>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {receipt.notes}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Link
                                href={route('goods-receipts.index')}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Geri qayıt
                            </Link>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                <ClockIcon className="w-4 h-4" />
                                Son yeniləmə: {formatDate(receipt.updated_at || '')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
