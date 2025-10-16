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
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className={`px-4 py-2 rounded-lg border text-sm ${canPrev ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
      >
        Geri
      </button>

      {isLast ? (
        <button
          type="submit"
          disabled={submitting}
          onClick={onSubmit}
          className={`px-5 py-2 rounded-lg text-white text-sm ${submitting ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {submitting ? 'Quraşdırılır...' : 'Quraşdırmanı tamamla'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`px-5 py-2 rounded-lg text-white text-sm ${canNext ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Növbəti
        </button>
      )}
    </div>
  );
}

