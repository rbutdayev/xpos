import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Customer, CustomerFormData } from '@/types';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
        card_number: customer.loyalty_card?.card_number || '',
    });

    const [cardValidation, setCardValidation] = useState<{
        isValidating: boolean;
        isValid: boolean | null;
        message: string;
    }>({
        isValidating: false,
        isValid: null,
        message: '',
    });

    useEffect(() => {
        if (data.card_number && data.card_number.length === 14 && data.card_number !== customer.loyalty_card?.card_number) {
            const timer = setTimeout(() => {
                validateCard(data.card_number!);
            }, 500);
            return () => clearTimeout(timer);
        } else if (data.card_number === customer.loyalty_card?.card_number) {
            setCardValidation({ isValidating: false, isValid: true, message: 'Mövcud kart' });
        } else {
            setCardValidation({ isValidating: false, isValid: null, message: '' });
        }
    }, [data.card_number]);

    const validateCard = async (cardNumber: string) => {
        setCardValidation({ isValidating: true, isValid: null, message: '' });
        try {
            const response = await axios.post('/customers/validate-loyalty-card', {
                card_number: cardNumber,
            });
            setCardValidation({
                isValidating: false,
                isValid: true,
                message: response.data.message,
            });
        } catch (error: any) {
            setCardValidation({
                isValidating: false,
                isValid: false,
                message: error.response?.data?.message || 'Kart yoxlanılarkən xəta baş verdi',
            });
        }
    };

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

                            {/* Loyalty Card */}
                            <div>
                                <InputLabel htmlFor="card_number" value="Loaylıq Kartı" />
                                <div className="mt-1">
                                    <TextInput
                                        id="card_number"
                                        type="text"
                                        name="card_number"
                                        value={data.card_number}
                                        className="block w-full uppercase"
                                        placeholder="14 simvollu kart nömrəsi"
                                        maxLength={14}
                                        onChange={(e) => setData('card_number', e.target.value.toUpperCase())}
                                    />
                                    {cardValidation.isValidating && (
                                        <div className="mt-2 flex items-center text-sm text-gray-600">
                                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Yoxlanılır...
                                        </div>
                                    )}
                                    {cardValidation.isValid === true && (
                                        <div className="mt-2 flex items-center text-sm text-green-600">
                                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            {cardValidation.message}
                                        </div>
                                    )}
                                    {cardValidation.isValid === false && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            {cardValidation.message}
                                        </div>
                                    )}
                                </div>
                                <InputError message={errors.card_number} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    İstəyə bağlı. Fiziki loaylıq kartının nömrəsini daxil edin.
                                    {customer.loyalty_card && ' Kartı dəyişmək və ya boş buraxmaq onu silər.'}
                                </p>
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