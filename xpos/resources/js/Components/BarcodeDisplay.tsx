import React, { useState } from 'react';
import BarcodePrintModal from './BarcodePrintModal';

interface BarcodeDisplayProps {
    productId?: number;
    barcode: string;
    barcodeType?: string;
    showActions?: boolean;
    className?: string;
    imageClassName?: string;
    productName?: string;
}

export default function BarcodeDisplay({
    productId,
    barcode,
    barcodeType = 'Code-128',
    showActions = true,
    className = "",
    imageClassName = "",
    productName = "Unknown Product"
}: BarcodeDisplayProps) {
    const [showPrintModal, setShowPrintModal] = useState(false);
    if (!barcode) {
        return null;
    }

    const handlePrint = () => {
        if (!productId) {
            // For unsaved products, use direct barcode printing
            const printUrl = route('barcodes.print-direct', { 
                barcode: barcode,
                name: productName,
                type: barcodeType,
                autoprint: '1'
            });
            window.open(printUrl, '_blank');
            return;
        }
        setShowPrintModal(true);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        if (productId) {
            link.href = route('barcodes.show', { product: productId, format: 'png', width: 3, height: 60 });
        } else {
            // For unsaved products, use direct barcode image
            link.href = route('barcodes.show-image', { 
                barcode: barcode, 
                type: barcodeType,
                format: 'png', 
                width: 3, 
                height: 60 
            });
        }
        link.download = `barcode-${barcode}.png`;
        link.click();
    };

    // Generate preview SVG for when we don't have product ID yet
    const generatePreviewSvg = () => {
        return `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
                <rect width="100%" height="100%" fill="white"/>
                <text x="100" y="30" text-anchor="middle" font-family="monospace" font-size="14">${barcode}</text>
            </svg>
        `)}`;
    };

    return (
        <>
            <div className={`p-3 bg-white border border-gray-200 rounded-lg ${className}`}>
                <div className="text-xs text-gray-600 mb-2">
                    Barkod {productId ? 'görünüşü' : 'önizləmə'}:
                    {barcodeType && (
                        <span className="ml-2 text-blue-600 font-medium">({barcodeType})</span>
                    )}
                </div>
                
                <img 
                    src={productId 
                        ? route('barcodes.show', { product: productId, format: 'png', width: 2, height: 50 })
                        : route('barcodes.show-image', { barcode: barcode, type: barcodeType, format: 'png', width: 2, height: 50 })
                    }
                    alt={`Barkod: ${barcode}`}
                    className={`max-w-full h-auto border border-gray-200 rounded p-1 ${imageClassName}`}
                    style={{ maxWidth: '200px' }}
                />
                
                <div className="mt-1 text-xs text-gray-700 font-mono">
                    {barcode}
                </div>
                
                {showActions && (
                    <div className="mt-2 flex space-x-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                            Çap et
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                            Yüklə
                        </button>
                    </div>
                )}
            </div>
            
            {productId && showPrintModal && (
                <BarcodePrintModal
                    isOpen={showPrintModal}
                    onClose={() => setShowPrintModal(false)}
                    productId={productId}
                    barcode={barcode}
                    productName={productName}
                    barcodeType={barcodeType}
                />
            )}
        </>
    );
}