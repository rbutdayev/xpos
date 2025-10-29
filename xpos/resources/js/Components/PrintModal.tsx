import { useState, useEffect } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface PrintTemplate {
    template_id: number;
    name: string;
    is_default: boolean;
}

// PrinterConfig interface removed - using standard PC printing

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceType: 'service-record' | 'sale' | 'customer-item';
    resourceId: number;
    title: string;
    autoTrigger?: boolean; // Auto-trigger printing when modal opens
}

export default function PrintModal({ isOpen, onClose, resourceType, resourceId, title, autoTrigger = false }: PrintModalProps) {
    const [templates, setTemplates] = useState<PrintTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [previewContent, setPreviewContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [autoTriggered, setAutoTriggered] = useState(false);

    // Helper to get correct URL path based on resource type
    const getResourcePath = () => {
        switch (resourceType) {
            case 'service-record':
                return 'service-records';
            case 'sale':
                return 'sales';
            case 'customer-item':
                return 'customer-items';
            default:
                return `${resourceType}s`;
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchPrintOptions();
            setAutoTriggered(false); // Reset auto-trigger flag
        }
    }, [isOpen, resourceType, resourceId]);

    const fetchPrintOptions = async () => {
        setLoading(true);
        setError('');

        try {
            const resourcePath = getResourcePath();
            const response = await fetch(`/${resourcePath}/${resourceId}/print-options`, {
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch print options: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();

            setTemplates(data.templates || []);

            // Auto-select default template
            const defaultTemplate = data.templates?.find((t: PrintTemplate) => t.is_default);
            if (defaultTemplate) {
                setSelectedTemplate(defaultTemplate.template_id);

                // Auto-trigger printing if enabled and not already triggered
                if (autoTrigger && !autoTriggered) {
                    setAutoTriggered(true);
                    toast.loading('Çap hazırlanır...', { id: 'auto-print' });
                    // Small delay to ensure template is set
                    setTimeout(() => {
                        handlePrintWithTemplate(defaultTemplate.template_id);
                    }, 300);
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Print seçimlərini yükləyərkən xəta baş verdi.';
            setError(errorMessage);
            console.error('Error fetching print options:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!selectedTemplate) {
            setError('Şablon seçin.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const resourcePath = getResourcePath();
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }

            const response = await fetch(`/${resourcePath}/${resourceId}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    template_id: selectedTemplate,
                }),
            });

            // Check if response is actually JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Status: ' + response.status);
            }

            const data = await response.json();

            if (data.success) {
                setPreviewContent(data.content);
                setShowPreview(true);
            } else {
                setError(data.message || 'Önizləmə yaradılarkən xəta baş verdi.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Önizləmə yaradılarkən xəta baş verdi.';
            setError(errorMessage);
            console.error('Error generating preview:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintWithTemplate = async (templateId: number) => {
        setLoading(true);
        setError('');

        try {
            const resourcePath = getResourcePath();
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }

            const response = await fetch(`/${resourcePath}/${resourceId}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    template_id: templateId,
                }),
            });

            // Check if response is actually JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Status: ' + response.status + '. Please refresh the page and try again.');
            }

            const data = await response.json();
            
            if (data.success) {
                try {
                    // Use hidden iframe instead of popup (bypasses popup blockers)
                    const printContent = data.content;

                    // Remove existing print iframe if any
                    const existingFrame = document.getElementById('print-iframe');
                    if (existingFrame) {
                        existingFrame.remove();
                    }

                    // Create hidden iframe
                    const iframe = document.createElement('iframe');
                    iframe.id = 'print-iframe';
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    document.body.appendChild(iframe);

                    const iframeDoc = iframe.contentWindow?.document;
                    if (iframeDoc) {
                        iframeDoc.open();
                        iframeDoc.write(`
                            <html>
                                <head>
                                    <title>Qəbz Çapı</title>
                                    <style>
                                        body {
                                            font-family: 'Courier New', monospace;
                                            font-size: 12px;
                                            margin: 20px;
                                            line-height: 1.2;
                                        }
                                        pre {
                                            white-space: pre-wrap;
                                            word-wrap: break-word;
                                            margin: 0;
                                        }
                                        @media print {
                                            body { margin: 0; }
                                            @page {
                                                size: 80mm auto;
                                                margin: 2mm;
                                            }
                                        }
                                    </style>
                                </head>
                                <body>
                                    <pre>${printContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                                </body>
                            </html>
                        `);
                        iframeDoc.close();

                        // Trigger print after content loads
                        iframe.onload = () => {
                            setTimeout(() => {
                                iframe.contentWindow?.print();

                                // Show success toast
                                toast.success('Çap göndərildi!', { id: 'auto-print', duration: 3000 });

                                // Remove iframe after printing
                                setTimeout(() => {
                                    iframe.remove();
                                }, 1000);
                            }, 100);
                        };

                        // Close modal after a short delay for auto-print
                        if (autoTrigger) {
                            setTimeout(() => {
                                onClose();
                            }, 1500);
                        } else {
                            onClose();
                        }
                    }
                } catch (printErr) {
                    console.error('Print error:', printErr);
                    const errorMessage = printErr instanceof Error ? printErr.message : 'Unknown error';
                    setError('Çap zamanı xəta baş verdi: ' + errorMessage);
                    toast.error('Çap xətası: ' + errorMessage, { id: 'auto-print' });
                }
            } else {
                setError(data.message || 'Çap yaradılarkən xəta baş verdi.');
                toast.error(data.message || 'Çap yaradılarkən xəta baş verdi.', { id: 'auto-print' });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Çap göndərilərkən xəta baş verdi.';
            setError(errorMessage);
            toast.error(errorMessage, { id: 'auto-print' });
            console.error('Error sending print:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!selectedTemplate) {
            setError('Şablon seçin.');
            return;
        }
        await handlePrintWithTemplate(selectedTemplate);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        <PrinterIcon className="w-6 h-6 inline mr-2" />
                        {title} - Çap et
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {!showPreview ? (
                        <div className="space-y-6">
                            {/* Template Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Çap şablonu
                                </label>
                                {templates.length === 0 ? (
                                    <p className="text-sm text-gray-500">Heç bir şablon tapılmadı. Əvvəlcə qəbz şablonu yaradın.</p>
                                ) : (
                                    <select
                                        value={selectedTemplate || ''}
                                        onChange={(e) => setSelectedTemplate(Number(e.target.value) || null)}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Şablon seçin...</option>
                                        {templates.map((template) => (
                                            <option key={template.template_id} value={template.template_id}>
                                                {template.name} {template.is_default ? '(Əsas)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Standard PC Printing Notice */}
                            <div>
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <div className="flex">
                                        <PrinterIcon className="h-5 w-5 text-blue-400 mr-2" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium">Standart Çap</p>
                                            <p>Qəbz kompyuterin əsas printerinə göndəriləcək. Termal printer istifadə edirsinizsə, çap parametrlərini düzgün konfiqurasiya edin.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={handlePreview}
                                    disabled={loading || !selectedTemplate}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                >
                                    {loading ? 'Yüklənir...' : 'Önizləmə'}
                                </button>
                                <div className="space-x-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Ləğv et
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        disabled={loading || !selectedTemplate}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Göndərilir...' : 'Çap et'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Preview */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Çap önizləməsi</h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    ← Ayarlara qayıt
                                </button>
                            </div>
                            
                            <div className="bg-gray-100 p-4 rounded-md">
                                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                    {previewContent}
                                </pre>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    ← Geriyə
                                </button>
                                <div className="space-x-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Ləğv et
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Göndərilir...' : 'Çap et'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}