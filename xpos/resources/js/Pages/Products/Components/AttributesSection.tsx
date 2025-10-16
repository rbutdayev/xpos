import InputLabel from '@/Components/InputLabel';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useState } from 'react';

interface AttributeKV { key: string; value: string }

interface Props {
  data: any;
  onChange: (field: string, value: any) => void;
}

export default function AttributesSection({ data, onChange }: Props) {
  const initialList: AttributeKV[] = Object.entries(data.attributes || {}).map(([k, v]) => ({ key: k, value: String(v) }));
  const [rows, setRows] = useState<AttributeKV[]>(initialList.length ? initialList : [{ key: '', value: '' }]);

  const syncToForm = (list: AttributeKV[]) => {
    const obj: Record<string, any> = {};
    list.filter(r => r.key.trim()).forEach(r => { obj[r.key.trim()] = r.value; });
    onChange('attributes', obj);
  };

  const updateRow = (idx: number, field: 'key' | 'value', value: string) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setRows(next);
    syncToForm(next);
  };

  const addRow = () => {
    const next = [...rows, { key: '', value: '' }];
    setRows(next);
  };

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next.length ? next : [{ key: '', value: '' }]);
    syncToForm(next);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Xüsusiyyətlər</h3>
      </div>
      <div className="p-6 space-y-4">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <InputLabel htmlFor={`attr_key_${idx}`} value="Açar" />
              <TextInput id={`attr_key_${idx}`} value={row.key} onChange={e => updateRow(idx, 'key', e.target.value)} className="mt-1 block w-full" />
            </div>
            <div className="md:col-span-3">
              <InputLabel htmlFor={`attr_val_${idx}`} value="Dəyər" />
              <TextInput id={`attr_val_${idx}`} value={row.value} onChange={e => updateRow(idx, 'value', e.target.value)} className="mt-1 block w-full" />
            </div>
            <div className="md:col-span-5 flex justify-end">
              <button type="button" onClick={() => removeRow(idx)} className="text-sm text-red-600 hover:text-red-800">Sil</button>
            </div>
          </div>
        ))}
        <div>
          <SecondaryButton type="button" onClick={addRow}>Xüsusiyyət əlavə et</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

