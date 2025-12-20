import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface TelegramLog {
    id: number;
    chat_id: string;
    message: string;
    status: 'pending' | 'sent' | 'failed';
    response: string | null;
    error_message: string | null;
    message_id: number | null;
    created_at: string;
}

interface TelegramLogsProps extends PageProps {
    logs: TelegramLog[];
}

export default function Logs({ auth, logs }: TelegramLogsProps) {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            sent: {
                class: 'bg-green-100 text-green-800',
                text: 'Göndərildi'
            },
            failed: {
                class: 'bg-red-100 text-red-800',
                text: 'Uğursuz'
            },
            pending: {
                class: 'bg-yellow-100 text-yellow-800',
                text: 'Gözləyir'
            }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('az-AZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <AuthenticatedLayout
        >
            <Head title="Telegram Logları" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {logs.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        Heç bir Telegram loqu yoxdur
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Göndərdiyiniz Telegram mesajları burada görünəcək.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tarix
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Chat ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mesaj
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Detallar
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(log.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                        {log.chat_id}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <div className="max-w-xs truncate" title={log.message}>
                                                            {log.message}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {getStatusBadge(log.status)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {log.status === 'sent' && log.message_id && (
                                                            <div className="text-green-600">
                                                                Message ID: {log.message_id}
                                                            </div>
                                                        )}
                                                        {log.status === 'failed' && log.error_message && (
                                                            <div className="text-red-600 max-w-xs truncate" title={log.error_message}>
                                                                Xəta: {log.error_message}
                                                            </div>
                                                        )}
                                                        {log.status === 'pending' && (
                                                            <div className="text-yellow-600">
                                                                Göndərilir...
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Məlumat
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Son 50 Telegram loqu göstərilir</li>
                            <li>Loglar son göndərilənlərdən əvvəlkilərə doğru sıralanır</li>
                            <li>Hər log mesajın statusunu və detallarını göstərir</li>
                            <li>Mənfi Chat ID kanal/qrup bildirişlərini göstərir</li>
                        </ul>
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}
