import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

type Props = {
  canPrev: boolean;
  canNext: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
};

export default function WizardNavigation({ canPrev, canNext, isLast, onPrev, onNext, onSubmit, submitting }: Props) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      {/* Back button */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className={`
          inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 text-sm font-medium
          transition-all duration-200 transform
          ${canPrev
            ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-95'
            : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
          }
        `}
        aria-label="Əvvəlki addıma qayıt"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Geri</span>
      </button>

      {/* Progress hint */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
        <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono">Enter</kbd>
        <span>davam etmək üçün</span>
      </div>

      {/* Next/Submit button */}
      {isLast ? (
        <button
          type="submit"
          disabled={submitting}
          onClick={onSubmit}
          className={`
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold
            transition-all duration-200 transform shadow-lg
            ${submitting
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 hover:shadow-xl hover:scale-105 active:scale-95'
            }
          `}
          aria-label="Quraşdırmanı tamamla"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Quraşdırılır...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              <span>Quraşdırmanı tamamla</span>
              <CheckCircleIcon className="w-5 h-5" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold
            transition-all duration-200 transform shadow-md
            ${canNext
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 hover:shadow-lg hover:scale-105 active:scale-95'
              : 'bg-gray-400 text-white cursor-not-allowed opacity-50'
            }
          `}
          aria-label="Növbəti addıma keç"
        >
          <span>Növbəti</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

