import WizardStep from '../WizardStep';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { SetupWizardData } from '../../Utils/setupHelpers';

type Props = {
  data: SetupWizardData;
  setData: (key: keyof SetupWizardData, value: any) => void;
  errors: Record<string, string>;
};

export default function SystemPreferences({ data, setData, errors }: Props) {
  return (
    <WizardStep title="Sistem parametrləri" description="Anbar və sistem parametrləri.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputLabel htmlFor="warehouse_name" value="Anbar adı *" />
          <TextInput id="warehouse_name" value={data.warehouse_name} onChange={(e) => setData('warehouse_name', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.warehouse_name} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="warehouse_type" value="Anbar tipi" />
          <TextInput id="warehouse_type" value={data.warehouse_type} onChange={(e) => setData('warehouse_type', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.warehouse_type} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <InputLabel htmlFor="warehouse_location" value="Anbar ünvanı" />
          <TextInput id="warehouse_location" value={data.warehouse_location} onChange={(e) => setData('warehouse_location', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.warehouse_location} className="mt-1" />
        </div>
      </div>
    </WizardStep>
  );
}
