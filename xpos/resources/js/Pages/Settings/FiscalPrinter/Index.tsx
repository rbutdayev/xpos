import React, { FormEventHandler, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { PageProps } from '@/types';

interface FiscalPrinterConfig {
    id: number;
    provider: string;
    name: string;
    ip_address: string;
    port: number;
    username?: string;
    password?: string;
    merchant_id?: string;
    security_key?: string;
    device_serial?: string;
    bank_port?: string;
    credit_contract_number?: string;
    default_tax_name: string;
    default_tax_rate: number;
    auto_send: boolean;
    show_in_terminal: boolean;
    is_active: boolean;
    settings?: {
        api_path?: string;
    };
}

interface Provider {
    id: string;
    name: string;
    port: number;
    api_base_path: string;
    fields: string[];
    description: string;
    is_active: boolean;
}

interface FiscalPrinterProps extends PageProps {
    config: FiscalPrinterConfig | null;
    providers: Provider[];
    account: any;
}

export default function Index({ auth, config, providers, account }: FiscalPrinterProps) {
    const [isEditing, setIsEditing] = useState(!config);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
        config ? providers.find(p => p.id === config.provider) || null : null
    );
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        provider: config?.provider || '',
        name: config?.name || '',
        ip_address: config?.ip_address || '',
        port: config?.port || 0,
        api_path: config?.settings?.api_path || '',
        username: config?.username || '',
        password: '',
        merchant_id: config?.merchant_id || '',
        security_key: config?.security_key || '',
        device_serial: config?.device_serial || '',
        bank_port: config?.bank_port || '',
        credit_contract_number: config?.credit_contract_number || '',
        default_tax_name: config?.default_tax_name || 'ƏDV',
        default_tax_rate: config?.default_tax_rate || 18,
        auto_send: config?.auto_send ?? true,
        show_in_terminal: config?.show_in_terminal ?? true,
        is_active: config?.is_active ?? true,
    });

    const handleProviderChange = (providerId: string) => {
        const provider = providers.find(p => p.id === providerId);
        setSelectedProvider(provider || null);
        setData({
            ...data,
            provider: providerId,
            port: provider?.port || 0,
            api_path: provider?.api_base_path || '',
            // Reset provider-specific fields
            username: '',
            password: '',
            merchant_id: '',
            security_key: '',
            device_serial: '',
            bank_port: '',
            credit_contract_number: '',
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('fiscal-printer.store'), {
            onSuccess: () => {
                setIsEditing(false);
                reset('password');
            },
        });
    };

    const handleDelete = () => {
        if (confirm('Fiskal printer konfiqurasiyasını silmək istədiyinizə əminsiniz?')) {
            router.delete(route('fiscal-printer.destroy'), {
                onSuccess: () => {
                    setIsEditing(true);
                    reset();
                },
            });
        }
    };

    const testConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);

        try {
            const response = await fetch(route('fiscal-printer.test-connection'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Əlaqə xətası baş verdi',
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const getFieldLabel = (field: string): string => {
        const labels: Record<string, string> = {
            username: 'İstifadəçi adı',
            password: 'Şifrə',
            merchant_id: 'Merchant ID',
            security_key: 'Təhlükəsizlik Açarı',
            device_serial: 'Cihaz S/N (son 4 rəqəm)',
            bank_port: 'Bank Port',
        };
        return labels[field] || field;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Fiskal Printer Parametrləri" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Fiskal Printer Haqqında
                                </h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        Vergilər Nazirliyi tərəfindən təsdiq edilmiş elektron kassa cihazları ilə inteqrasiya.
                                        Satış tamamlananda avtomatik olaraq fiskal çek çap olunacaq.
                                    </p>
                                    <p className="mt-1">
                                        <strong>Vacib:</strong> Fiskal printer və XPOS eyni lokal şəbəkədə olmalıdır.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Provider Selection */}
                    {!config && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Fiskal Printer Provayderini seçin
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {providers.map((provider) => (
                                        <button
                                            key={provider.id}
                                            type="button"
                                            onClick={() => {
                                                if (provider.is_active) {
                                                    handleProviderChange(provider.id);
                                                    setIsEditing(true);
                                                }
                                            }}
                                            disabled={!provider.is_active}
                                            className={`p-4 border-2 rounded-lg text-left transition-colors relative ${
                                                !provider.is_active
                                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    : selectedProvider?.id === provider.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-900">{provider.name}</div>
                                            <div className="text-sm text-gray-600 mt-1">{provider.description}</div>
                                            <div className="text-xs text-gray-500 mt-2">Port: {provider.port}</div>
                                            {!provider.is_active && (
                                                <div className="mt-2 inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                                                    Uygun deyil
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configuration Form */}
                    {(isEditing && selectedProvider) || config ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {config ? 'Konfiqurasiya' : `${selectedProvider?.name} Konfiqurasiyası`}
                                    </h3>
                                    <div className="space-x-2">
                                        {config && !isEditing && (
                                            <>
                                                <SecondaryButton type="button" onClick={testConnection} disabled={testingConnection}>
                                                    {testingConnection ? 'Yoxlanılır...' : 'Əlaqəni Yoxla'}
                                                </SecondaryButton>
                                                <PrimaryButton type="button" onClick={() => setIsEditing(true)}>
                                                    Redaktə Et
                                                </PrimaryButton>
                                                <DangerButton type="button" onClick={handleDelete}>
                                                    Sil
                                                </DangerButton>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Test Result */}
                                {testResult && (
                                    <div className={`mb-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                        {testResult.message}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-6">
                                    {/* Provider (readonly if editing) */}
                                    {config && (
                                        <div>
                                            <InputLabel htmlFor="provider" value="Provayder" />
                                            <TextInput
                                                id="provider"
                                                type="text"
                                                value={selectedProvider?.name || config.provider}
                                                className="mt-1 block w-full bg-gray-50"
                                                disabled
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div>
                                            <InputLabel htmlFor="name" value="Konfiqurasiya Adı" />
                                            <TextInput
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="mt-1 block w-full"
                                                disabled={!isEditing}
                                                placeholder="Məsələn: Əsas Kassa"
                                            />
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        {/* IP Address */}
                                        <div>
                                            <InputLabel htmlFor="ip_address" value="IP Ünvanı" />
                                            <TextInput
                                                id="ip_address"
                                                type="text"
                                                value={data.ip_address}
                                                onChange={(e) => setData('ip_address', e.target.value)}
                                                className="mt-1 block w-full"
                                                disabled={!isEditing}
                                                placeholder="192.168.1.100"
                                            />
                                            <InputError message={errors.ip_address} className="mt-2" />
                                        </div>

                                        {/* Port */}
                                        <div>
                                            <InputLabel htmlFor="port" value="Port" />
                                            <TextInput
                                                id="port"
                                                type="number"
                                                value={data.port}
                                                onChange={(e) => setData('port', parseInt(e.target.value))}
                                                className="mt-1 block w-full"
                                                disabled={!isEditing}
                                            />
                                            <InputError message={errors.port} className="mt-2" />
                                            {selectedProvider && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Default: {selectedProvider.port}
                                                </p>
                                            )}
                                        </div>

                                        {/* API Path */}
                                        <div>
                                            <InputLabel htmlFor="api_path" value="API Path" />
                                            <TextInput
                                                id="api_path"
                                                type="text"
                                                value={data.api_path}
                                                onChange={(e) => setData('api_path', e.target.value)}
                                                className="mt-1 block w-full"
                                                disabled={!isEditing}
                                                placeholder="/api/v2"
                                            />
                                            <InputError message={errors.api_path} className="mt-2" />
                                            {selectedProvider && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Default: {selectedProvider.api_base_path}
                                                </p>
                                            )}
                                        </div>

                                        {/* Provider-specific fields */}
                                        {selectedProvider?.fields.map((field) => (
                                            <div key={field}>
                                                <InputLabel htmlFor={field} value={getFieldLabel(field)} />
                                                <TextInput
                                                    id={field}
                                                    type={field === 'password' ? 'password' : 'text'}
                                                    value={data[field as keyof typeof data] as string}
                                                    onChange={(e) => setData(field as any, e.target.value)}
                                                    className="mt-1 block w-full"
                                                    disabled={!isEditing}
                                                    placeholder={field === 'password' && config ? '(dəyişdirmək üçün yeni şifrə daxil edin)' : ''}
                                                />
                                                <InputError message={errors[field as keyof typeof errors]} className="mt-2" />
                                            </div>
                                        ))}

                                        {/* Credit Contract Number - for bank credit sales */}
                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="credit_contract_number" value="Bank Kredit Müqaviləsi" />
                                            <TextInput
                                                id="credit_contract_number"
                                                type="text"
                                                value={data.credit_contract_number}
                                                onChange={(e) => setData('credit_contract_number', e.target.value)}
                                                className="mt-1 block w-full"
                                                disabled={!isEditing}
                                                placeholder="Məsələn: BirKart müqavilə nömrəsi"
                                            />
                                            <InputError message={errors.credit_contract_number} className="mt-2" />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Bank kredit satışları üçün lazımdır. Bu xana dolmadığı halda "Bank Kredit" ödəniş növü POS ekranında görünməyəcək.
                                            </p>
                                        </div>

                                        {/* Tax Name */}
                                        <div>
                                            <InputLabel htmlFor="default_tax_name" value="Vergi Adı" />
                                            <TextInput
                                                id="default_tax_name"
                                                type="text"
                                                value={data.default_tax_name}
                                                onChange={(e) => setData('default_tax_name', e.target.value)}
                                                className="mt-1 block w-full"
                                                disabled={!isEditing}
                                            />
                                            <InputError message={errors.default_tax_name} className="mt-2" />
                                        </div>

                                        {/* Tax Rate */}
                                        <div>
                                            <InputLabel htmlFor="default_tax_rate" value="Vergi Dərəcəsi (%)" />
                                            <TextInput
                                                id="default_tax_rate"
                                                type="number"
                                                step="0.01"
                                                value={data.default_tax_rate}
                                                onChange={(e) => setData('default_tax_rate', parseFloat(e.target.value))}
                                                className="mt-1 block w-full"
                                                disabled={!isEditing}
                                            />
                                            <InputError message={errors.default_tax_rate} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Checkboxes */}
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                id="auto_send"
                                                type="checkbox"
                                                checked={data.auto_send}
                                                onChange={(e) => setData('auto_send', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                                disabled={!isEditing}
                                            />
                                            <label htmlFor="auto_send" className="ml-2 text-sm text-gray-700">
                                                Avtomatik göndərilsin (satış bağlandıqda avtomatik fiskal çek yaradılsın)
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                id="show_in_terminal"
                                                type="checkbox"
                                                checked={data.show_in_terminal}
                                                onChange={(e) => setData('show_in_terminal', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                                disabled={!isEditing}
                                            />
                                            <label htmlFor="show_in_terminal" className="ml-2 text-sm text-gray-700">
                                                Terminalda göstər
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                id="is_active"
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                                disabled={!isEditing}
                                            />
                                            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                                Aktiv
                                            </label>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="flex items-center gap-4">
                                            <PrimaryButton disabled={processing}>
                                                {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                            </PrimaryButton>
                                            {config && (
                                                <SecondaryButton type="button" onClick={() => {
                                                    setIsEditing(false);
                                                    reset();
                                                }}>
                                                    Ləğv et
                                                </SecondaryButton>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
