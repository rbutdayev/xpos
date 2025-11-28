import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Warehouse } from '@/types';
import WarehouseSelector from './Components/WarehouseSelector';
import InventoryDashboard from './Components/InventoryDashboard';
import InventoryNavigation from '@/Components/InventoryNavigation';
import { useState } from 'react';

interface Props { warehouses: Warehouse[]; selectedWarehouse?: number | null; }

export default function Index({ warehouses, selectedWarehouse }: Props) {
    const [warehouseId, setWarehouseId] = useState<string>(selectedWarehouse ? String(selectedWarehouse) : '');

    const goToWarehouse = (id: string) => {
        if (!id) return;
        router.get(route('inventory.warehouse', Number(id)), {}, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="İnventar" />
            <div className="mx-auto sm:px-6 lg:px-8 space-y-6">
                {/* Enterprise Navigation Menu */}
                <InventoryNavigation currentRoute="inventory" />
                <WarehouseSelector warehouses={warehouses} value={warehouseId} onChange={(v) => { setWarehouseId(v); goToWarehouse(v); }} />
                <InventoryDashboard selectedWarehouse={warehouses.find(w => String(w.id) === warehouseId) || null} />
            </div>
        </AuthenticatedLayout>
    );
}
