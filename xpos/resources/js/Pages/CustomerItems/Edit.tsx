import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Customer, CustomerItem } from '@/types';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useState } from 'react';
import { SERVICE_TYPES, ServiceType, getServiceConfig } from '@/config/serviceTypes';

interface Props {
    item: CustomerItem;
    customers: Customer[];
}

interface CustomerItemFormData {
    customer_id: string;
    service_type: ServiceType;
    item_type: string;
    description: string;
    color: string;
    fabric_type: string;
    size: string;
    measurements: Record<string, string>;
    notes: string;
    reference_number: string;
    received_date: string;
    is_active: boolean;
}

export default function Edit({ item, customers }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm<CustomerItemFormData>({
        customer_id: item.customer_id?.toString() || '',
        service_type: (item.service_type as ServiceType) || 'tailor',
        item_type: item.item_type || '',
        description: item.description || '',
        color: item.color || '',
        fabric_type: item.fabric_type || '',
        size: item.size || '',
        measurements: item.measurements || {},
        notes: item.notes || '',
        reference_number: item.reference_number || '',
        received_date: item.received_date || '',
        is_active: item.is_active ?? true,
    });

    const [measurementKey, setMeasurementKey] = useState('');
    const [measurementValue, setMeasurementValue] = useState('');

    // Get current service configuration
    const serviceConfig = getServiceConfig(data.service_type);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('customer-items.update', item.id));
    };

    const addMeasurement = () => {
        if (measurementKey && measurementValue) {
            setData('measurements', {
                ...data.measurements,
                [measurementKey]: measurementValue
            });
            setMeasurementKey('');
            setMeasurementValue('');
        }
    };

    const removeMeasurement = (key: string) => {
        const newMeasurements = { ...data.measurements };
        delete newMeasurements[key];
        setData('measurements', newMeasurements);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Müştəri məhsulunu redaktə et
                    </h2>
                    <Link
                        href={route('customer-items.show', item.id)}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ← Məhsula qayıt
                    </Link>
                </div>
            }
        >
            <Head title="Müştəri məhsulunu redaktə et" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Service Type Selector */}
                            <div>
                                <InputLabel htmlFor="service_type" value="Xidmət növü *" />
                                <select
                                    id="service_type"
                                    name="service_type"
                                    value={data.service_type}
                                    onChange={(e) => setData('service_type', e.target.value as ServiceType)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    {Object.values(SERVICE_TYPES).map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.service_type} className="mt-2" />
                            </div>

                            {/* Customer */}
                            <div>
                                <InputLabel htmlFor="customer_id" value="Müştəri *" />
                                <select
                                    id="customer_id"
                                    name="customer_id"
                                    value={data.customer_id}
                                    onChange={(e) => setData('customer_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="">Müştəri seçin</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.customer_id} className="mt-2" />
                            </div>

                            {/* Item Type - Dynamic label based on service type */}
                            <div>
                                <InputLabel htmlFor="item_type" value={`${serviceConfig.itemLabel} *`} />
                                <TextInput
                                    id="item_type"
                                    type="text"
                                    name="item_type"
                                    value={data.item_type}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('item_type', e.target.value)}
                                    placeholder={serviceConfig.itemLabelOptional}
                                />
                                <InputError message={errors.item_type} className="mt-2" />
                            </div>

                            {/* Description */}
                            <div>
                                <InputLabel htmlFor="description" value="Təsvir" />
                                <textarea
                                    id="description"
                                    name="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder="Məhsulun ətraflı təsviri..."
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            {/* Color */}
                            <div>
                                <InputLabel htmlFor="color" value="Rəng" />
                                <TextInput
                                    id="color"
                                    type="text"
                                    name="color"
                                    value={data.color}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('color', e.target.value)}
                                    placeholder="Məsələn: Qırmızı, Göy, Ağ"
                                />
                                <InputError message={errors.color} className="mt-2" />
                            </div>

                            {/* Size */}
                            <div>
                                <InputLabel htmlFor="size" value="Ölçü" />
                                <TextInput
                                    id="size"
                                    type="text"
                                    name="size"
                                    value={data.size}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('size', e.target.value)}
                                    placeholder="Məsələn: M, L, XL, 42"
                                />
                                <InputError message={errors.size} className="mt-2" />
                            </div>

                            {/* Fabric Type - Only for tailor service */}
                            {data.service_type === 'tailor' && (
                                <div>
                                    <InputLabel htmlFor="fabric_type" value="Parça növü" />
                                    <TextInput
                                        id="fabric_type"
                                        type="text"
                                        name="fabric_type"
                                        value={data.fabric_type}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('fabric_type', e.target.value)}
                                        placeholder="Məsələn: Pambıq, İpək, Satin"
                                    />
                                    <InputError message={errors.fabric_type} className="mt-2" />
                                </div>
                            )}

                            {/* Measurements */}
                            <div>
                                <InputLabel value="Ölçülər" />
                                <div className="mt-2 space-y-3">
                                    <div className="flex gap-2">
                                        <TextInput
                                            type="text"
                                            value={measurementKey}
                                            onChange={(e) => setMeasurementKey(e.target.value)}
                                            placeholder="Ölçü adı (məs: Uzunluq)"
                                            className="flex-1"
                                        />
                                        <TextInput
                                            type="text"
                                            value={measurementValue}
                                            onChange={(e) => setMeasurementValue(e.target.value)}
                                            placeholder="Dəyər (məs: 100cm)"
                                            className="flex-1"
                                        />
                                        <SecondaryButton
                                            type="button"
                                            onClick={addMeasurement}
                                        >
                                            Əlavə et
                                        </SecondaryButton>
                                    </div>

                                    {Object.keys(data.measurements).length > 0 && (
                                        <div className="bg-gray-50 p-3 rounded-md space-y-2">
                                            {Object.entries(data.measurements).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center bg-white p-2 rounded border">
                                                    <span className="text-sm">
                                                        <strong>{key}:</strong> {value}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMeasurement(key)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Sil
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <InputError message={errors.measurements} className="mt-2" />
                            </div>

                            {/* Reference Number */}
                            <div>
                                <InputLabel htmlFor="reference_number" value="Referans nömrəsi" />
                                <TextInput
                                    id="reference_number"
                                    type="text"
                                    name="reference_number"
                                    value={data.reference_number}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    placeholder="Daxili izləmə nömrəsi"
                                />
                                <InputError message={errors.reference_number} className="mt-2" />
                            </div>

                            {/* Received Date */}
                            <div>
                                <InputLabel htmlFor="received_date" value="Qəbul tarixi" />
                                <TextInput
                                    id="received_date"
                                    type="date"
                                    name="received_date"
                                    value={data.received_date}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('received_date', e.target.value)}
                                />
                                <InputError message={errors.received_date} className="mt-2" />
                            </div>

                            {/* Notes */}
                            <div>
                                <InputLabel htmlFor="notes" value="Qeydlər" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder="Əlavə qeydlər və ya xüsusi göstərişlər..."
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            {/* Status */}
                            <div>
                                <div className="flex items-center">
                                    <input
                                        id="is_active"
                                        name="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <InputLabel htmlFor="is_active" value="Aktiv məhsul" className="ml-2" />
                                </div>
                                <InputError message={errors.is_active} className="mt-2" />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                                <SecondaryButton type="button" onClick={() => reset()}>
                                    Sıfırla
                                </SecondaryButton>
                                <Link href={route('customer-items.show', item.id)}>
                                    <SecondaryButton type="button">
                                        Ləğv et
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Yenilənir...' : 'Yenilə'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Məlumat</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Xidmət növü, müştəri və {serviceConfig.itemLabel.toLowerCase()} mütləq sahələrdir</li>
                            <li>• Ölçüləri/Parametrləri əlavə etmək üçün ad və dəyər daxil edib "Əlavə et" düyməsini basın</li>
                            <li>• Məhsulun statusu xidmətlər vasitəsilə avtomatik yenilənir</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
