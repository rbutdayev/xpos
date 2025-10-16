import { useCallback, useState } from 'react';

export const useWizardState = (count: number) => {
  const [currentStep, setCurrentStep] = useState(0);

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < count) setCurrentStep(idx);
  }, [count]);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, count - 1));
  }, [count]);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  return { currentStep, goTo, goNext, goPrev, total: count };
};

