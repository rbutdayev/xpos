import { SetupWizardData } from '../Utils/setupHelpers';

export const useStepValidation = () => {
  const validateStep = (step: number, data: SetupWizardData) => {
    // Minimal, business-aligned rules to match original submit checks
    if (step === 0 && !data.company_name?.trim()) {
      alert('Şirkət adı tələb olunur');
      return false;
    }
    if (step === 1 && !data.branch_name?.trim()) {
      alert('Filial adı tələb olunur');
      return false;
    }
    if (step === 2 && !data.warehouse_name?.trim()) {
      alert('Anbar adı tələb olunur');
      return false;
    }
    return true;
  };

  const canProceed = (data: SetupWizardData) => {
    if (!data.company_name?.trim()) return false;
    if (!data.branch_name?.trim()) return false;
    if (!data.warehouse_name?.trim()) return false;
    return true;
  };

  return { validateStep, canProceed };
};

