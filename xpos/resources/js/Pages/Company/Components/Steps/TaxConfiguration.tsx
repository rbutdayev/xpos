import WizardStep from '../WizardStep';

export default function TaxConfiguration() {
  return (
    <WizardStep title="Vergi parametrləri" description="Vergi ilə bağlı tənzimləmələr.">
      <div className="grid grid-cols-1 gap-6">
        <p className="text-sm text-gray-600">
          VOEN məlumatları əsas şirkət məlumatlarında daxil edilmişdir.
        </p>
      </div>
    </WizardStep>
  );
}
