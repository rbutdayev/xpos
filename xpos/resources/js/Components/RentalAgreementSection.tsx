import { useState } from 'react';
import ConditionChecklistForm from './ConditionChecklistForm';
import PhotoUpload from './PhotoUpload';
import SignaturePad from './SignaturePad';
import { DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface RentalAgreementData {
    rental_category: string;
    condition_checklist: Record<string, any>;
    condition_photos: string[];
    notes: string;
    customer_signature: string;
    terms_accepted: boolean;
}

interface RentalAgreementSectionProps {
    rentalCategory: string;
    template: {
        condition_checklist: any[];
        terms_and_conditions_az: string;
        terms_and_conditions_en: string;
        damage_liability_terms_az: string;
        damage_liability_terms_en: string;
        require_photos: boolean;
        min_photos: number;
    };
    customer: {
        name: string;
        phone: string;
    };
    onComplete: (data: RentalAgreementData) => void;
    onCancel: () => void;
}

export default function RentalAgreementSection({
    rentalCategory,
    template,
    customer,
    onComplete,
    onCancel
}: RentalAgreementSectionProps) {
    const [step, setStep] = useState<'checklist' | 'signature' | 'staff'>('checklist');
    const [checklistValues, setChecklistValues] = useState<Record<string, any>>({});
    const [photos, setPhotos] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [customerSignature, setCustomerSignature] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const isChecklistComplete = () => {
        const requiredFields = template.condition_checklist.filter(item => item.required);
        return requiredFields.every(field => checklistValues[field.id] !== undefined && checklistValues[field.id] !== null && checklistValues[field.id] !== '');
    };

    const isPhotosComplete = () => {
        if (!template.require_photos) return true;
        return photos.length >= template.min_photos;
    };

    const canProceedToSignature = () => {
        return isChecklistComplete() && isPhotosComplete();
    };

    const handleProceedToSignature = () => {
        if (!canProceedToSignature()) {
            alert('Zəhmət olmasa bütün tələb olunan sahələri doldurun');
            return;
        }
        setStep('signature');
    };

    const handleCustomerSignature = (signature: string) => {
        setCustomerSignature(signature);
    };

    const handleProceedToStaff = () => {
        if (!customerSignature) {
            alert('Müştəri imzası tələb olunur');
            return;
        }
        if (!termsAccepted) {
            alert('Müştəri şərtləri qəbul etməlidir');
            return;
        }
        setStep('staff');
    };

    const handleComplete = () => {
        console.log('handleComplete called');
        console.log('Agreement data:', {
            rental_category: rentalCategory,
            condition_checklist: checklistValues,
            condition_photos: photos,
            notes,
            customer_signature: customerSignature,
            terms_accepted: termsAccepted
        });

        onComplete({
            rental_category: rentalCategory,
            condition_checklist: checklistValues,
            condition_photos: photos,
            notes,
            customer_signature: customerSignature,
            terms_accepted: termsAccepted
        });
    };

    return (
        <div className="bg-white shadow-sm rounded-lg">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            İCARƏ MÜQAVİLƏSİ
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Müştəri: {customer.name} - {customer.phone}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            step === 'checklist' ? 'bg-blue-100 text-blue-800' :
                            step === 'signature' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            {step === 'checklist' ? 'Vəziyyət Yoxlaması' :
                             step === 'signature' ? 'Müştəri İmzası' :
                             'İşçi Təsdiqi'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Step 1: Condition Checklist */}
                {step === 'checklist' && (
                    <>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                VƏZİYYƏT YOXLAMASI
                            </h3>
                            <ConditionChecklistForm
                                checklist={template.condition_checklist}
                                values={checklistValues}
                                onChange={setChecklistValues}
                                language="az"
                            />
                        </div>

                        {/* Photos */}
                        <div>
                            <PhotoUpload
                                photos={photos}
                                onPhotosChange={setPhotos}
                                maxPhotos={10}
                                minPhotos={template.min_photos}
                                label="Şəkillər"
                                required={template.require_photos}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Qeydlər
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Əlavə qeydlər (məsələn: Arxa tərəfdə kiçik cızıq var)"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Ləğv et
                            </button>
                            <button
                                type="button"
                                onClick={handleProceedToSignature}
                                disabled={!canProceedToSignature()}
                                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Müştəri İmzasına Keç
                            </button>
                        </div>
                    </>
                )}

                {/* Step 2: Customer Signature */}
                {step === 'signature' && (
                    <>
                        {/* Terms & Conditions */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <button
                                type="button"
                                onClick={() => setShowTerms(!showTerms)}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <div className="flex items-center">
                                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <span className="text-sm font-medium text-gray-900">
                                        ŞƏRTLƏR VƏ VƏZİFƏLƏR
                                    </span>
                                </div>
                                <span className="text-sm text-blue-600">
                                    {showTerms ? 'Gizlət' : 'Göstər'}
                                </span>
                            </button>

                            {showTerms && (
                                <div className="mt-4 space-y-4">
                                    <div className="prose prose-sm max-w-none">
                                        <div className="whitespace-pre-line text-sm text-gray-700">
                                            {template.terms_and_conditions_az}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-2">
                                                ZƏDƏLƏNMƏ MƏSULİYYƏTİ
                                            </h4>
                                            <div className="whitespace-pre-line text-sm text-gray-700">
                                                {template.damage_liability_terms_az}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Terms Acceptance */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms-accepted"
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                            <label htmlFor="terms-accepted" className="ml-3 text-sm text-gray-700">
                                <span className="font-medium">Müştəri şərtləri oxudu və qəbul etdi</span>
                            </label>
                        </div>

                        {/* Customer Signature */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                MÜŞTƏRİ İMZA
                            </h3>
                            <div className="max-w-md mx-auto">
                                <SignaturePad
                                    onSave={handleCustomerSignature}
                                    title={`${customer.name} - İmza`}
                                    width={400}
                                    height={200}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setStep('checklist')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Geri
                            </button>
                            <button
                                type="button"
                                onClick={handleProceedToStaff}
                                disabled={!customerSignature || !termsAccepted}
                                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                İşçi Təsdiqi
                            </button>
                        </div>
                    </>
                )}

                {/* Step 3: Staff Confirmation */}
                {step === 'staff' && (
                    <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-green-900">
                                        Müqavilə Tamamlandı
                                    </h3>
                                    <p className="text-sm text-green-700">
                                        Müştəri müqaviləni imzaladı və şərtləri qəbul etdi
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-green-900">
                                <div className="flex justify-between">
                                    <span>Müştəri:</span>
                                    <span className="font-medium">{customer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Yoxlanılan sahələr:</span>
                                    <span className="font-medium">{Object.keys(checklistValues).length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Şəkillər:</span>
                                    <span className="font-medium">{photos.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>İmza:</span>
                                    <span className="font-medium text-green-600">✓ Təsdiqləndi</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                                <span className="font-medium">İşçi qeydi:</span> Bu müqaviləni təsdiqləməklə,
                                məhsulun göstərilən vəziyyətdə müştəriyə verilməsini təsdiq edirsiniz.
                                Müqavilə PDF olaraq saxlanılacaq və çap edilə bilər.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setStep('signature')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Geri
                            </button>
                            <button
                                type="button"
                                onClick={handleComplete}
                                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                Müqaviləni Təsdiqlə və Kirayəni Yarat
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
