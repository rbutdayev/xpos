import { memo } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import CustomerSelect from '@/Components/CustomerSelect';
import VehicleSelect from '@/Components/VehicleSelect';
import { Customer, Vehicle, Branch } from '@/types';
import { useCustomerVehicles } from '../Hooks/useCustomerVehicles';

interface BasicInformationSectionProps {
    data: {
        customer_id: string;
        vehicle_id: string;
        vehicle_mileage?: number;
        branch_id: string;
        service_date: string;
        description: string;
        status: string;
        estimated_completion?: string;
    };
    errors: Record<string, string>;
    onDataChange: (field: string, value: string | number) => void;
    customers: Customer[];
    vehicles: Vehicle[];
    branches: Branch[];
    processing?: boolean;
}

export const BasicInformationSection = memo(({
    data,
    errors,
    onDataChange,
    customers,
    vehicles,
    branches,
    processing = false
}: BasicInformationSectionProps) => {
    const { customerVehicles } = useCustomerVehicles(vehicles, data.customer_id, data.vehicle_id);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <InputLabel htmlFor="customer_id" value="Müştəri *" />
                    <CustomerSelect
                        customers={customers}
                        value={data.customer_id}
                        onChange={(value) => {
                            onDataChange('customer_id', value);
                            // Clear vehicle when customer changes
                            if (data.vehicle_id) {
                                onDataChange('vehicle_id', '');
                                onDataChange('vehicle_mileage', '');
                            }
                        }}
                        disabled={processing}
                        className="mt-1"
                    />
                    <InputError message={errors.customer_id} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="vehicle_id" value="Avtomobil" />
                    <VehicleSelect
                        vehicles={customerVehicles}
                        value={data.vehicle_id}
                        onChange={(value) => onDataChange('vehicle_id', value)}
                        disabled={processing || !data.customer_id}
                        className="mt-1"
                        placeholder={!data.customer_id ? "Əvvəlcə müştəri seçin" : "Avtomobil seçin"}
                    />
                    <InputError message={errors.vehicle_id} className="mt-2" />
                </div>
            </div>

            {data.vehicle_id && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputLabel htmlFor="vehicle_mileage" value="Avtomobil kilometrajı *" />
                        <TextInput
                            id="vehicle_mileage"
                            type="number"
                            value={data.vehicle_mileage || ''}
                            onChange={(e) => onDataChange('vehicle_mileage', e.target.value)}
                            disabled={processing}
                            className="mt-1 block w-full"
                            placeholder="Kilometraj daxil edin"
                        />
                        <InputError message={errors.vehicle_mileage} className="mt-2" />
                    </div>
                </div>
            )}

            <div>
                <InputLabel htmlFor="branch_id" value="Filial" />
                <select
                    id="branch_id"
                    value={data.branch_id}
                    onChange={(e) => onDataChange('branch_id', e.target.value)}
                    disabled={processing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    <option value="">Filial seçin</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
                <InputError message={errors.branch_id} className="mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <InputLabel htmlFor="service_date" value="Xidmət tarixi" />
                    <TextInput
                        id="service_date"
                        type="date"
                        value={data.service_date}
                        onChange={(e) => onDataChange('service_date', e.target.value)}
                        disabled={processing}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.service_date} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="status" value="Status" />
                    <select
                        id="status"
                        value={data.status}
                        onChange={(e) => onDataChange('status', e.target.value)}
                        disabled={processing}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="pending">Gözləyir</option>
                        <option value="in_progress">Davam edir</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">Ləğv edildi</option>
                    </select>
                    <InputError message={errors.status} className="mt-2" />
                </div>
            </div>

            <div>
                <InputLabel htmlFor="description" value="Xidmət təsviri *" />
                <textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => onDataChange('description', e.target.value)}
                    disabled={processing}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Xidmət təsviri daxil edin"
                />
                <InputError message={errors.description} className="mt-2" />
            </div>

            {data.estimated_completion && (
                <div>
                    <InputLabel htmlFor="estimated_completion" value="Təxmini tamamlanma tarixi" />
                    <TextInput
                        id="estimated_completion"
                        type="datetime-local"
                        value={data.estimated_completion}
                        onChange={(e) => onDataChange('estimated_completion', e.target.value)}
                        disabled={processing}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.estimated_completion} className="mt-2" />
                </div>
            )}
        </div>
    );
});