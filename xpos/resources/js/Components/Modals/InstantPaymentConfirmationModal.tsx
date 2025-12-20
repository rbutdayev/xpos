import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InstantPaymentConfirmationModalProps {
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    processing?: boolean;
}

export default function InstantPaymentConfirmationModal({
    show,
    onConfirm,
    onCancel,
    processing = false
}: InstantPaymentConfirmationModalProps) {
    return (
        <Modal show={show} onClose={onCancel} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
                    </div>
                    <div className="ml-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Dərhal ödəniş təsdiqi
                        </h2>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700 mb-3">
                        Siz <strong>dərhal ödəniş</strong> metodu seçmisiniz.
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <p className="text-sm text-yellow-800 font-medium">
                            ⚠️ Diqqət: Bu qaimə yaradıldıqdan sonra dəyişdirilə bilməz və ödəniş statusu "Ödənilib" olaraq qeyd ediləcək.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <SecondaryButton
                        type="button"
                        onClick={onCancel}
                        disabled={processing}
                    >
                        Ləğv et
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Yaradılır...' : 'Təsdiq et və davam et'}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}
