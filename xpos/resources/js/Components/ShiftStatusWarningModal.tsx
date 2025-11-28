import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ShiftStatusWarningModalProps {
    show: boolean;
    type: 'offline' | 'closed';
    onContinue: () => void;
    onCancel: () => void;
    onOpenShift?: () => Promise<void>;
}

export default function ShiftStatusWarningModal({
    show,
    type,
    onContinue,
    onCancel,
    onOpenShift,
}: ShiftStatusWarningModalProps) {
    const [isOpening, setIsOpening] = useState(false);

    const handleOpenShift = async () => {
        if (!onOpenShift) return;

        setIsOpening(true);
        try {
            await onOpenShift();
        } finally {
            setIsOpening(false);
        }
    };

    const getTitle = () => {
        if (type === 'offline') {
            return 'Fiskal printer agent offline';
        }
        return 'Növbə bağlıdır!';
    };

    const getMessage = () => {
        if (type === 'offline') {
            return 'Fiskal printer agent ilə əlaqə yoxdur. Satış zamanı fiskal çek çap edilməyəcək. Davam etmək istəyirsiniz?';
        }
        return 'Satış etmək üçün növbəni açmalısınız. Növbə açmadan davam etsəniz, fiskal çek çap edilməyəcək.';
    };

    return (
        <Modal show={show} maxWidth="md" closeable={false} onClose={() => {}}>
            <div className="p-6">
                <div className="flex items-start">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                        <ExclamationTriangleIcon
                            className="h-6 w-6 text-yellow-600"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                            {getTitle()}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                {getMessage()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    {type === 'closed' && onOpenShift && (
                        <PrimaryButton
                            onClick={handleOpenShift}
                            disabled={isOpening}
                            className="w-full justify-center"
                        >
                            {isOpening ? (
                                <>
                                    <svg
                                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Növbə açılır...
                                </>
                            ) : (
                                'Növbəni Aç və Davam Et'
                            )}
                        </PrimaryButton>
                    )}

                    <SecondaryButton
                        onClick={onContinue}
                        disabled={isOpening}
                        className="w-full justify-center border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    >
                        Davam Et (Risk altında)
                    </SecondaryButton>

                    <SecondaryButton
                        onClick={onCancel}
                        disabled={isOpening}
                        className="w-full justify-center"
                    >
                        Ləğv Et
                    </SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}
