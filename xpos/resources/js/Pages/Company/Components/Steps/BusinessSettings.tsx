import WizardStep from '../WizardStep';

export default function BusinessSettings() {
  return (
    <WizardStep title="Biznes parametrləri" description="Əsas iş qaydaları.">
      <div className="grid grid-cols-1 gap-6">
        <p className="text-sm text-gray-600">
          Stok idarəetməsi məhsul səviyyəsində tənzimlənir.
        </p>
      </div>
    </WizardStep>
  );
}
