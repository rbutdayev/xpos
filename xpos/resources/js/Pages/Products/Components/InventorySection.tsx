import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { Warehouse } from '@/types';

interface Props {
  mode: 'create' | 'edit';
  data: any;
  errors: Record<string, string>;
  warehouses: Warehouse[];
  onChange: (field: string, value: any) => void;
}

export default function InventorySection({ mode, data, errors, warehouses, onChange }: Props) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Stok və Anbar</h3>
      </div>
      <div className="p-6 space-y-6">
        {/* allow negative stock */}
        <div className="flex items-center gap-3">
          <input id="allow_negative_stock" type="checkbox" checked={!!data.allow_negative_stock}
            onChange={(e) => onChange('allow_negative_stock', e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
          <label htmlFor="allow_negative_stock" className="text-sm text-gray-700">Mənfi stok icazəsi</label>
        </div>

        {/* Initial stock inputs for create mode */}
        {mode === 'create' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Başlanğıc stok (seçimə bağlı)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((w) => (
                <div key={w.id} className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-3">{w.name}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <InputLabel htmlFor={`initial_${w.id}`} value="Miqdar" />
                      <TextInput id={`initial_${w.id}`} type="number" step="0.01"
                        value={data.initial_stock?.[w.id] || ''} className="mt-1 block w-full"
                        onChange={(e) => onChange('initial_stock', { ...data.initial_stock, [w.id]: e.target.value })} />
                    </div>
                    <div>
                      <InputLabel htmlFor={`min_${w.id}`} value="Minimum səviyyə" />
                      <TextInput id={`min_${w.id}`} type="number" step="0.01"
                        value={data.min_levels?.[w.id] || ''} className="mt-1 block w-full"
                        onChange={(e) => onChange('min_levels', { ...data.min_levels, [w.id]: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.initial_stock && <InputError message={errors.initial_stock} className="mt-2" />}
      </div>
    </div>
  );
}

