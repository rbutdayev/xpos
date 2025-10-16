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

export default function ContactInformation({ data, setData, errors }: Props) {
  return (
    <WizardStep title="Filial məlumatları" description="İlk filial və əlaqə məlumatları.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputLabel htmlFor="branch_name" value="Filial adı *" />
          <TextInput id="branch_name" value={data.branch_name} onChange={(e) => setData('branch_name', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.branch_name} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="branch_address" value="Filial ünvanı" />
          <TextInput id="branch_address" value={data.branch_address} onChange={(e) => setData('branch_address', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.branch_address} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="branch_phone" value="Filial telefonu" />
          <TextInput id="branch_phone" value={data.branch_phone} onChange={(e) => setData('branch_phone', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.branch_phone} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="branch_email" value="Filial e-poçtu" />
          <TextInput id="branch_email" type="email" value={data.branch_email} onChange={(e) => setData('branch_email', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.branch_email} className="mt-1" />
        </div>
      </div>
    </WizardStep>
  );
}
