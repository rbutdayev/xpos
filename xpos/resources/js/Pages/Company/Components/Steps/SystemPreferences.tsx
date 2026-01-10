import WizardStep from '../WizardStep';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { SetupWizardData } from '../../Utils/setupHelpers';
import { BuildingOffice2Icon, MapPinIcon, TagIcon } from '@heroicons/react/24/outline';

type Props = {
  data: SetupWizardData;
  setData: (key: keyof SetupWizardData, value: any) => void;
  errors: Record<string, string>;
};

export default function SystemPreferences({ data, setData, errors }: Props) {
  // Auto-set warehouse type to 'main' if not already set
  if (!data.warehouse_type || data.warehouse_type !== 'main') {
    setData('warehouse_type', 'main');
  }

  return (
    <WizardStep
      title="Sistem parametrləri"
      description="İnventarizasiya idarəetməsi üçün anbar konfiqurasiyası"
    >
      {/* Info banner */}
      <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg mb-6">
        <div className="flex items-start">
          <BuildingOffice2Icon className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-purple-900 mb-1">İlk anbarınız</h4>
            <p className="text-xs text-purple-700">
              Məhsul stokunu izləmək və inventarizasiyanı idarə etmək üçün ən azı bir anbar tələb olunur
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Warehouse Name */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <BuildingOffice2Icon className="w-4 h-4 text-gray-500" />
              <InputLabel htmlFor="warehouse_name" value="Anbar adı" />
              <span className="text-red-500 text-sm">*</span>
            </div>
            <TextInput
              id="warehouse_name"
              value={data.warehouse_name}
              onChange={(e) => setData('warehouse_name', e.target.value)}
              className="mt-1 w-full"
              placeholder="Məsələn: Mərkəzi Anbar, Baki Anbarı"
              autoFocus
            />
            <InputError message={errors.warehouse_name} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500">
              Anbarınızı sistemdə tanıya biləcəyiniz unikal ad
            </p>
          </div>

          {/* Warehouse Type - Auto-set to "Əsas anbar" (main) */}
          <input type="hidden" name="warehouse_type" value="main" />
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-slate-700 rounded-lg">
                <BuildingOffice2Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-indigo-900">Anbar tipi:</span>
                  <span className="text-sm text-indigo-700">Əsas anbar</span>
                </div>
                <p className="text-xs text-indigo-600 mt-0.5">
                  İlk anbar avtomatik olaraq əsas anbar kimi təyin edilir
                </p>
              </div>
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <InputError message={errors.warehouse_type} className="mt-1" />
          </div>

          {/* Warehouse Location */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              <InputLabel htmlFor="warehouse_location" value="Anbar ünvanı" />
            </div>
            <TextInput
              id="warehouse_location"
              value={data.warehouse_location}
              onChange={(e) => setData('warehouse_location', e.target.value)}
              className="mt-1 w-full"
              placeholder="Anbarın fiziki ünvanı"
            />
            <InputError message={errors.warehouse_location} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500">
              Anbarın fiziki yeri (məcburi deyil, ancaq təvsiyə olunur)
            </p>
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Son addım!</h4>
              <p className="text-xs text-gray-700 leading-relaxed mb-3">
                Quraşdırmanı tamamladıqdan sonra sistemə daxil olacaqsınız və aşağıdakıları edə biləcəksiniz:
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Məhsul və xidmətlərinizi əlavə edin
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Müştəri və təchizatçı məlumatlarını idarə edin
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Satış və alışları qeyd edin
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Hesabatları izləyin və analiz edin
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
