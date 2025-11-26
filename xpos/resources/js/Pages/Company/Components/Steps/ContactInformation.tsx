import WizardStep from '../WizardStep';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { SetupWizardData } from '../../Utils/setupHelpers';
import { BuildingStorefrontIcon, MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

type Props = {
  data: SetupWizardData;
  setData: (key: keyof SetupWizardData, value: any) => void;
  errors: Record<string, string>;
};

export default function ContactInformation({ data, setData, errors }: Props) {
  return (
    <WizardStep
      title="Filial məlumatları"
      description="İlk filialınızı yaradın və satış nöqtənizi təyin edin"
    >
      {/* Info banner */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg mb-6">
        <div className="flex items-start">
          <BuildingStorefrontIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">İlk filialınız</h4>
            <p className="text-xs text-blue-700">
              Hər şirkətin ən azı bir filialı olmalıdır. Sonradan əlavə filiallar əlavə edə bilərsiniz.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Branch Name */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <BuildingStorefrontIcon className="w-4 h-4 text-gray-500" />
              <InputLabel htmlFor="branch_name" value="Filial adı" />
              <span className="text-red-500 text-sm">*</span>
            </div>
            <TextInput
              id="branch_name"
              value={data.branch_name}
              onChange={(e) => setData('branch_name', e.target.value)}
              className="mt-1 w-full"
              placeholder="Məsələn: Mərkəzi Ofis, 28 May filialı"
              autoFocus
            />
            <InputError message={errors.branch_name} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500">
              Bu filialı digərlərindən fərqləndirəcək unikal ad
            </p>
          </div>

          {/* Branch Address */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              <InputLabel htmlFor="branch_address" value="Filial ünvanı" />
            </div>
            <TextInput
              id="branch_address"
              value={data.branch_address}
              onChange={(e) => setData('branch_address', e.target.value)}
              className="mt-1 w-full"
              placeholder="Tam ünvan: şəhər, rayon, küçə, bina"
            />
            <InputError message={errors.branch_address} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500">
              Müştərilərinizin filialınızı asanlıqla tapa bilməsi üçün dəqiq ünvan
            </p>
          </div>

          {/* Branch Phone */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PhoneIcon className="w-4 h-4 text-gray-500" />
              <InputLabel htmlFor="branch_phone" value="Filial telefonu" />
            </div>
            <TextInput
              id="branch_phone"
              value={data.branch_phone}
              onChange={(e) => setData('branch_phone', e.target.value)}
              className="mt-1 w-full"
              placeholder="+994 XX XXX XX XX"
              type="tel"
            />
            <InputError message={errors.branch_phone} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500">
              Filialın birbaşa əlaqə nömrəsi
            </p>
          </div>

          {/* Branch Email */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <EnvelopeIcon className="w-4 h-4 text-gray-500" />
              <InputLabel htmlFor="branch_email" value="Filial e-poçtu" />
            </div>
            <TextInput
              id="branch_email"
              type="email"
              value={data.branch_email}
              onChange={(e) => setData('branch_email', e.target.value)}
              className="mt-1 w-full"
              placeholder="branch@company.az"
            />
            <InputError message={errors.branch_email} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500">
              Filial üçün xüsusi e-poçt ünvanı (məcburi deyil)
            </p>
          </div>
        </div>

        {/* Quick tip */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-gray-700">
              <strong className="font-semibold">Məsləhət:</strong> Bir neçə filialınız varsa, baş ofisinizi və ya ən aktiv satış nöqtənizi seçin. Digər filialları sonra Parametrlər bölməsindən əlavə edə bilərsiniz.
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
