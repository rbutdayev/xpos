import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon, DocumentIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { GoodsReceipt } from '@/types';
// Using hardcoded Azerbaijani strings like other pages in the application

interface Props {
    receipt: GoodsReceipt;
}

export default function Show({ receipt }: Props) {
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
            <Head title={`Mal qəbulu - ${receipt.receipt_number}`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
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
                                        Mal qəbulu - {receipt.receipt_number}
                                    </h2>
                                    <p className="text-gray-600">Qəbul təfərrüatları</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    <PrinterIcon className="w-4 h-4 mr-2" />
                                    Çap et
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Receipt Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Qəbul məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Qəbul nömrəsi
                                            </dt>
                                            <dd className="text-sm text-gray-900 font-mono">
                                                {receipt.receipt_number}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Yaradılma tarixi
                                            </dt>
                                            <dd className="text-sm text-gray-900">
                                                {formatDate(receipt.created_at || '')}
                                            </dd>
                                        </div>
                                        {receipt.employee && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">
                                                    Qəbul edən
                                                </dt>
                                                <dd className="text-sm text-gray-900">
                                                    {receipt.employee.name}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Product Information */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-blue-900 mb-4">
                                        Məhsul məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-blue-700">
                                                Məhsul adı
                                            </dt>
                                            <dd className="text-sm text-blue-900 font-medium">
                                                {receipt.product?.name}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-blue-700">
                                                SKU
                                            </dt>
                                            <dd className="text-sm text-blue-900 font-mono">
                                                {receipt.product?.sku}
                                            </dd>
                                        </div>
                                        {receipt.product?.barcode && (
                                            <div>
                                                <dt className="text-sm font-medium text-blue-700">
                                                    Barkod
                                                </dt>
                                                <dd className="text-sm text-blue-900 font-mono">
                                                    {receipt.product?.barcode}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Supplier Information */}
                                {receipt.supplier && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-green-900 mb-4">
                                            Təchizatçı məlumatları
                                        </h3>
                                        <dl className="space-y-3">
                                            <div>
                                                <dt className="text-sm font-medium text-green-700">
                                                    Təchizatçı adı
                                                </dt>
                                                <dd className="text-sm text-green-900 font-medium">
                                                    {receipt.supplier.name}
                                                </dd>
                                            </div>
                                            {receipt.supplier.contact_person && (
                                                <div>
                                                    <dt className="text-sm font-medium text-green-700">
                                                        Əlaqə şəxsi
                                                    </dt>
                                                    <dd className="text-sm text-green-900">
                                                        {receipt.supplier.contact_person}
                                                    </dd>
                                                </div>
                                            )}
                                            {receipt.supplier.phone && (
                                                <div>
                                                    <dt className="text-sm font-medium text-green-700">
                                                        Telefon
                                                    </dt>
                                                    <dd className="text-sm text-green-900">
                                                        {receipt.supplier.phone}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Warehouse Information */}
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-purple-900 mb-4">
                                        Anbar məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-purple-700">
                                                Anbar adı
                                            </dt>
                                            <dd className="text-sm text-purple-900 font-medium">
                                                {receipt.warehouse?.name}
                                            </dd>
                                        </div>
                                        {receipt.warehouse?.location && (
                                            <div>
                                                <dt className="text-sm font-medium text-purple-700">
                                                    Yer
                                                </dt>
                                                <dd className="text-sm text-purple-900">
                                                    {receipt.warehouse?.location}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Quantity & Cost Information */}
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-yellow-900 mb-4">
                                        Miqdar və dəyər məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-yellow-700">
                                                Qəbul edilən miqdar
                                            </dt>
                                            <dd className="text-lg text-yellow-900 font-bold">
                                                {receipt.quantity}{receipt.unit ? ` ${receipt.unit}` : ''}
                                            </dd>
                                        </div>
                                        {receipt.unit_cost && (
                                            <div>
                                                <dt className="text-sm font-medium text-yellow-700">
                                                    Vahid dəyər
                                                </dt>
                                                <dd className="text-sm text-yellow-900 font-medium">
                                                    {formatCurrency(receipt.unit_cost)}
                                                </dd>
                                            </div>
                                        )}
                                        {receipt.total_cost && (
                                            <div>
                                                <dt className="text-sm font-medium text-yellow-700">
                                                    Ümumi dəyər
                                                </dt>
                                                <dd className="text-lg text-yellow-900 font-bold">
                                                    {formatCurrency(receipt.total_cost)}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Document */}
                                {receipt.document_path && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Əlavə edilmiş sənəd
                                        </h3>
                                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                                            <div className="flex items-center">
                                                <DocumentIcon className="w-8 h-8 text-blue-500 mr-3" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Qəbul sənədi
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Sənədi görüntülə və ya yüklə
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
                                                        Görüntülə
                                                    </a>
                                                )}
                                                {receipt.document_download_url && (
                                                    <a
                                                        href={receipt.document_download_url}
                                                        download
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Yüklə
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
                                            Qeydlər
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
                                Siyahıya qayıt
                            </Link>
                            
                            <div className="text-xs text-gray-500">
                                Son yenilənmə: {formatDate(receipt.updated_at || '')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}