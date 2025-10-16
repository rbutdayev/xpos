import { SetupWizardData } from './setupHelpers';

export const required = (v?: string) => !!(v && v.trim());

export const stepRules: Record<number, (d: SetupWizardData) => boolean> = {
  0: (d) => required(d.company_name),
  1: (d) => required(d.branch_name),
  4: (d) => required(d.warehouse_name),
};

export const validateForSubmit = (d: SetupWizardData) =>
  required(d.company_name) && required(d.branch_name) && required(d.warehouse_name);

