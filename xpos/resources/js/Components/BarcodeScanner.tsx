import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup on close
      if (html5QrCodeRef.current && !isStoppingRef.current) {
        isStoppingRef.current = true;
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current = null;
            isStoppingRef.current = false;
          })
          .catch((err: any) => {
            console.error('Failed to stop scanner:', err);
            html5QrCodeRef.current = null;
            isStoppingRef.current = false;
          });
      }
      setScanning(false);
      setError(null);
      return;
    }

    // Lazy load html5-qrcode
    let mounted = true;
    const startScanner = async () => {
      try {
        setError(null);

        // Dynamically import the library
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!mounted || !scannerRef.current) return;

        const html5QrCode = new Html5Qrcode('barcode-scanner-region');
        html5QrCodeRef.current = html5QrCode;

        // Configure scanner for barcodes
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          formatsToSupport: [
            0, // CODE_128
            1, // CODE_39
            2, // EAN_13
            3, // EAN_8
            4, // ITF
            5, // UPC_A
            6, // UPC_E
          ],
        };

        // Try to use back camera first (better for scanning)
        const devices = await Html5Qrcode.getCameras();
        const backCamera = devices.find((device) =>
          device.label.toLowerCase().includes('back')
        );
        const cameraId = backCamera ? backCamera.id : devices[0]?.id;

        if (!cameraId) {
          setError(t('barcodeScanner.noCameraFound'));
          return;
        }

        if (!mounted) return;

        await html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            // Successfully scanned - stop scanner before closing
            if (html5QrCodeRef.current && !isStoppingRef.current) {
              isStoppingRef.current = true;
              html5QrCodeRef.current
                .stop()
                .then(() => {
                  html5QrCodeRef.current = null;
                  isStoppingRef.current = false;
                  onScan(decodedText);
                  onClose();
                })
                .catch((err: any) => {
                  console.error('Failed to stop scanner:', err);
                  html5QrCodeRef.current = null;
                  isStoppingRef.current = false;
                  onScan(decodedText);
                  onClose();
                });
            }
          },
          undefined
        );

        if (mounted) {
          setScanning(true);
        }
      } catch (err) {
        console.error('Scanner error:', err);
        if (mounted) {
          setError(t('barcodeScanner.cameraAccessDenied'));
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current && !isStoppingRef.current) {
        isStoppingRef.current = true;
        html5QrCodeRef.current
          .stop()
          .then(() => {
            isStoppingRef.current = false;
          })
          .catch((err: any) => {
            console.error('Failed to stop scanner:', err);
            isStoppingRef.current = false;
          });
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-50 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <CameraIcon className="h-6 w-6 text-gray-700" />
              <h3 className="text-lg font-medium text-gray-900">
                {t('barcodeScanner.title')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Scanner Area */}
          <div className="p-6">
            {error ? (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
                <p className="mt-2 text-xs text-red-600">
                  {t('barcodeScanner.grantPermission')}
                </p>
              </div>
            ) : (
              <>
                <div
                  id="barcode-scanner-region"
                  ref={scannerRef}
                  className="mx-auto w-full overflow-hidden rounded-lg"
                />
                {scanning && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      {t('barcodeScanner.holdBarcode')}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('barcodeScanner.autoRead')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {t('actions.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
