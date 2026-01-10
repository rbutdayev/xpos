import { CheckIcon } from '@heroicons/react/24/solid';

type Step = { key: string; label: string; icon?: React.ReactNode };

type Props = {
  steps: Step[];
  current: number;
  percent: number;
  onStepClick?: (idx: number) => void;
};

export default function ProgressIndicator({ steps, current, percent, onStepClick }: Props) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" aria-hidden="true" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-slate-700 transition-all duration-500 ease-out -z-10"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
          aria-hidden="true"
        />

        {/* Steps */}
        <div className="flex justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < current;
            const isCurrent = idx === current;
            const isPending = idx > current;

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => onStepClick?.(idx)}
                disabled={isPending}
                className="flex flex-col items-center group"
                aria-label={`Addım ${idx + 1}: ${step.label}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Circle indicator */}
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2
                    transition-all duration-300 transform
                    ${isCompleted
                      ? 'bg-slate-700 border-indigo-600 scale-100'
                      : isCurrent
                        ? 'bg-white border-indigo-600 scale-110 shadow-lg shadow-indigo-200'
                        : 'bg-white border-gray-300 scale-100'
                    }
                    ${!isPending ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`
                        text-sm font-semibold
                        ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}
                      `}
                    >
                      {idx + 1}
                    </span>
                  )}

                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`
                    mt-3 text-sm font-medium text-center max-w-[100px] transition-colors duration-200
                    ${isCurrent
                      ? 'text-indigo-700'
                      : isCompleted
                        ? 'text-gray-900 group-hover:text-indigo-600'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

