import React from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { User } from '@/types';

interface Props {
  canEditDateTime: boolean;
  employees: User[];
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
}

function ServiceSection({ canEditDateTime, employees, formData, setFormData, errors }: Props) {
  return (
    <div className="bg-white shadow-sm sm:rounded-lg mb-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Servis Təfərrüatları</h3>
        <div className="space-y-4">
          <div>
            <InputLabel htmlFor="description" value="Açıqlama *" />
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              rows={3}
              placeholder="Görüləcək işin təfərrüatları"
              required
            />
            <InputError message={errors.description} className="mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputLabel htmlFor="labor_cost" value="İşçilik (AZN)" />
              <TextInput
                id="labor_cost"
                type="number"
                step="0.01"
                value={formData.labor_cost}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, labor_cost: parseFloat(e.target.value) || 0 }))}
                className="mt-1 block w-full"
              />
              <InputError message={errors.labor_cost} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="employee_id" value="Məsul Şəxs" />
              <select
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, employee_id: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Seçin</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <InputError message={errors.employee_id} className="mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InputLabel htmlFor="service_date" value="Servis Tarixi" />
              <TextInput
                id="service_date"
                type="date"
                value={formData.service_date}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, service_date: e.target.value }))}
                className="mt-1 block w-full"
                disabled={!canEditDateTime}
              />
              <InputError message={errors.service_date} className="mt-2" />
            </div>

            <div>
              <InputLabel htmlFor="service_time" value="Servis Saatı" />
              <TextInput
                id="service_time"
                type="time"
                value={formData.service_time}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, service_time: e.target.value }))}
                className="mt-1 block w-full"
                disabled={!canEditDateTime}
              />
              <InputError message={errors.service_time} className="mt-2" />
            </div>
          </div>

          <div>
            <InputLabel htmlFor="status" value="Status" />
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="pending">Gözləyir</option>
              <option value="in_progress">Davam edir</option>
              <option value="completed">Tamamlandı</option>
            </select>
            <InputError message={errors.status} className="mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ServiceSection);

