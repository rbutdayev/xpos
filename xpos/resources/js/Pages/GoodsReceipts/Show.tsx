import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon, DocumentIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { GoodsReceipt } from '@/types';
import { useTranslation } from 'react-i18next';

interface Props {
    receipt: GoodsReceipt;
}

export default function Show({ receipt }: Props) {
    const { t } = useTranslation(['inventory', 'common']);

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

    return (
        <AuthenticatedLayout>
            <Head title={`${t('goodsReceipts.title')} - ${receipt.receipt_number}`} />

            <div className="w-full min-h-screen bg-gray-50 -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                    <div className="p-6 sm:p-8 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Link
                                    href={route('goods-receipts.index')}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        {t('goodsReceipts.title')} - {receipt.receipt_number}
                                    </h2>
                                    <p className="text-gray-600">{t('goodsReceipts.receiptDetails')}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <a
                                    href={route('goods-receipts.print', receipt.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <PrinterIcon className="w-4 h-4 mr-2" />
                                    {t('goodsReceipts.printReceipt')}
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Column 1: Receipt Info & Products */}
                            <div className="space-y-6">
                                {/* Receipt Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        {t('goodsReceipts.receiptInfo')}
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                {t('goodsReceipts.receiptNumber')}
                                            </dt>
                                            <dd className="text-sm text-gray-900 font-mono">
                                                {receipt.receipt_number}
                                            </dd>
                                        </div>
                                        {receipt.invoice_number && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">
                                                    Faktura Nömrəsi
                                                </dt>
                                                <dd className="text-sm text-green-600 font-medium">
                                                    📄 {receipt.invoice_number}
                                                </dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                {t('goodsReceipts.createdDate')}
                                            </dt>
                                            <dd className="text-sm text-gray-900">
                                                {formatDate(receipt.created_at || '')}
                                            </dd>
                                        </div>
                                        {receipt.employee && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">
                                                    {t('goodsReceipts.receivedBy')}
                                                </dt>
                                                <dd className="text-sm text-gray-900">
                                                    {receipt.employee.name}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            {/* Column 2: Products List */}
                            <div className="space-y-6">
                                {/* Products List */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-blue-900 mb-4">
                                        Məhsullar ({receipt.items?.length || 1})
                                    </h3>
                                    <div className="space-y-3">
                                        {receipt.items && receipt.items.length > 0 ? (
                                            receipt.items.map((item, index) => (
                                                <div key={item.id} className="bg-white p-3 rounded border border-blue-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-blue-900">
                                                                {index + 1}. {item.product?.name}
                                                            </p>
                                                            <p className="text-xs text-blue-700 font-mono">
                                                                SKU: {item.product?.sku}
                                                            </p>
                                                            {item.variant && (
                                                                <p className="text-xs text-blue-600">
                                                                    Variant: {item.variant.size} {item.variant.color}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-blue-900">
                                                                {item.quantity} {item.unit}
                                                            </p>
                                                            <p className="text-xs text-blue-700">
                                                                {formatCurrency(item.unit_cost)} / {item.unit}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                                                        <span className="text-xs text-blue-700">
                                                            {item.discount_percent > 0 && (
                                                                <span className="text-red-600">
                                                                    Endirim: {item.discount_percent}%
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="text-sm font-bold text-blue-900">
                                                            {formatCurrency(item.total_cost)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            // Fallback for legacy structure (single product)
                                            <div className="bg-white p-3 rounded border border-blue-200">
                                                <dl className="space-y-2">
                                                    <div>
                                                        <dt className="text-sm font-medium text-blue-700">
                                                            {t('goodsReceipts.productName')}
                                                        </dt>
                                                        <dd className="text-sm text-blue-900 font-medium">
                                                            {receipt.product?.name}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm font-medium text-blue-700">
                                                            {t('labels.sku', { ns: 'common' })}
                                                        </dt>
                                                        <dd className="text-sm text-blue-900 font-mono">
                                                            {receipt.product?.sku}
                                                        </dd>
                                                    </div>
                                                    {receipt.product?.barcode && (
                                                        <div>
                                                            <dt className="text-sm font-medium text-blue-700">
                                                                {t('table.barcode')}
                                                            </dt>
                                                            <dd className="text-sm text-blue-900 font-mono">
                                                                {receipt.product?.barcode}
                                                            </dd>
                                                        </div>
                                                    )}
                                                </dl>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Column 3: Supplier, Warehouse & Summary */}
                            <div className="space-y-6">
                                {/* Supplier Information */}
                                {receipt.supplier && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-green-900 mb-4">
                                            {t('goodsReceipts.supplierInfo')}
                                        </h3>
                                        <dl className="space-y-3">
                                            <div>
                                                <dt className="text-sm font-medium text-green-700">
                                                    {t('goodsReceipts.supplierName')}
                                                </dt>
                                                <dd className="text-sm text-green-900 font-medium">
                                                    {receipt.supplier.name}
                                                </dd>
                                            </div>
                                            {receipt.supplier.contact_person && (
                                                <div>
                                                    <dt className="text-sm font-medium text-green-700">
                                                        {t('goodsReceipts.contactPerson')}
                                                    </dt>
                                                    <dd className="text-sm text-green-900">
                                                        {receipt.supplier.contact_person}
                                                    </dd>
                                                </div>
                                            )}
                                            {receipt.supplier.phone && (
                                                <div>
                                                    <dt className="text-sm font-medium text-green-700">
                                                        {t('goodsReceipts.phone')}
                                                    </dt>
                                                    <dd className="text-sm text-green-900">
                                                        {receipt.supplier.phone}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                )}
                                {/* Warehouse Information */}
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-purple-900 mb-4">
                                        {t('goodsReceipts.warehouseInfo')}
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-purple-700">
                                                {t('goodsReceipts.warehouseName')}
                                            </dt>
                                            <dd className="text-sm text-purple-900 font-medium">
                                                {receipt.warehouse?.name}
                                            </dd>
                                        </div>
                                        {receipt.warehouse?.location && (
                                            <div>
                                                <dt className="text-sm font-medium text-purple-700">
                                                    {t('goodsReceipts.location')}
                                                </dt>
                                                <dd className="text-sm text-purple-900">
                                                    {receipt.warehouse?.location}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Total Cost Summary */}
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-yellow-900 mb-4">
                                        Məbləğ Xülasəsi
                                    </h3>
                                    <dl className="space-y-3">
                                        {receipt.items && receipt.items.length > 0 && (
                                            <>
                                                <div>
                                                    <dt className="text-sm font-medium text-yellow-700">
                                                        Məhsul sayı
                                                    </dt>
                                                    <dd className="text-lg text-yellow-900 font-bold">
                                                        {receipt.items.length} məhsul
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-yellow-700">
                                                        Ara Cəm
                                                    </dt>
                                                    <dd className="text-sm text-yellow-900 font-medium">
                                                        {formatCurrency(
                                                            receipt.items.reduce((sum, item) =>
                                                                sum + (item.additional_data?.subtotal_before_discount || item.total_cost), 0
                                                            )
                                                        )}
                                                    </dd>
                                                </div>
                                                {receipt.items.some(item => item.discount_percent > 0) && (
                                                    <div>
                                                        <dt className="text-sm font-medium text-yellow-700">
                                                            Ümumi Endirim
                                                        </dt>
                                                        <dd className="text-sm text-red-600 font-medium">
                                                            -{formatCurrency(
                                                                receipt.items.reduce((sum, item) =>
                                                                    sum + (item.additional_data?.discount_amount || 0), 0
                                                                )
                                                            )}
                                                        </dd>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {receipt.total_cost && (
                                            <div className="pt-2 border-t border-yellow-200">
                                                <dt className="text-sm font-medium text-yellow-700">
                                                    Yekun Məbləğ
                                                </dt>
                                                <dd className="text-xl text-yellow-900 font-bold">
                                                    {formatCurrency(receipt.total_cost)}
                                                </dd>
                                            </div>
                                        )}
                                        {/* Fallback for legacy single product */}
                                        {!receipt.items && receipt.quantity && (
                                            <div>
                                                <dt className="text-sm font-medium text-yellow-700">
                                                    {t('goodsReceipts.receivedQuantity')}
                                                </dt>
                                                <dd className="text-lg text-yellow-900 font-bold">
                                                    {receipt.quantity}{receipt.unit ? ` ${receipt.unit}` : ''}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Payment Status */}
                                {receipt.supplier_credit && (
                                    <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                                        <h3 className="text-lg font-medium text-orange-900 mb-4">
                                            Ödəniş Statusu
                                        </h3>
                                        <dl className="space-y-3">
                                            <div>
                                                <dt className="text-sm font-medium text-orange-700">
                                                    Status
                                                </dt>
                                                <dd className="text-sm font-medium">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        receipt.payment_status === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : receipt.payment_status === 'partial'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {receipt.payment_status === 'paid' ? '✓ Ödənilib' :
                                                         receipt.payment_status === 'partial' ? 'Qismən ödənilib' : 'Ödənilməyib'}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-orange-700">
                                                    Ümumi məbləğ
                                                </dt>
                                                <dd className="text-lg text-orange-900 font-bold">
                                                    {formatCurrency(receipt.supplier_credit.amount)}
                                                </dd>
                                            </div>
                                            {receipt.supplier_credit.remaining_amount > 0 && (
                                                <div>
                                                    <dt className="text-sm font-medium text-orange-700">
                                                        Qalıq borc
                                                    </dt>
                                                    <dd className="text-lg text-red-600 font-bold">
                                                        {formatCurrency(receipt.supplier_credit.remaining_amount)}
                                                    </dd>
                                                </div>
                                            )}
                                            {receipt.supplier_credit.remaining_amount == 0 && (
                                                <div className="pt-2 border-t border-orange-200">
                                                    <p className="text-sm text-green-700 font-medium">
                                                        ✓ Tam ödənilib
                                                    </p>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                )}

                                {/* Payment History */}
                                {receipt.expenses && receipt.expenses.length > 0 && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-green-900 mb-4">
                                            Ödəniş Tarixçəsi ({receipt.expenses.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {receipt.expenses.map((expense: any, index: number) => (
                                                <div key={expense.expense_id} className="bg-white p-3 rounded border border-green-200">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-green-900">
                                                                Ödəniş #{index + 1}
                                                            </p>
                                                            <p className="text-xs text-green-700 font-mono">
                                                                {expense.reference_number}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-green-900">
                                                                {formatCurrency(expense.amount)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t border-green-100 text-xs">
                                                        <span className="text-green-700">
                                                            {new Date(expense.expense_date).toLocaleDateString('az-AZ')}
                                                        </span>
                                                        <span className="text-green-600">
                                                            {expense.user?.name || '-'}
                                                        </span>
                                                    </div>
                                                    {expense.notes && (
                                                        <p className="text-xs text-green-600 mt-2 italic">
                                                            {expense.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Document */}
                                {receipt.document_path && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            {t('goodsReceipts.attachedDocument')}
                                        </h3>
                                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                                            <div className="flex items-center">
                                                <DocumentIcon className="w-8 h-8 text-blue-500 mr-3" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {t('goodsReceipts.receiptDocument')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {t('goodsReceipts.viewOrDownload')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {receipt.document_view_url && (
                                                    <a
                                                        href={receipt.document_view_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                    >
                                                        {t('goodsReceipts.viewDocument')}
                                                    </a>
                                                )}
                                                {receipt.document_download_url && (
                                                    <a
                                                        href={receipt.document_download_url}
                                                        download
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        {t('goodsReceipts.downloadDocument')}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {receipt.notes && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            {t('goodsReceipts.notes')}
                                        </h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {receipt.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
                            <Link
                                href={route('goods-receipts.index')}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                {t('goodsReceipts.backToList')}
                            </Link>

                            <div className="text-xs text-gray-500">
                                {t('goodsReceipts.lastUpdated')}: {formatDate(receipt.updated_at || '')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
