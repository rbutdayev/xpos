import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface StockImportProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    importJobId: number | null;
}

interface ImportJobStatus {
    id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    file_name: string;
    total_rows: number;
    processed_rows: number;
    successful_rows: number;
    failed_rows: number;
    progress_percentage: number;
    errors: Array<{
        row: string | number;
        message: string;
        data: any;
    }>;
    started_at: string | null;
    completed_at: string | null;
}

export default function StockImportProgressModal({ isOpen, onClose, importJobId }: StockImportProgressModalProps) {
    const [importStatus, setImportStatus] = useState<ImportJobStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!importJobId || !isOpen) {
            return;
        }

        let interval: NodeJS.Timeout;

        const fetchStatus = async () => {
            try {
                const response = await axios.get(`/product-stock/import/status/${importJobId}`);
                setImportStatus(response.data);
                setLoading(false);

                // Stop polling if completed or failed
                if (response.data.status === 'completed' || response.data.status === 'failed') {
                    clearInterval(interval);

                    // Only reload if successful with no errors
                    if (response.data.status === 'completed' &&
                        response.data.errors &&
                        response.data.errors.length === 0 &&
                        response.data.successful_rows > 0) {
                        // Reload after 3 seconds to show updated stock
                        setTimeout(() => {
                            window.location.reload();
                        }, 3000);
                    }
                    // If there are errors, keep modal open so user can read them
                }
            } catch (error) {
                console.error('Error fetching stock import status:', error);
                setLoading(false);
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 2 seconds
        interval = setInterval(fetchStatus, 2000);

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [importJobId, isOpen]);

    const handleClose = () => {
        if (importStatus?.status === 'processing') {
            if (!confirm('İmport davam edir. Bağlamaq istədiyinizə əminsiniz? Proses arxa planda davam edəcək.')) {
                return;
            }
        }
        onClose();
    };

    const getStatusIcon = () => {
        if (!importStatus) return null;

        switch (importStatus.status) {
            case 'pending':
            case 'processing':
                return (
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                        <ClockIcon className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                );
            case 'completed':
                return (
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                );
            case 'failed':
                return (
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                        <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
                    </div>
                );
        }
    };

    const getStatusText = () => {
        if (!importStatus) return 'Yüklənir...';

        switch (importStatus.status) {
            case 'pending':
                return 'Gözləyir';
            case 'processing':
                return 'İşlənir';
            case 'completed':
                return 'Tamamlandı';
            case 'failed':
                return 'Uğursuz';
        }
    };

    const getStatusColor = () => {
        if (!importStatus) return 'text-gray-600';

        switch (importStatus.status) {
            case 'pending':
            case 'processing':
                return 'text-blue-600';
            case 'completed':
                return 'text-green-600';
            case 'failed':
                return 'text-red-600';
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Qalıq İmport Gedişatı
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={handleClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                ) : importStatus ? (
                                    <div className="space-y-6">
                                        {/* Status Header */}
                                        <div className="flex items-center gap-4">
                                            {getStatusIcon()}
                                            <div className="flex-1">
                                                <h4 className={`text-xl font-semibold ${getStatusColor()}`}>
                                                    {getStatusText()}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {importStatus.file_name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm font-medium text-gray-700">
                                                <span>Gedişat</span>
                                                <span>{importStatus.progress_percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        importStatus.status === 'completed'
                                                            ? 'bg-green-500'
                                                            : importStatus.status === 'failed'
                                                            ? 'bg-red-500'
                                                            : 'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${importStatus.progress_percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>
                                                    {importStatus.processed_rows} / {importStatus.total_rows} sətir işləndi
                                                </span>
                                            </div>
                                        </div>

                                        {/* Statistics */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {importStatus.successful_rows}
                                                </div>
                                                <div className="text-xs text-green-700 mt-1">Uğurlu</div>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-red-600">
                                                    {importStatus.failed_rows}
                                                </div>
                                                <div className="text-xs text-red-700 mt-1">Xəta</div>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-gray-600">
                                                    {importStatus.total_rows - importStatus.processed_rows}
                                                </div>
                                                <div className="text-xs text-gray-700 mt-1">Qalıb</div>
                                            </div>
                                        </div>

                                        {/* Errors - EXPANDED */}
                                        {importStatus.errors && importStatus.errors.length > 0 && (
                                            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h5 className="text-base font-bold text-red-900">
                                                        ⚠️ XƏTALAR: {importStatus.errors.length} sətir uğursuz oldu
                                                    </h5>
                                                    {importStatus.errors.length > 5 && (
                                                        <button
                                                            onClick={() => {
                                                                const errorText = importStatus.errors.map((e, i) =>
                                                                    `Sətir ${e.row}: ${e.message}\nMəlumat: ${JSON.stringify(e.data)}`
                                                                ).join('\n\n');
                                                                const blob = new Blob([errorText], { type: 'text/plain' });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `import_errors_${importStatus.id}.txt`;
                                                                a.click();
                                                            }}
                                                            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                        >
                                                            Xətaları Yüklə
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Common error summary */}
                                                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                                                    <p className="text-sm font-semibold text-yellow-900 mb-1">Ən çox rast gəlinən xətalar:</p>
                                                    <ul className="text-xs text-yellow-800 space-y-1">
                                                        {importStatus.errors.filter(e => e.message.includes('tapılmadı')).length > 0 && (
                                                            <li>• {importStatus.errors.filter(e => e.message.includes('Anbar')).length} anbar tapılmadı xətası</li>
                                                        )}
                                                        {importStatus.errors.filter(e => e.message.includes('Barkod')).length > 0 && (
                                                            <li>• {importStatus.errors.filter(e => e.message.includes('Barkod')).length} barkod tapılmadı xətası</li>
                                                        )}
                                                        {importStatus.errors.filter(e => e.message.includes('SKU')).length > 0 && (
                                                            <li>• {importStatus.errors.filter(e => e.message.includes('SKU')).length} SKU tapılmadı xətası</li>
                                                        )}
                                                    </ul>
                                                </div>

                                                {/* Detailed errors - show ALL not just 10 */}
                                                <div className="max-h-96 overflow-y-auto space-y-2">
                                                    {importStatus.errors.map((error, index) => (
                                                        <div
                                                            key={index}
                                                            className="text-sm bg-white rounded p-3 border-l-4 border-red-500"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <span className="font-bold text-red-900">
                                                                        Sətir {error.row}:
                                                                    </span>{' '}
                                                                    <span className="text-red-800 font-medium">{error.message}</span>

                                                                    {/* Show the data that failed */}
                                                                    {error.data && (
                                                                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                {error.data.barcode && (
                                                                                    <div><span className="font-semibold">Barkod:</span> {error.data.barcode}</div>
                                                                                )}
                                                                                {error.data.sku && (
                                                                                    <div><span className="font-semibold">SKU:</span> {error.data.sku}</div>
                                                                                )}
                                                                                {error.data.warehouse_name && (
                                                                                    <div><span className="font-semibold">Anbar:</span> {error.data.warehouse_name}</div>
                                                                                )}
                                                                                {error.data.quantity && (
                                                                                    <div><span className="font-semibold">Miqdar:</span> {error.data.quantity}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="flex justify-end">
                                            {importStatus.status === 'completed' || importStatus.status === 'failed' ? (
                                                <button
                                                    type="button"
                                                    onClick={handleClose}
                                                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    Bağla
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleClose}
                                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    Arxa planda davam et
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        Status məlumatı yüklənə bilmədi
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
