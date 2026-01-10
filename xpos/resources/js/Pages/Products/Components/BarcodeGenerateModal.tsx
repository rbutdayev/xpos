import { useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Product } from '@/types';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Props {
  show: boolean;
  product: Product;
  variantCount: number;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

export default function BarcodeGenerateModal({ show, product, variantCount, onClose, onSuccess }: Props) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setError(null);
    setCompleted(false);

    try {
      // Simulate progress (in real app, use websocket or polling)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await (window as any).axios.post(
        route('products.variants.generate-barcodes', product.id)
      );

      clearInterval(progressInterval);
      setProgress(100);
      setCompleted(true);
      setGeneratedCount(response.data.generated_count || variantCount);

      // Auto-close after success
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response.data.generated_count || variantCount);
        }
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Barkod yaradılarkən xəta baş verdi');
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setProgress(0);
    setCompleted(false);
    setError(null);
    setGeneratedCount(0);
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} maxWidth="md">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Barkodları Avtomatik Yarat
          </h3>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{product.name}</span> məhsulu üçün{' '}
            <span className="font-medium text-indigo-600">{variantCount} variant</span>a avtomatik
            barkod yaradılacaq.
          </p>
        </div>

        {/* Progress Bar */}
        {generating && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Yaradılır...</span>
              <span className="font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-slate-700 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {completed && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Uğurla tamamlandı!
                </p>
                <p className="text-sm text-green-700">
                  {generatedCount} variant üçün barkod yaradıldı
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Info Box */}
        {!generating && !completed && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Qeyd:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Yalnız barkodsuz variantlar üçün barkod yaradılacaq</li>
              <li>Barkodlar EAN-13 formatında olacaq</li>
              <li>Təkrar barkod yaranması qarşısı alınacaq</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={handleClose} disabled={generating}>
            {completed ? 'Bağla' : 'Ləğv et'}
          </SecondaryButton>
          {!completed && (
            <PrimaryButton onClick={handleGenerate} disabled={generating}>
              {generating ? 'Yaradılır...' : 'Barkod Yarat'}
            </PrimaryButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
