import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import { Category } from '@/types';

interface Props {
  data: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  categories: Category[];
  onGenerateBarcode?: () => void;
  generatingBarcode?: boolean;
}

const SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '46', '48', '50'
];

const COLORS = [
  { name: 'Ağ (White)', code: '#FFFFFF' },
  { name: 'Qara (Black)', code: '#000000' },
  { name: 'Qırmızı (Red)', code: '#FF0000' },
  { name: 'Mavi (Blue)', code: '#0000FF' },
  { name: 'Yaşıl (Green)', code: '#008000' },
  { name: 'Sarı (Yellow)', code: '#FFFF00' },
  { name: 'Boz (Gray)', code: '#808080' },
  { name: 'Qəhvəyi (Brown)', code: '#8B4513' },
  { name: 'Narıncı (Orange)', code: '#FFA500' },
  { name: 'Çəhrayı (Pink)', code: '#FFC0CB' },
  { name: 'Bənövşəyi (Purple)', code: '#800080' },
  { name: 'Bej (Beige)', code: '#F5F5DC' },
  { name: 'Lacivert (Navy)', code: '#000080' },
  { name: 'Bordo (Burgundy)', code: '#800020' }
];

export default function BasicInfoSection({ data, errors, onChange, categories, onGenerateBarcode, generatingBarcode }: Props) {
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
        <h3 className="text-lg font-semibold text-gray-900">Əsas Məlumatlar</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <InputLabel htmlFor="name" value={data.type === 'service' ? 'Xidmət Adı *' : 'Məhsul Adı *'} />
          <TextInput id="name" type="text" value={data.name || ''} className="mt-1 block w-full" onChange={(e) => onChange('name', e.target.value)} required />
          <InputError message={errors.name} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="category_id" value="Kateqoriya" />
          <select id="category_id" value={data.category_id || ''} onChange={(e) => onChange('category_id', e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
            <option value="">Kateqoriya seç</option>
            {categories
              .filter((c) => c.is_service === (data.type === 'service'))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <InputError message={errors.category_id} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="type" value="Növ *" />
          <select id="type" value={data.type} onChange={(e) => onChange('type', e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm" required>
            <option value="product">Məhsul</option>
            <option value="service">Xidmət</option>
          </select>
          <InputError message={errors.type} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="sku" value="SKU" />
          <TextInput id="sku" type="text" value={data.sku || ''} className="mt-1 block w-full" onChange={(e) => onChange('sku', e.target.value)} placeholder="məs: PRD-12345" />
          <InputError message={errors.sku} className="mt-2" />
        </div>

        {data.type === 'product' && (
          <>
            <div>
              <InputLabel htmlFor="size" value="Ölçü (Size) *" />
              <select
                id="size"
                value={getAttr('size')}
                onChange={(e) => setAttr('size', e.target.value)}
                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                required
              >
                <option value="">Ölçü seçin</option>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <InputError message={errors['attributes.size']} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="color" value="Rəng (Color) *" />
              <select
                id="color"
                value={getAttr('color')}
                onChange={(e) => {
                  const selectedColor = COLORS.find(c => c.name === e.target.value);
                  const newAttributes = { ...(data.attributes || {}) };
                  if (e.target.value) {
                    newAttributes['color'] = e.target.value;
                    if (selectedColor) {
                      newAttributes['color_code'] = selectedColor.code;
                    }
                  } else {
                    delete newAttributes['color'];
                    delete newAttributes['color_code'];
                  }
                  onChange('attributes', newAttributes);
                }}
                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                required
              >
                <option value="">Rəng seçin</option>
                {COLORS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <InputError message={errors['attributes.color']} className="mt-2" />
            </div>
          </>
        )}

        <div className="md:col-span-3 flex items-end gap-3">
          <div className="flex-1">
            <InputLabel htmlFor="barcode" value="Barkod (EAN-13)" />
            <TextInput id="barcode" type="text" value={data.barcode || ''} className="mt-1 block w-full" onChange={(e) => onChange('barcode', e.target.value)} placeholder="13 rəqəmli barkod" />
            <InputError message={errors.barcode} className="mt-2" />
          </div>
          <div className="flex gap-2">
            {onGenerateBarcode && (
              <SecondaryButton type="button" onClick={onGenerateBarcode} disabled={generatingBarcode}>
                {generatingBarcode ? 'Yaradılır...' : 'Yarad'}
              </SecondaryButton>
            )}
            {data.barcode && (
              <SecondaryButton type="button" onClick={() => window.printBarcode && window.printBarcode(data.barcode, 'EAN-13')}>
                Çap et
              </SecondaryButton>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <InputLabel htmlFor="description" value="Təsvir" />
          <textarea id="description" value={data.description || ''} onChange={(e) => onChange('description', e.target.value)} rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          <InputError message={errors.description} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="brand" value="Marka" />
          <TextInput id="brand" type="text" value={data.brand || ''} className="mt-1 block w-full" onChange={(e) => onChange('brand', e.target.value)} />
          <InputError message={errors.brand} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="model" value="Model" />
          <TextInput id="model" type="text" value={data.model || ''} className="mt-1 block w-full" onChange={(e) => onChange('model', e.target.value)} />
          <InputError message={errors.model} className="mt-2" />
        </div>
      </div>
    </div>
  );
}

