import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface BarcodePrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    barcode: string;
    productName: string;
    barcodeType?: string;
}

export default function BarcodePrintModal({
    isOpen,
    onClose,
    productId,
    barcode,
    productName,
    barcodeType = 'Code-128'
}: BarcodePrintModalProps) {
    const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [copies, setCopies] = useState(1);
    const [showProductName, setShowProductName] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    const labelSizes = {
        small: { width: 40, height: 25, barcodeHeight: 60 },
        medium: { width: 50, height: 30, barcodeHeight: 80 },
        large: { width: 60, height: 40, barcodeHeight: 100 }
    };

    const currentSize = labelSizes[labelSize];
    const barcodeImageUrl = route('barcodes.show', { 
        product: productId, 
        format: 'png', 
        width: 3, 
        height: currentSize.barcodeHeight 
    });

    const handlePrint = () => {
        if (printRef.current) {
            const printContent = printRef.current.innerHTML;
            const printWindow = window.open('', '_blank');
            
            if (!printWindow) {
                alert('Pop-up blocker is active. Please enable popups for this site.');
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Barcode Print - ${productName}</title>
                    <style>
                        @page {
                            size: ${currentSize.width}mm ${currentSize.height}mm;
                            margin: 1mm;
                        }
                        
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                            background: white;
                        }
                        
                        .print-page {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 2mm;
                        }
                        
                        .barcode-label {
                            width: ${currentSize.width}mm;
                            height: ${currentSize.height}mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            border: 1px solid #ddd;
                            padding: 1mm;
                            box-sizing: border-box;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .barcode-image {
                            max-width: 95%;
                            height: auto;
                            margin-bottom: 1mm;
                        }
                        
                        .barcode-text {
                            font-size: 8px;
                            font-family: monospace;
                            color: #000;
                            margin: 1px 0;
                            line-height: 1;
                        }
                        
                        .product-name {
                            font-size: 6px;
                            color: #333;
                            margin: 1px 0;
                            line-height: 1;
                            max-height: 12px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .barcode-label { border: 1px solid #000; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-page">
                        ${printContent}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
        }
    };

    const generatePrintContent = () => {
        const labels = [];
        for (let i = 0; i < copies; i++) {
            labels.push(
                <div key={i} className="barcode-label">
                    <img 
                        src={barcodeImageUrl} 
                        alt={`Barcode: ${barcode}`} 
                        className="barcode-image"
                        onError={(e) => {
                            console.error('Barcode image failed to load');
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div className="barcode-text">{barcode}</div>
                    {showProductName && (
                        <div className="product-name">{productName}</div>
                    )}
                </div>
            );
        }
        return labels;
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
                    <div className="flex items-center justify-between p-6 border-b">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Barcode Print Preview
                        </Dialog.Title>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {/* Print Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Label Size
                                </label>
                                <select
                                    value={labelSize}
                                    onChange={(e) => setLabelSize(e.target.value as 'small' | 'medium' | 'large')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="small">Small (40×25mm)</option>
                                    <option value="medium">Medium (50×30mm)</option>
                                    <option value="large">Large (60×40mm)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Copies
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={copies}
                                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-center">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={showProductName}
                                        onChange={(e) => setShowProductName(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Show product name</span>
                                </label>
                            </div>
                        </div>
                        
                        {/* Preview */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview:</h3>
                            <div 
                                ref={printRef}
                                className="flex flex-wrap gap-2 justify-center"
                                style={{ maxHeight: '300px', overflowY: 'auto' }}
                            >
                                {generatePrintContent()}
                            </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="bg-blue-50 p-3 rounded-lg mb-6">
                            <div className="text-sm text-gray-600">
                                <div><strong>Product:</strong> {productName}</div>
                                <div><strong>Barcode:</strong> {barcode}</div>
                                <div><strong>Type:</strong> {barcodeType}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Print Labels
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}