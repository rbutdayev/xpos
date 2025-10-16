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

export default function CompanyBasicInfo({ data, setData, errors }: Props) {
  return (
    <WizardStep title="Şirkət məlumatları" description="Əsas şirkət məlumatlarını daxil edin.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputLabel htmlFor="company_name" value="Şirkət adı *" />
          <TextInput id="company_name" value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.company_name} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="tax_number" value="VOEN" />
          <TextInput id="tax_number" value={data.tax_number} onChange={(e) => setData('tax_number', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.tax_number} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="address" value="Ünvan" />
          <TextInput id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.address} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="phone" value="Telefon" />
          <TextInput id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.phone} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="email" value="E-poçt" />
          <TextInput id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.email} className="mt-1" />
        </div>
        <div>
          <InputLabel htmlFor="website" value="Veb sayt" />
          <TextInput id="website" value={data.website} onChange={(e) => setData('website', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.website} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <InputLabel htmlFor="description" value="Təsvir" />
          <TextInput id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 w-full" />
          <InputError message={errors.description} className="mt-1" />
        </div>
      </div>
    </WizardStep>
  );
}
