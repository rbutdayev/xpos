import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';

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
    providers: Provider[];
}

export default function Index({ providers }: Props) {
    return (
        <SuperAdminLayout title="Fiskal Printer Provayderləri">
            <Head title="Fiskal Printer Provayderləri - Super Admin" />

                    {/* Providers Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Provayderlərin API Konfiqurasiyası</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Port</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Base Path</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Print Endpoint</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Endpoint</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Əməliyyatlar</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {providers.map((provider) => (
                                        <tr key={provider.id}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{provider.name}</span>
                                                    <span className="text-xs text-gray-500">{provider.code}</span>
                                                    <span className="text-xs text-gray-400 mt-1">{provider.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {provider.default_port}
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{provider.api_base_path}</code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{provider.print_endpoint}</code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{provider.status_endpoint}</code>
                                            </td>
                                            <td className="px-6 py-4">
                                                {provider.is_active ? (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        Aktiv
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                        Deaktiv
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <a
                                                    href={`/admin/fiscal-printer-providers/${provider.id}/edit`}
                                                    className="text-slate-600 hover:text-slate-900 font-medium"
                                                >
                                                    Redaktə et
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Example URL Display */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Nümunə URL formatı:</h3>
                            <code className="text-xs bg-white px-3 py-2 rounded border border-gray-200 block">
                                http://192.168.1.100:PORT/API_BASE_PATH/ENDPOINT
                            </code>
                            <p className="text-xs text-gray-500 mt-2">
                                Məsələn: http://192.168.1.100:9898/api/print
                            </p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">API URL-lərini konfiqurasiya edin</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Hər bir fiskal printer provayderinin API endpoint-lərini buradan dəyişə bilərsiniz.
                                    Real API dokumentasiyasını əldə etdikdən sonra düzgün URL-ləri daxil edin.
                                </p>
                            </div>
                        </div>
                    </div>
        </SuperAdminLayout>
    );
}
