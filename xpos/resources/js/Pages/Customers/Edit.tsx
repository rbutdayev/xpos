import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Customer, CustomerFormData } from '@/types';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import toast from 'react-hot-toast';

interface Props {
    customer: Customer;
}

export default function Edit({ customer }: Props) {
    const { data, setData, put, processing, errors } = useForm<CustomerFormData>({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        birthday: customer.birthday || '',
        customer_type: customer.customer_type,
        tax_number: customer.tax_number || '',
        notes: customer.notes || '',
        is_active: customer.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/customers/${customer.id}`, {
            onSuccess: () => {
                toast.success('Müştəri məlumatları yeniləndi');
            },
            onError: (errs) => {
                // Show toast notifications for all errors
                Object.entries(errs).forEach(([field, message]) => {
                    if (typeof message === 'string') {
                        toast.error(message, { duration: 5000 });
                    } else if (Array.isArray(message)) {
                        (message as string[]).forEach((msg: string) => toast.error(msg, { duration: 5000 }));
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Düzəliş et: ${customer.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Customer Name */}
                            <div>
                                <InputLabel htmlFor="name" value="Müştəri adı *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            {/* Customer Type */}
                            <div>
                                <InputLabel htmlFor="customer_type" value="Müştəri növü *" />
                                <select
                                    id="customer_type"
                                    name="customer_type"
                                    value={data.customer_type}
                                    onChange={(e) => setData('customer_type', e.target.value as 'individual' | 'corporate')}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="individual">Fiziki şəxs</option>
                                    <option value="corporate">Hüquqi şəxs</option>
                                </select>
                                <InputError message={errors.customer_type} className="mt-2" />
                            </div>

                            {/* Phone */}
                            <div>
                                <InputLabel htmlFor="phone" value="Telefon" />
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        +994
                                    </span>
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={data.phone.startsWith('+994') ? data.phone.slice(4) : data.phone}
                                        className="flex-1 block w-full rounded-l-none"
                                        placeholder="501234567"
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setData('phone', value ? `+994${value}` : '');
                                        }}
                                    />
                                </div>
                                <InputError message={errors.phone} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    Məsələn: 501234567 (9 rəqəm)
                                </p>
                            </div>

                            {/* Email */}
                            <div>
                                <InputLabel htmlFor="email" value="E-poçt" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full"
                                    autoComplete="email"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            {/* Birthday (only for individual) */}
                            {data.customer_type === 'individual' && (
                                <div>
                                    <InputLabel htmlFor="birthday" value="Doğum tarixi" />
                                    <TextInput
                                        id="birthday"
                                        type="date"
                                        name="birthday"
                                        value={data.birthday}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('birthday', e.target.value)}
                                    />
                                    <InputError message={errors.birthday} className="mt-2" />
                                </div>
                            )}

                            {/* Tax Number (only for corporate) */}
                            {data.customer_type === 'corporate' && (
                                <div>
                                    <InputLabel htmlFor="tax_number" value="VÖEN" />
                                    <TextInput
                                        id="tax_number"
                                        type="text"
                                        name="tax_number"
                                        value={data.tax_number}
                                        className="mt-1 block w-full"
                                        placeholder="1234567890"
                                        onChange={(e) => setData('tax_number', e.target.value)}
                                    />
                                    <InputError message={errors.tax_number} className="mt-2" />
                                </div>
                            )}

                            {/* Address */}
                            <div>
                                <InputLabel htmlFor="address" value="Ünvan" />
                                <textarea
                                    id="address"
                                    name="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder="Müştərinin ünvanı..."
                                />
                                <InputError message={errors.address} className="mt-2" />
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
                                    placeholder="Əlavə məlumatlar..."
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
                                    <InputLabel htmlFor="is_active" value="Aktiv müştəri" className="ml-2" />
                                </div>
                                <InputError message={errors.is_active} className="mt-2" />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                                <Link href={`/customers/${customer.id}`}>
                                    <SecondaryButton type="button">
                                        Ləğv et
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Yenilənir...' : 'Dəyişiklikləri yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Customer Stats */}
                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Müştəri statistikası</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Yaradılma tarixi:</span>
                                <div className="font-medium">
                                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString('az-AZ') : '-'}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Aktiv məhsullar:</span>
                                <div className="font-medium">{customer.active_customerItems_count || 0}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Ümumi servislər:</span>
                                <div className="font-medium">{customer.total_tailor_services || 0}</div>
                            </div>
                            {customer.last_service_date && (
                                <div>
                                    <span className="text-gray-500">Son servis:</span>
                                    <div className="font-medium">
                                        {new Date(customer.last_service_date).toLocaleDateString('az-AZ')}
                                    </div>
                                </div>
                            )}
                            {customer.has_pending_credits && (
                                <div>
                                    <span className="text-gray-500">Borc məbləği:</span>
                                    <div className="font-medium text-red-600">
                                        {customer.total_credit_amount?.toFixed(2) || '0.00'} AZN
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning for service records */}
                    {(customer.total_tailor_services || 0) > 0 && (
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-yellow-900 mb-2">Diqqət</h3>
                            <p className="text-sm text-yellow-700">
                                Bu müştərinin {customer.total_tailor_services} servis qeydi mövcuddur.
                                Müştərini silmək istəyirsinizsə, əvvəlcə bütün servis qeydlərini silməlisiniz.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}