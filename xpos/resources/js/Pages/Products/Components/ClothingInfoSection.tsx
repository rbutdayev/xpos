import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Props {
  data: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

// Common clothing attributes for retail
const MATERIALS = [
  'Pambıq (Cotton)',
  'Poliester (Polyester)',
  'İpək (Silk)',
  'Yun (Wool)',
  'Kətan (Linen)',
  'Dəri (Leather)',
  'Kaşmir (Cashmere)',
  'Viskoz (Viscose)',
  'Qarışıq (Mixed)',
  'Digər (Other)'
];

const SEASONS = [
  'Yay (Summer)',
  'Qış (Winter)',
  'Payız (Autumn)',
  'Yaz (Spring)',
  'Bütün mövsüm (All Season)'
];

const GENDERS = [
  'Kişi (Men)',
  'Qadın (Women)',
  'Unisex',
  'Uşaq (Kids)',
  'Oğlan (Boys)',
  'Qız (Girls)'
];

const STYLES = [
  'Casual',
  'Formal',
  'İdman (Sport)',
  'İş (Business)',
  'Gecə (Evening)',
  'Gündəlik (Daily)',
  'Digər (Other)'
];

export default function ClothingInfoSection({ data, errors, onChange }: Props) {
  // Get clothing attributes from the attributes object
  const getAttr = (key: string) => data.attributes?.[key] || '';

  // Update a specific attribute in the attributes object
  const setAttr = (key: string, value: string) => {
    const newAttributes = { ...(data.attributes || {}) };
    if (value) {
      newAttributes[key] = value;
    } else {
      delete newAttributes[key];
    }
    onChange('attributes', newAttributes);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Geyim Məlumatları</h3>
        <p className="text-sm text-gray-500 mt-1">Geyim məhsulları üçün əlavə məlumatlar</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Material */}
        <div>
          <InputLabel htmlFor="material" value="Material" />
          <select
            id="material"
            value={getAttr('material')}
            onChange={(e) => setAttr('material', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
          >
            <option value="">Material seçin</option>
            {MATERIALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <InputError message={errors['attributes.material']} className="mt-2" />
        </div>

        {/* Season */}
        <div>
          <InputLabel htmlFor="season" value="Mövsüm" />
          <select
            id="season"
            value={getAttr('season')}
            onChange={(e) => setAttr('season', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
          >
            <option value="">Mövsüm seçin</option>
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <InputError message={errors['attributes.season']} className="mt-2" />
        </div>

        {/* Gender */}
        <div>
          <InputLabel htmlFor="gender" value="Cins" />
          <select
            id="gender"
            value={getAttr('gender')}
            onChange={(e) => setAttr('gender', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
          >
            <option value="">Cins seçin</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <InputError message={errors['attributes.gender']} className="mt-2" />
        </div>

        {/* Style */}
        <div>
          <InputLabel htmlFor="style" value="Stil" />
          <select
            id="style"
            value={getAttr('style')}
            onChange={(e) => setAttr('style', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
          >
            <option value="">Stil seçin</option>
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <InputError message={errors['attributes.style']} className="mt-2" />
        </div>

        {/* Collection */}
        <div>
          <InputLabel htmlFor="collection" value="Kolleksiya" />
          <TextInput
            id="collection"
            type="text"
            value={getAttr('collection')}
            className="mt-1 block w-full"
            onChange={(e) => setAttr('collection', e.target.value)}
            placeholder="məs: Yay 2025"
          />
          <InputError message={errors['attributes.collection']} className="mt-2" />
        </div>

        {/* Country of Origin */}
        <div>
          <InputLabel htmlFor="country_of_origin" value="İstehsal ölkəsi" />
          <TextInput
            id="country_of_origin"
            type="text"
            value={getAttr('country_of_origin')}
            className="mt-1 block w-full"
            onChange={(e) => setAttr('country_of_origin', e.target.value)}
            placeholder="məs: Türkiyə"
          />
          <InputError message={errors['attributes.country_of_origin']} className="mt-2" />
        </div>

        {/* Care Instructions */}
        <div className="md:col-span-3">
          <InputLabel htmlFor="care_instructions" value="Təmizlik təlimatları" />
          <textarea
            id="care_instructions"
            value={getAttr('care_instructions')}
            onChange={(e) => setAttr('care_instructions', e.target.value)}
            rows={2}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
            placeholder="məs: 30°C-də yuma, ütüləmək olmaz"
          />
          <InputError message={errors['attributes.care_instructions']} className="mt-2" />
        </div>

        {/* Additional Notes */}
        <div className="md:col-span-3">
          <InputLabel htmlFor="additional_notes" value="Əlavə qeydlər" />
          <textarea
            id="additional_notes"
            value={getAttr('additional_notes')}
            onChange={(e) => setAttr('additional_notes', e.target.value)}
            rows={2}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
            placeholder="Məhsul haqqında əlavə məlumat"
          />
          <InputError message={errors['attributes.additional_notes']} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
