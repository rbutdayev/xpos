import React from 'react';
import { printBarcode } from '../utils/barcodePrinter';

interface BarcodeDisplayProps {
    productId?: number;
    barcode: string;
    barcodeType?: string;
    showActions?: boolean;
    className?: string;
    imageClassName?: string;
}

export default function BarcodeDisplay({
    productId,
    barcode,
    barcodeType = 'Code-128',
    showActions = true,
    className = "",
    imageClassName = ""
}: BarcodeDisplayProps) {
    if (!barcode) {
        return null;
    }

    const handlePrint = async () => {
        if (!productId) {
            alert('Məhsul ID-si tapılmadı. Məhsulu əvvəlcə yadda saxlayın.');
            return;
        }

        try {
            // Print using configured printer settings (automatically fetches from backend)
            await printBarcode(productId, barcode, barcodeType);
        } catch (error) {
            console.error('Print error:', error);
            alert('Çap zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
        }
    };

    const handleDownload = () => {
        if (productId) {
            const link = document.createElement('a');
            link.href = `/barcodes/${productId}?format=png&width=3&height=60`;
            link.download = `barcode-${barcode}.png`;
            link.click();
        }
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
        <div className={`p-3 bg-white border border-gray-200 rounded-lg ${className}`}>
            <div className="text-xs text-gray-600 mb-2">
                Barkod {productId ? 'görünüşü' : 'önizləmə'}:
                {barcodeType && (
                    <span className="ml-2 text-blue-600 font-medium">({barcodeType})</span>
                )}
            </div>
            
            <img 
                src={productId 
                    ? `/barcodes/${productId}?format=png&width=2&height=50` 
                    : generatePreviewSvg()
                }
                alt={`Barkod: ${barcode}`}
                className={`max-w-full h-auto border border-gray-200 rounded p-1 ${imageClassName}`}
                style={{ maxWidth: '200px' }}
            />
            
            <div className="mt-1 text-xs text-gray-700 font-mono">
                {barcode}
            </div>
            
            {!productId && (
                <div className="mt-1 text-xs text-gray-500">
                    * Həqiqi barkod şəkli məhsul yaradıldıqdan sonra əlçatan olacaq
                </div>
            )}
            
            {productId && showActions && (
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
    );
}