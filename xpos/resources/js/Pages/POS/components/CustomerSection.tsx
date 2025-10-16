import React, { useEffect, useMemo } from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import CustomerSelect from '@/Components/CustomerSelect';
import VehicleSelect from '@/Components/VehicleSelect';
import TextInput from '@/Components/TextInput';
import { Branch, Customer, Vehicle } from '@/types';

interface Props {
  mode: 'sale' | 'service';
  customers: Customer[];
  vehicles: Vehicle[];
  branches: Branch[];
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  userBranchId?: number;
}

function CustomerSection({ mode, customers, vehicles, branches, formData, setFormData, errors, userBranchId }: Props) {
  const customerVehicles = useMemo(() => {
    if (!formData.customer_id) return [] as Vehicle[];
    return vehicles.filter((v) => v.customer_id?.toString() === formData.customer_id);
  }, [vehicles, formData.customer_id]);

  const isBranchFixed = !!userBranchId;
  const selectedBranch = branches.find(b => b.id.toString() === formData.branch_id);

  useEffect(() => {
    if (!formData.customer_id) {
      setFormData((prev: any) => ({ ...prev, vehicle_id: '' }));
    }
  }, [formData.customer_id, setFormData]);

  return (
    <div className="bg-white shadow-sm sm:rounded-lg mb-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Müştəri Məlumatları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputLabel htmlFor="customer_id" value="Müştəri" />
            <CustomerSelect
              customers={customers}
              value={formData.customer_id}
              onChange={(value) => setFormData((prev: any) => ({ ...prev, customer_id: value }))}
              className="mt-1 block w-full"
            />
            <InputError message={errors.customer_id} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="branch_id" value="Filial *" />
            {isBranchFixed ? (
              <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">
                <span className="text-gray-700">{selectedBranch?.name || 'Bilinməyən filial'}</span>
                <span className="ml-2 text-xs text-gray-500">(Təyin edilmiş filial)</span>
              </div>
            ) : (
              <select
                id="branch_id"
                value={formData.branch_id}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, branch_id: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Filial seçin</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
            <InputError message={errors.branch_id} className="mt-2" />
          </div>

          {/* Vehicle select - both modes allow vehicle link if customer selected */}
          {formData.customer_id && (
            <div>
              <InputLabel htmlFor="vehicle_id" value="Nəqliyyat Vasitəsi" />
              <VehicleSelect
                vehicles={customerVehicles}
                value={formData.vehicle_id}
                onChange={(value) => setFormData((prev: any) => ({ ...prev, vehicle_id: value }))}
                className="mt-1 block w-full"
                placeholder="Nəqliyyat vasitəsi seçin (ixtiyari)"
              />
              <InputError message={errors.vehicle_id} className="mt-2" />
            </div>
          )}

          {mode === 'service' && formData.vehicle_id && (
            <div className="mt-4">
              <InputLabel htmlFor="vehicle_mileage" value="Kilometraj" />
              <TextInput
                id="vehicle_mileage"
                type="number"
                value={formData.vehicle_mileage || ''}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    vehicle_mileage: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="mt-1 block w-full"
                placeholder="Cari kilometraj"
              />
              <InputError message={errors.vehicle_mileage} className="mt-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(CustomerSection);

