import { Warehouse } from '@/types';

interface Props {
    warehouses: Warehouse[];
    value: string;
    onChange: (value: string) => void;
}

export default function WarehouseSelector({ warehouses, value, onChange }: Props) {
    return (
        <div className="bg-white shadow-sm rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Anbar seçin</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
                <option value="">Anbar seçin...</option>
                {warehouses.map(w => (
                    <option key={w.id} value={String(w.id)}>
                        {w.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

