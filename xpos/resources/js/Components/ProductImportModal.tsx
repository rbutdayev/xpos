import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface ProductImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportStarted: (importJobId: number) => void;
}

export default function ProductImportModal({ isOpen, onClose, onImportStarted }: ProductImportModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const maxSize = 20 * 1024 * 1024; // 20MB in bytes

            if (file.size > maxSize) {
                alert('Fayl həcmi çox böyükdür. Maksimum 20MB ola bilər.');
                e.target.value = ''; // Reset the input
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const maxSize = 20 * 1024 * 1024; // 20MB in bytes

            // Check file size
            if (file.size > maxSize) {
                alert('Fayl həcmi çox böyükdür. Maksimum 20MB ola bilər.');
                return;
            }

            // Check if file is Excel or CSV
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
            if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
                setSelectedFile(file);
            } else {
                alert('Yalnız Excel (.xlsx, .xls) və ya CSV faylları qəbul edilir.');
            }
        }
    };

    const handleDownloadTemplate = () => {
        window.location.href = '/products/import/template';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('Zəhmət olmasa fayl seçin.');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('/products/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setSelectedFile(null);
                setUploading(false);
                onClose();
                // Open progress modal
                onImportStarted(response.data.import_job_id);
            } else {
                alert(response.data.message || 'Import başlatma zamanı xəta baş verdi.');
                setUploading(false);
            }
        } catch (error: any) {
            console.error('Import error:', error);
            alert(error.response?.data?.message || 'Import başlatma zamanı xəta baş verdi.');
            setUploading(false);
        }
    };

    const resetModal = () => {
        setSelectedFile(null);
        setUploading(false);
        setDragActive(false);
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={resetModal}>
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
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Məhsul İmport Et
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={resetModal}
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {/* Instructions */}
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                            İmport qaydaları:
                                        </h4>
                                        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                                            <li>Şablon faylını yükləyin</li>
                                            <li>Excel faylını məhsul məlumatları ilə doldurun</li>
                                            <li>Doldurulmuş faylı buraya yükləyin</li>
                                            <li>Məhsullar avtomatik olaraq əlavə ediləcək</li>
                                        </ol>
                                    </div>

                                    {/* Download Template Button */}
                                    <div className="mb-6">
                                        <button
                                            type="button"
                                            onClick={handleDownloadTemplate}
                                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                        >
                                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                            Excel Şablonunu Yüklə
                                        </button>
                                    </div>

                                    {/* File Upload Area */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            İmport faylı seçin
                                        </label>
                                        <div
                                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                                                dragActive
                                                    ? 'border-blue-400 bg-blue-50'
                                                    : selectedFile
                                                    ? 'border-green-300 bg-green-50'
                                                    : 'border-gray-300 bg-gray-50'
                                            }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                        >
                                            <div className="space-y-1 text-center">
                                                {selectedFile ? (
                                                    <>
                                                        <DocumentTextIcon className="mx-auto h-12 w-12 text-green-500" />
                                                        <div className="flex text-sm text-gray-600">
                                                            <p className="font-medium text-green-600">
                                                                {selectedFile.name}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedFile(null)}
                                                            className="text-xs text-red-600 hover:text-red-700 underline"
                                                        >
                                                            Faylı dəyişdir
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex text-sm text-gray-600">
                                                            <label
                                                                htmlFor="file-upload"
                                                                className="relative cursor-pointer rounded-md font-medium text-slate-600 hover:text-slate-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-slate-500"
                                                            >
                                                                <span>Fayl yüklə</span>
                                                                <input
                                                                    id="file-upload"
                                                                    name="file-upload"
                                                                    type="file"
                                                                    className="sr-only"
                                                                    accept=".xlsx,.xls,.csv"
                                                                    onChange={handleFileChange}
                                                                />
                                                            </label>
                                                            <p className="pl-1">və ya buraya sürüşdür</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            XLSX, XLS və ya CSV formatında (maks 20MB)
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={resetModal}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                            disabled={uploading}
                                        >
                                            Ləğv et
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-700 border border-transparent rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!selectedFile || uploading}
                                        >
                                            {uploading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    İmport edilir...
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                                    İmport Et
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
