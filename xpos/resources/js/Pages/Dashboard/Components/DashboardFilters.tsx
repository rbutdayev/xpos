import { router, usePage } from '@inertiajs/react';
import SearchableWarehouseSelect from '@/Components/SearchableWarehouseSelect';

interface DashboardFiltersProps {
    timeRange: string;
    warehouse?: { id: number; name: string } | null;
    onChange: (filters: { timeRange: string; warehouse?: any }) => void;
}

export default function DashboardFilters({ 
    timeRange, 
    warehouse, 
    onChange 
}: DashboardFiltersProps) {
    const { warehouses, auth } = usePage().props as any;
    const user = auth.user;
    
    const timeRanges = [
        { value: '1day', label: 'Bugün' },
        { value: '7days', label: 'Son 7 gün' },
        { value: '30days', label: 'Son 30 gün' },
        { value: '90days', label: 'Son 90 gün' }
    ];

    const handleWarehouseChange = (warehouseId: string | number) => {
        const warehouseIdToSend = warehouseId ? parseInt(warehouseId.toString(), 10) : null;
        router.post('/set-warehouse', { warehouse_id: warehouseIdToSend }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Filtrlər</h3>
                
                <div className="flex items-center space-x-4">
                    {/* Time Range Filter */}
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Müddət:</label>
                        <select
                            value={timeRange}
                            onChange={(e) => onChange({ timeRange: e.target.value, warehouse })}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {timeRanges.map(range => (
                                <option key={range.value} value={range.value}>
                                    {range.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Warehouse Selector - Only for non-salesmen */}
                    {user.role !== 'sales_staff' && warehouses && warehouses.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Anbar:</label>
                            <SearchableWarehouseSelect
                                warehouses={warehouses}
                                value={warehouse?.id?.toString() || ''}
                                onChange={handleWarehouseChange}
                                placeholder="Bütün anbarlar"
                                required={false}
                                className="text-sm min-w-[160px]"
                            />
                        </div>
                    )}

                    {/* Warehouse Info for salesmen or when no warehouses */}
                    {(user.role === 'sales_staff' || !warehouses || warehouses.length === 0) && (
                        <div className="flex items-center text-sm text-gray-600">
                            {warehouse ? (
                                <span>Anbar: <strong>{warehouse.name}</strong></span>
                            ) : (
                                <span>Anbar: <strong>Bütün anbarlar</strong></span>
                            )}
                        </div>
                    )}

                    {/* Refresh Button */}
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
                    >
                        Yenilə
                    </button>
                </div>
            </div>
        </div>
    );
}