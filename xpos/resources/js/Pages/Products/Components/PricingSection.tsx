import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Props {
  data: any;
  errors: Record<string, string>;
  calculations: { profit: number; margin: number };
  onChange: (field: string, value: any) => void;
}

export default function PricingSection({ data, errors, calculations, onChange }: Props) {
  const formatAZN = (n: number) => (isFinite(n) ? `${n.toLocaleString('az-AZ')} ₼` : '-');
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Qiymətlər</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.type === 'product' && (
          <div>
            <InputLabel htmlFor="purchase_price" value="Alış Qiyməti (AZN) *" />
            <TextInput id="purchase_price" type="number" step="0.01" value={data.purchase_price || ''} className="mt-1 block w-full"
              onChange={(e) => onChange('purchase_price', e.target.value)} />
            <InputError message={errors.purchase_price} className="mt-2" />
          </div>
        )}

        <div>
          <InputLabel htmlFor="sale_price" value={data.type === 'product' ? 'Satış Qiyməti (AZN) *' : 'Xidmət haqqı (AZN) *'} />
          <TextInput id="sale_price" type="number" step="0.01" value={data.sale_price || ''} className="mt-1 block w-full"
            onChange={(e) => onChange('sale_price', e.target.value)} />
          <InputError message={errors.sale_price} className="mt-2" />
        </div>

        {data.type === 'product' && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Mənfəət</div>
              <div className="text-lg font-semibold text-gray-900">{formatAZN(calculations.profit)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Marja</div>
              <div className="text-lg font-semibold text-blue-600">{isFinite(calculations.margin) ? `${calculations.margin.toFixed(1)}%` : '-'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

