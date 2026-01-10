import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onClear?: () => void;
    title?: string;
    width?: number;
    height?: number;
    value?: string;
}

export default function SignaturePad({
    onSave,
    onClear,
    title = 'İmza',
    width = 400,
    height = 200,
    value
}: SignaturePadProps) {
    const signatureRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        if (value && signatureRef.current) {
            signatureRef.current.fromDataURL(value);
            setIsEmpty(false);
        }
    }, [value]);

    const handleClear = () => {
        if (signatureRef.current) {
            signatureRef.current.clear();
            setIsEmpty(true);
            onClear?.();
        }
    };

    const handleSave = () => {
        if (signatureRef.current && !isEmpty) {
            const signature = signatureRef.current.toDataURL();
            onSave(signature);
        }
    };

    const handleEnd = () => {
        setIsEmpty(false);
    };

    return (
        <div className="space-y-3">
            {title && (
                <label className="block text-sm font-medium text-gray-700">
                    {title}
                </label>
            )}

            <div className="relative border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                        width,
                        height,
                        className: 'w-full h-full touch-none',
                        style: { touchAction: 'none' }
                    }}
                    backgroundColor="white"
                    onEnd={handleEnd}
                />

                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm">İmza üçün burada çəkin</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    disabled={isEmpty}
                >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Təmizlə
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                    disabled={isEmpty}
                >
                    İmzanı Təsdiqlə
                </button>
            </div>
        </div>
    );
}
