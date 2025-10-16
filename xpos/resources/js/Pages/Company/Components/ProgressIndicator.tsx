type Step = { key: string; label: string };

type Props = {
  steps: Step[];
  current: number;
  percent: number;
  onStepClick?: (idx: number) => void;
};

export default function ProgressIndicator({ steps, current, percent, onStepClick }: Props) {
  return (
    <div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-5 text-xs text-gray-600">
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onStepClick && onStepClick(i)}
            className={`truncate ${i === current ? 'text-indigo-700 font-medium' : 'hover:text-gray-900'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

