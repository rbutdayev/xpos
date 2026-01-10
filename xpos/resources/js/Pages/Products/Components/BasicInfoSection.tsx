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
          <InputLabel htmlFor="name" value="Məhsul Adı *" />
          <TextInput id="name" type="text" value={data.name || ''} className="mt-1 block w-full" onChange={(e) => onChange('name', e.target.value)} required />
          <InputError message={errors.name} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="category_id" value="Kateqoriya" />
          <select id="category_id" value={data.category_id || ''} onChange={(e) => onChange('category_id', e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm">
            <option value="">Kateqoriya seç</option>
            {categories
              .filter((c) => !c.is_service)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <InputError message={errors.category_id} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="unit" value="Ölçü vahidi *" />
          <select
            id="unit"
            value={data.unit || 'ədəd'}
            onChange={(e) => onChange('unit', e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
            required
          >
            <option value="ədəd">ədəd (piece)</option>
            <option value="kq">kq (kg)</option>
            <option value="qr">qr (gram)</option>
            <option value="litr">litr (liter)</option>
            <option value="ml">ml (milliliter)</option>
            <option value="metr">metr (meter)</option>
            <option value="sm">sm (cm)</option>
            <option value="paket">paket (package)</option>
            <option value="qutu">qutu (box)</option>
            <option value="səbət">səbət (basket)</option>
            <option value="dəst">dəst (set)</option>
            <option value="cüt">cüt (pair)</option>
          </select>
          <InputError message={errors.unit} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="sku" value="SKU" />
          <TextInput id="sku" type="text" value={data.sku || ''} className="mt-1 block w-full" onChange={(e) => onChange('sku', e.target.value)} placeholder="məs: PRD-12345" />
          <InputError message={errors.sku} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="size" value="Ölçü (Size)" />
          <TextInput
            id="size"
            type="text"
            value={getAttr('size')}
            className="mt-1 block w-full"
            onChange={(e) => setAttr('size', e.target.value)}
            placeholder="məs: M, L, 42, və s."
          />
          <InputError message={errors['attributes.size']} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="color" value="Rəng (Color)" />
          <TextInput
            id="color"
            type="text"
            value={getAttr('color')}
            className="mt-1 block w-full"
            onChange={(e) => setAttr('color', e.target.value)}
            placeholder="məs: Qırmızı, Mavi, və s."
          />
          <InputError message={errors['attributes.color']} className="mt-2" />
        </div>

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
              <SecondaryButton type="button" onClick={() => {
                // For unsaved products, use direct barcode printing
                const printUrl = route('barcodes.print-direct', { 
                  barcode: data.barcode,
                  name: data.name || 'Məhsul',
                  type: 'EAN13',
                  autoprint: '1'
                });
                window.open(printUrl, '_blank');
              }}>
                Çap et
              </SecondaryButton>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <InputLabel htmlFor="description" value="Təsvir" />
          <textarea id="description" value={data.description || ''} onChange={(e) => onChange('description', e.target.value)} rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500" />
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

