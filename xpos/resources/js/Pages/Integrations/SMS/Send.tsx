import { FormEventHandler, useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { PageProps, Customer } from '@/types';

interface SMSSendProps extends PageProps {
    customers: {
        data: Customer[];
    };
    totalCustomersWithPhone: number;
    hasCredentials: boolean;
    filters: {
        search?: string;
    };
}

export default function Send({ customers, totalCustomersWithPhone, hasCredentials, filters }: SMSSendProps) {
    const [sendMode, setSendMode] = useState<'bulk' | 'all'>('bulk');
    const [selectedCustomersList, setSelectedCustomersList] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const { data, setData, post, processing, errors, reset } = useForm({
        phone_numbers: [] as string[],
        message: '',
    });

    // Debounced search
    useEffect(() => {
        if (searchTerm.length < 2) return; // Only search if 2+ characters

        const timer = setTimeout(() => {
            router.get(route('sms.send-page'), { search: searchTerm }, {
                preserveState: true,
                preserveScroll: true,
                only: ['customers'],
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const phones = sendMode === 'all'
            ? [] // For 'all' mode, we'll handle it differently on backend
            : selectedCustomersList.map(c => c.phone!);
        setData('phone_numbers', phones);
    }, [sendMode, selectedCustomersList]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (sendMode === 'all') {
            // Send to all customers - backend will handle fetching all phone numbers
            post(route('sms.send-all'), {
                onSuccess: () => {
                    reset();
                },
            });
        } else {
            // Send to selected customers
            post(route('sms.send-bulk'), {
                onSuccess: () => {
                    reset();
                    setSelectedCustomersList([]);
                },
            });
        }
    };

    const addCustomer = (customer: Customer) => {
        if (!selectedCustomersList.find(c => c.id === customer.id)) {
            setSelectedCustomersList(prev => [...prev, customer]);
        }
    };

    const removeCustomer = (customerId: number) => {
        setSelectedCustomersList(prev => prev.filter(c => c.id !== customerId));
    };

    const characterCount = data.message.length;
    const smsCount = Math.ceil(characterCount / 160);

    if (!hasCredentials) {
        return (
            <AuthenticatedLayout
                header={
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        SMS Göndər
                    </h2>
                }
            >
                <Head title="SMS Göndər" />

                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-yellow-900 mb-2">
                                SMS Parametrləri Qeyd Edilməyib
                            </h3>
                            <p className="text-yellow-800 mb-4">
                                SMS göndərmək üçün əvvəlcə SMS parametrlərini qeyd etməlisiniz.
                            </p>
                            <a
                                href={route('sms.index')}
                                className="inline-flex items-center px-4 py-2 bg-yellow-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-700"
                            >
                                Parametrlərə keç
                            </a>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    SMS Göndər
                </h2>
            }
        >
            <Head title="SMS Göndər" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Mode Selection */}
                            <div className="mb-6">
                                <div className="flex gap-4 border-b">
                                    <button
                                        type="button"
                                        onClick={() => setSendMode('bulk')}
                                        className={`px-4 py-2 font-medium text-sm ${
                                            sendMode === 'bulk'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Seçilmiş Müştərilər
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSendMode('all')}
                                        className={`px-4 py-2 font-medium text-sm ${
                                            sendMode === 'all'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Bütün Müştərilər ({totalCustomersWithPhone})
                                    </button>
                                </div>
                            </div>

                            {/* SMS Form */}
                            <div className="space-y-6">
                                    {sendMode === 'bulk' && (
                                        <div>
                                            <div className="mb-4">
                                                <InputLabel value="Müştəri axtar və seç" />
                                                <div className="mt-1 relative">
                                                    <TextInput
                                                        type="text"
                                                        className="w-full"
                                                        placeholder="Müştəri adı və ya telefon nömrəsi daxil edin..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />

                                                    {/* Search results dropdown */}
                                                    {searchTerm.length >= 2 && (
                                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                            {customers.data.length > 0 ? (
                                                                customers.data.map((customer) => (
                                                                    <button
                                                                        key={customer.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            addCustomer(customer);
                                                                            setSearchTerm('');
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 disabled:opacity-50"
                                                                        disabled={selectedCustomersList.some(c => c.id === customer.id)}
                                                                    >
                                                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                                                        <div className="text-sm text-gray-500">{customer.phone}</div>
                                                                        {selectedCustomersList.some(c => c.id === customer.id) && (
                                                                            <div className="text-xs text-green-600 mt-1">✓ Seçilib</div>
                                                                        )}
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                                                                    Heç bir müştəri tapılmadı
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Axtarış üçün ən azı 2 simvol daxil edin
                                                </p>
                                            </div>

                                            {/* Selected customers display */}
                                            {selectedCustomersList.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-sm font-medium text-gray-900">
                                                            Seçilmiş müştərilər ({selectedCustomersList.length})
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedCustomersList([])}
                                                            className="text-sm text-red-600 hover:text-red-800"
                                                        >
                                                            Hamısını sil
                                                        </button>
                                                    </div>
                                                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                                                        {selectedCustomersList.map((customer) => (
                                                            <div
                                                                key={customer.id}
                                                                className="flex items-center justify-between p-2 bg-gray-50"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                                                    <div className="text-xs text-gray-500">{customer.phone}</div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCustomer(customer.id)}
                                                                    className="ml-2 text-red-600 hover:text-red-800"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedCustomersList.length === 0 && (
                                                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <p className="text-sm text-gray-600 text-center">
                                                        Heç bir müştəri seçilməyib. Axtarış sahəsindən müştəri seçin.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <form onSubmit={submit} className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <InputLabel htmlFor="message" value="Mesaj" />
                                            <span className="text-sm text-gray-500">
                                                {characterCount} simvol ({smsCount} SMS) × {data.phone_numbers.length} nömrə = {smsCount * data.phone_numbers.length} SMS
                                            </span>
                                        </div>
                                        <textarea
                                            id="message"
                                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                            rows={4}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            required
                                            maxLength={500}
                                        />
                                        <InputError message={errors.message} className="mt-2" />
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            {sendMode === 'all'
                                                ? `${totalCustomersWithPhone} müştəriyə SMS göndəriləcək`
                                                : `${selectedCustomersList.length} müştəriyə SMS göndəriləcək`
                                            }
                                        </p>
                                    </div>

                                    <PrimaryButton
                                        disabled={processing || (sendMode === 'bulk' && selectedCustomersList.length === 0) || (sendMode === 'all' && totalCustomersWithPhone === 0)}
                                    >
                                        {sendMode === 'all' ? totalCustomersWithPhone : selectedCustomersList.length} Nömrəyə SMS Göndər
                                    </PrimaryButton>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
