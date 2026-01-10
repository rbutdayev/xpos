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
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500" />
          <label htmlFor="allow_negative_stock" className="text-sm text-gray-700">Mənfi stok icazəsi</label>
        </div>
      </div>
    </div>
  );
}

