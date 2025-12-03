import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface StorageSettings {
    storage_driver: 'local' | 'azure' | 's3' | 's3-compatible';
    azure_connection_string: string;
    azure_container: string;
    s3_access_key: string;
    s3_secret_key: string;
    s3_bucket: string;
    s3_region: string;
    s3_endpoint: string;
    s3_use_path_style_endpoint: boolean;
    s3_url: string;
}

interface Props {
    currentSettings: StorageSettings;
}

export default function StorageSettings({ currentSettings }: Props) {
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

    const { data, setData, put, processing, errors } = useForm<StorageSettings>(currentSettings);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/storage-settings');
    };

    const testConnection = async () => {
        setIsTestingConnection(true);
        setTestResult(null);

        try {
            const response = await fetch('/admin/storage-settings/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Bağlantı test edilərkən xəta baş verdi'
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const driverOptions = [
        { value: 'local', label: 'Lokal Yaddaş', icon: '💾', description: 'Serverdə lokal olaraq saxlayın (inkişaf üçün)' },
        { value: 'azure', label: 'Azure Object Storage', icon: '☁️', description: 'Microsoft Azure Blob Storage' },
        { value: 's3', label: 'AWS S3', icon: '📦', description: 'Amazon Web Services S3' },
        { value: 's3-compatible', label: 'S3-uyğun (Backblaze)', icon: '🔗', description: 'Backblaze B2, MinIO və s.' },
    ];

    return (
        <>
            <Head title="Object Store Parametrləri" />

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Object Store Parametrləri
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Fayl yaddaşı konfiqurasiyasını idarə edin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SuperAdminNav />

                    <div className="bg-white shadow-sm rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Storage Driver Selection */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Yaddaş Növü Seçin *
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {driverOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => setData('storage_driver', option.value as any)}
                                            className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                                                data.storage_driver === option.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 text-3xl">
                                                    {option.icon}
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            name="storage_driver"
                                                            value={option.value}
                                                            checked={data.storage_driver === option.value}
                                                            onChange={(e) => setData('storage_driver', e.target.value as any)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        />
                                                        <label className="ml-2 text-base font-medium text-gray-900">
                                                            {option.label}
                                                        </label>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Azure Settings */}
                            {data.storage_driver === 'azure' && (
                                <div className="space-y-6 border-t pt-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="text-lg font-medium text-blue-900">
                                            Azure Object Storage Parametrləri
                                        </h3>
                                        <p className="mt-1 text-sm text-blue-700">
                                            Microsoft Azure Portal-dan bağlantı məlumatlarını əldə edin
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Azure Connection String *
                                        </label>
                                        <textarea
                                            value={data.azure_connection_string}
                                            onChange={(e) => setData('azure_connection_string', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                            placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
                                        />
                                        {errors.azure_connection_string && (
                                            <p className="mt-1 text-sm text-red-600">{errors.azure_connection_string}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Container Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.azure_container}
                                            onChange={(e) => setData('azure_container', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="xpos"
                                        />
                                        {errors.azure_container && (
                                            <p className="mt-1 text-sm text-red-600">{errors.azure_container}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* S3/S3-Compatible Settings */}
                            {(data.storage_driver === 's3' || data.storage_driver === 's3-compatible') && (
                                <div className="space-y-6 border-t pt-6">
                                    <div className={`border rounded-lg p-4 ${
                                        data.storage_driver === 's3' ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'
                                    }`}>
                                        <h3 className={`text-lg font-medium ${
                                            data.storage_driver === 's3' ? 'text-orange-900' : 'text-purple-900'
                                        }`}>
                                            {data.storage_driver === 's3' ? 'AWS S3 Parametrləri' : 'S3-uyğun Servis Parametrləri'}
                                        </h3>
                                        <p className={`mt-1 text-sm ${
                                            data.storage_driver === 's3' ? 'text-orange-700' : 'text-purple-700'
                                        }`}>
                                            {data.storage_driver === 's3'
                                                ? 'AWS Console-dan API credentials əldə edin'
                                                : 'Backblaze, MinIO və ya digər S3-uyğun xidmət üçün məlumatları daxil edin'
                                            }
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Access Key ID *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.s3_access_key}
                                                onChange={(e) => setData('s3_access_key', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="AKIAIOSFODNN7EXAMPLE"
                                            />
                                            {errors.s3_access_key && (
                                                <p className="mt-1 text-sm text-red-600">{errors.s3_access_key}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Secret Access Key *
                                            </label>
                                            <input
                                                type="password"
                                                value={data.s3_secret_key}
                                                onChange={(e) => setData('s3_secret_key', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                            />
                                            {errors.s3_secret_key && (
                                                <p className="mt-1 text-sm text-red-600">{errors.s3_secret_key}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Bucket Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.s3_bucket}
                                                onChange={(e) => setData('s3_bucket', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="my-xpos-bucket"
                                            />
                                            {errors.s3_bucket && (
                                                <p className="mt-1 text-sm text-red-600">{errors.s3_bucket}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Region *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.s3_region}
                                                onChange={(e) => setData('s3_region', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="us-east-1"
                                            />
                                            {errors.s3_region && (
                                                <p className="mt-1 text-sm text-red-600">{errors.s3_region}</p>
                                            )}
                                        </div>
                                    </div>

                                    {data.storage_driver === 's3-compatible' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Endpoint URL *
                                                </label>
                                                <input
                                                    type="url"
                                                    value={data.s3_endpoint}
                                                    onChange={(e) => setData('s3_endpoint', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="https://s3.us-west-000.backblazeb2.com"
                                                />
                                                {errors.s3_endpoint && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.s3_endpoint}</p>
                                                )}
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Backblaze: https://s3.REGION.backblazeb2.com
                                                </p>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={data.s3_use_path_style_endpoint}
                                                    onChange={(e) => setData('s3_use_path_style_endpoint', e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label className="ml-2 text-sm text-gray-700">
                                                    Path Style Endpoint istifadə et (Backblaze üçün tövsiyə olunur)
                                                </label>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Custom URL (İxtiyari)
                                        </label>
                                        <input
                                            type="url"
                                            value={data.s3_url}
                                            onChange={(e) => setData('s3_url', e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://cdn.example.com"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            CDN və ya custom domain istifadə edirsinizsə
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Local Storage Notice */}
                            {data.storage_driver === 'local' && (
                                <div className="border-t pt-6">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-yellow-800">
                                                    Diqqət
                                                </h3>
                                                <div className="mt-2 text-sm text-yellow-700">
                                                    <p>
                                                        Lokal yaddaş yalnız inkişaf və test məqsədləri üçün tövsiyə olunur.
                                                        İstehsal mühiti üçün bulud yaddaşı (Azure, S3) istifadə edin.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Test Connection */}
                            {data.storage_driver !== 'local' && (
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Bağlantını Test Et
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Parametrləri yadda saxlamazdan əvvəl bağlantını test edin.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={testConnection}
                                        disabled={isTestingConnection}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isTestingConnection ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Test edilir...
                                            </>
                                        ) : (
                                            'Bağlantını Test Et'
                                        )}
                                    </button>

                                    {testResult && (
                                        <div className={`mt-4 p-4 rounded-md ${
                                            testResult.success
                                                ? 'bg-green-50 border border-green-200'
                                                : 'bg-red-50 border border-red-200'
                                        }`}>
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    {testResult.success ? (
                                                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <p className={`text-sm font-medium ${
                                                        testResult.success ? 'text-green-800' : 'text-red-800'
                                                    }`}>
                                                        {testResult.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Yenilənir...
                                        </>
                                    ) : (
                                        'Parametrləri Yadda Saxla'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
