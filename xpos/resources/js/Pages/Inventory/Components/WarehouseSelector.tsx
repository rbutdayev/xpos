import { Warehouse } from '@/types';
import { BuildingStorefrontIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
    warehouses: Warehouse[];
    value: string;
    onChange: (value: string) => void;
}

export default function WarehouseSelector({ warehouses, value, onChange }: Props) {
    return (
        <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Anbar seçin</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {warehouses.map((warehouse) => {
                    const isSelected = String(warehouse.id) === value;
                    return (
                        <button
                            key={warehouse.id}
                            onClick={() => onChange(String(warehouse.id))}
                            className={`
                                relative p-6 rounded-xl border-2 transition-all duration-200 text-left
                                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3">
                                    <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                                </div>
                            )}
                            <div className="flex items-center space-x-3">
                                <div className={`
                                    p-3 rounded-lg
                                    ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                                `}>
                                    <BuildingStorefrontIcon className={`
                                        w-8 h-8
                                        ${isSelected ? 'text-blue-600' : 'text-gray-600'}
                                    `} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`
                                        text-base font-semibold truncate
                                        ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                                    `}>
                                        {warehouse.name}
                                    </h3>
                                    {warehouse.type && (
                                        <p className={`
                                            text-sm mt-1
                                            ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                                        `}>
                                            {warehouse.type}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            {warehouses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">Anbar tapılmadı</p>
                </div>
            )}
        </div>
    );
}

