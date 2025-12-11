import { lazy, Suspense, useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ProgressIndicator from './Components/ProgressIndicator';
import WizardNavigation from './Components/WizardNavigation';
import { useWizardState } from './Hooks/useWizardState';
import { useStepValidation } from './Hooks/useStepValidation';
import { useSetupProgress } from './Hooks/useSetupProgress';
import { SetupWizardData } from './Utils/setupHelpers';

const CompanyBasicInfo = lazy(() => import('./Components/Steps/CompanyBasicInfo'));
const ContactInformation = lazy(() => import('./Components/Steps/ContactInformation'));
const SystemPreferences = lazy(() => import('./Components/Steps/SystemPreferences'));

type Props = {
  currencies: Array<{
    code: string;
    name: string;
    symbol: string;
    decimal_places: number;
    symbol_position: string;
  }>;
};

export default function SetupWizard({ currencies }: Props) {
  const steps = useMemo(
    () => [
      { key: 'company', label: 'Şirkət' },
      { key: 'contact', label: 'Əlaqə' },
      { key: 'system', label: 'Sistem' },
    ],
    []
  );

  const { currentStep, goNext, goPrev, goTo, total } = useWizardState(steps.length);
  const { percent } = useSetupProgress(currentStep, steps.length);

  const { data, setData, post, processing, errors } = useForm<SetupWizardData>({
    company_name: '',
    address: '',
    tax_number: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    currency_code: 'AZN',
    default_language: 'az',
    branch_name: '',
    branch_address: '',
    branch_phone: '',
    branch_email: '',
    warehouse_name: '',
    warehouse_type: 'main',
    warehouse_location: '',
  });

  const { validateStep, canProceed } = useStepValidation();
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  const onNext = () => {
    if (validateStep(currentStep, data)) goNext();
  };
  const onPrev = () => goPrev();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed(data)) return;
    post(route('setup.store'), {
      preserveScroll: true,
      onError: (errors) => {
        console.error('Setup submission failed:', errors);
      }
    });
  };

  const stepComponents = [
    CompanyBasicInfo,
    ContactInformation,
    SystemPreferences,
  ];

  const StepComponent = stepComponents[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Şirkət Quraşdırma" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <ProgressIndicator steps={steps} current={currentStep} percent={percent} onStepClick={goTo} />
        </div>

        <form onSubmit={onSubmit} className="bg-white shadow-sm rounded-xl p-6">
          <Suspense fallback={<div className="py-10 text-center text-gray-500">Yüklənir...</div>}>
            <StepComponent
              data={data}
              setData={setData}
              errors={errors as any}
              onValidationChange={currentStep === 0 ? setHasValidationErrors : undefined}
              currencies={currentStep === 0 ? currencies : undefined}
            />
          </Suspense>

          <div className="mt-8">
            <WizardNavigation
              canPrev={currentStep > 0}
              canNext={!hasValidationErrors && currentStep < total - 1}
              onPrev={onPrev}
              onNext={onNext}
              isLast={currentStep === total - 1}
              onSubmit={onSubmit}
              submitting={processing || hasValidationErrors}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

