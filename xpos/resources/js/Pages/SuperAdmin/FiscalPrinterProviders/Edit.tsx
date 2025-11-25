import { Head, useForm } from '@inertiajs/react';
import SuperAdminNav from '@/Components/SuperAdminNav';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Provider {
    id: number;
    code: string;
    name: string;
    description: string;
    default_port: number;
    api_base_path: string;
    print_endpoint: string;
    status_endpoint: string;
    required_fields: string[];
    is_active: boolean;
}

interface Props {
    provider: Provider;
}

export default function Edit({ provider }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: provider.name,
        description: provider.description || '',
        default_port: provider.default_port,
        api_base_path: provider.api_base_path,
        print_endpoint: provider.print_endpoint,
        status_endpoint: provider.status_endpoint,
        required_fields: provider.required_fields || [],
        is_active: provider.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/fiscal-printer-providers/${provider.id}`);
    };

    return (
        <>
            <Head title={`Redaktə et - ${provider.name}`} />

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {provider.name} - API Konfiqurasiyası
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Provider code: <code className="bg-gray-100 px-2 py-1 rounded">{provider.code}</code>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SuperAdminNav />

                    <div className="max-w-3xl">
                        {/* Info Box */}
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">API Endpoint Formatı</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Nəticə URL: <code className="bg-white px-2 py-1 rounded">http://IP:PORT{data.api_base_path}/{data.print_endpoint}</code>
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Məsələn: http://192.168.1.100:{data.default_port}{data.api_base_path}/{data.print_endpoint}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Provider Məlumatları</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Name */}
                                <div>
                                    <InputLabel htmlFor="name" value="Provider Adı" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                {/* Description */}
                                <div>
                                    <InputLabel htmlFor="description" value="Açıqlama" />
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows={3}
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>

                                {/* Default Port */}
                                <div>
                                    <InputLabel htmlFor="default_port" value="Default Port" />
                                    <TextInput
                                        id="default_port"
                                        type="number"
                                        value={data.default_port.toString()}
                                        onChange={(e) => setData('default_port', parseInt(e.target.value))}
                                        className="mt-1 block w-full"
                                        required
                                        min="1"
                                        max="65535"
                                    />
                                    <InputError message={errors.default_port} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500">Port nömrəsi 1-65535 arasında olmalıdır</p>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-md font-medium text-gray-900 mb-4">API Endpoint Konfiqurasiyası</h3>

                                    {/* API Base Path */}
                                    <div className="mb-4">
                                        <InputLabel htmlFor="api_base_path" value="API Base Path" />
                                        <TextInput
                                            id="api_base_path"
                                            type="text"
                                            value={data.api_base_path}
                                            onChange={(e) => setData('api_base_path', e.target.value)}
                                            className="mt-1 block w-full font-mono text-sm"
                                            required
                                            placeholder="/api"
                                        />
                                        <InputError message={errors.api_base_path} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">Əsas API yolu (məsələn: /api, /api/v2)</p>
                                    </div>

                                    {/* Print Endpoint */}
                                    <div className="mb-4">
                                        <InputLabel htmlFor="print_endpoint" value="Print Endpoint" />
                                        <TextInput
                                            id="print_endpoint"
                                            type="text"
                                            value={data.print_endpoint}
                                            onChange={(e) => setData('print_endpoint', e.target.value)}
                                            className="mt-1 block w-full font-mono text-sm"
                                            required
                                            placeholder="print"
                                        />
                                        <InputError message={errors.print_endpoint} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">Çek çap etmək üçün endpoint (məsələn: print, receipt/create)</p>
                                    </div>

                                    {/* Status Endpoint */}
                                    <div className="mb-4">
                                        <InputLabel htmlFor="status_endpoint" value="Status Endpoint" />
                                        <TextInput
                                            id="status_endpoint"
                                            type="text"
                                            value={data.status_endpoint}
                                            onChange={(e) => setData('status_endpoint', e.target.value)}
                                            className="mt-1 block w-full font-mono text-sm"
                                            required
                                            placeholder="status"
                                        />
                                        <InputError message={errors.status_endpoint} className="mt-2" />
                                        <p className="mt-1 text-xs text-gray-500">Əlaqəni yoxlamaq üçün endpoint (məsələn: status, health)</p>
                                    </div>
                                </div>

                                {/* Is Active */}
                                <div className="flex items-center">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                        Aktiv (sistemdə istifadə olunsun)
                                    </label>
                                </div>

                                {/* Example URL */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Nümunə URL-lər:</h4>
                                    <div className="space-y-1 text-xs font-mono">
                                        <p className="text-gray-600">
                                            <span className="font-semibold">Print:</span> http://192.168.1.100:{data.default_port}{data.api_base_path}/{data.print_endpoint}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-semibold">Status:</span> http://192.168.1.100:{data.default_port}{data.api_base_path}/{data.status_endpoint}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <SecondaryButton type="button" onClick={() => window.history.back()}>
                                    Ləğv et
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
