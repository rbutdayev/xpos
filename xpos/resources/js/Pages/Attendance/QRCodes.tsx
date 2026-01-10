import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { QRCodeSVG } from 'qrcode.react';
import { PrinterIcon } from '@heroicons/react/24/outline';

interface Branch {
    id: number;
    name: string;
    address: string | null;
    qr_data: string;
}

interface Props {
    branches: Branch[];
}

export default function AttendanceQRCodes({ branches }: Props) {
    const { t } = useTranslation('attendance');

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('qr_codes.title')} />

            <style>{`
                @media print {
                    /* Hide everything except QR codes */
                    body * {
                        visibility: hidden;
                    }

                    #qr-codes-container,
                    #qr-codes-container * {
                        visibility: visible;
                    }

                    #qr-codes-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* Print 4 QR codes per A4 page */
                    .qr-code-card {
                        page-break-inside: avoid;
                        width: 48% !important;
                        margin: 1% !important;
                        float: left;
                    }

                    /* Force new page after every 4 cards */
                    .qr-code-card:nth-child(4n) {
                        page-break-after: always;
                    }

                    /* Hide print button */
                    .no-print {
                        display: none !important;
                    }

                    /* Adjust QR code size for print */
                    .qr-code-svg {
                        width: 200px !important;
                        height: 200px !important;
                    }
                }

                @media screen {
                    .qr-code-svg {
                        width: 256px;
                        height: 256px;
                    }
                }
            `}</style>

            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg no-print">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {t('qr_codes.title')}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {t('qr_codes.description')}
                                </p>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <PrinterIcon className="w-4 h-4 mr-2" />
                                {t('actions.print')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 no-print">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                {t('qr_codes.info')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* QR Codes Grid */}
                <div id="qr-codes-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch) => (
                        <div
                            key={branch.id}
                            className="qr-code-card bg-white overflow-hidden shadow-lg rounded-lg border-2 border-gray-200"
                        >
                            <div className="p-6 text-center">
                                {/* Branch Name */}
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {branch.name}
                                </h3>

                                {/* Branch Address */}
                                {branch.address && (
                                    <p className="text-sm text-gray-600 mb-4">
                                        {branch.address}
                                    </p>
                                )}

                                {/* QR Code */}
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 bg-white rounded-lg border border-gray-300">
                                        <QRCodeSVG
                                            value={branch.qr_data}
                                            size={256}
                                            level="H"
                                            includeMargin={true}
                                            className="qr-code-svg"
                                        />
                                    </div>
                                </div>

                                {/* Instruction Text */}
                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-base font-semibold text-blue-600 mb-1">
                                        {t('qr_codes.scan_instruction')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {t('qr_codes.branch_id')}: {branch.id}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {branches.length === 0 && (
                    <div className="bg-white shadow-sm sm:rounded-lg p-12 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {t('qr_codes.empty.title')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {t('qr_codes.empty.description')}
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
