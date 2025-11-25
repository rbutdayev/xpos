import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface StorageSettings {
    azure_connection_string: string;
    azure_container: string;
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

    return (
        <>
            <Head title="Azure Blob Storage Parametrləri" />
            
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Azure Blob Storage Parametrləri
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Microsoft Azure Blob Storage bağlantısını konfiqurasiya edin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Navigation */}
                    <SuperAdminNav />

                    <div className="bg-white shadow-sm rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Azure Storage Banner */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-blue-900">
                                            Microsoft Azure Blob Storage
                                        </h3>
                                        <p className="mt-1 text-sm text-blue-700">
                                            Bütün fayllar və sənədlər Azure Blob Storage-da saxlanılır. Etibarlı və təhlükəsiz bulud yaddaşı.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Azure Settings */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Azure Storage Connection String *
                                    </label>
                                    <textarea
                                        value={data.azure_connection_string}
                                        onChange={(e) => setData('azure_connection_string', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                        placeholder="DefaultEndpointsProtocol=https;AccountName=youraccountname;AccountKey=youraccountkey;EndpointSuffix=core.windows.net"
                                        required
                                    />
                                    {errors.azure_connection_string && (
                                        <p className="mt-1 text-sm text-red-600">{errors.azure_connection_string}</p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500">
                                        Azure Portal → Storage Account → Access Keys bölməsindən connection string-i kopyalayın
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Container Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.azure_container}
                                        onChange={(e) => setData('azure_container', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="xPOS"
                                        required
                                    />
                                    {errors.azure_container && (
                                        <p className="mt-1 text-sm text-red-600">{errors.azure_container}</p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        Azure Storage Account-da yaradılmış container adını daxil edin
                                    </p>
                                </div>
                            </div>

                            {/* Test Connection */}
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
                                    disabled={isTestingConnection || !data.azure_connection_string || !data.azure_container}
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

                                {/* Test Result */}
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

                    {/* Help Section */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-blue-900 mb-4">
                            <svg className="inline-block w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            Azure Storage Quraşdırma Təlimatı
                        </h3>
                        <div className="space-y-4 text-sm text-blue-800">
                            <div>
                                <h4 className="font-medium">1. Azure Portal-a daxil olun:</h4>
                                <p>https://portal.azure.com adresinə keçin və hesabınızla daxil olun.</p>
                            </div>
                            <div>
                                <h4 className="font-medium">2. Storage Account yaradın:</h4>
                                <p>Create a resource → Storage → Storage account seçin və lazımi məlumatları doldurub yaradın.</p>
                            </div>
                            <div>
                                <h4 className="font-medium">3. Container yaradın:</h4>
                                <p>Storage account → Containers → + Container düyməsinə basaraq "xPOS" adında container yaradın.</p>
                            </div>
                            <div>
                                <h4 className="font-medium">4. Connection String əldə edin:</h4>
                                <p>Storage account → Settings → Access keys → Connection string-i kopyalayın.</p>
                            </div>
                            <div>
                                <h4 className="font-medium">5. Təhlükəsizlik:</h4>
                                <p>Bütün bağlantı məlumatları şifrələnmiş formada saxlanılır və yalnız sistem tərəfindən istifadə edilir.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}