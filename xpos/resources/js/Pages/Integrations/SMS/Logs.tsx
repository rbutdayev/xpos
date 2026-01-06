import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import SharedDataTable, { Column, BulkAction } from '@/Components/SharedDataTable';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface SmsLog {
    id: number;
    phone_number: string;
    message: string;
    sender_name: string;
    status: 'pending' | 'sent' | 'failed';
    response: string | null;
    error_message: string | null;
    sent_at: string | null;
    created_at: string;
}

interface SmsLogsProps extends PageProps {
    logs: {
        data: SmsLog[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
}

export default function Logs({ auth, logs }: SmsLogsProps) {
    const { t } = useTranslation(['integrations', 'common']);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            sent: {
                class: 'bg-green-100 text-green-800',
                text: (t as any)('common:status.sent') || 'Göndərildi'
            },
            failed: {
                class: 'bg-red-100 text-red-800',
                text: (t as any)('common:status.failed') || 'Uğursuz'
            },
            pending: {
                class: 'bg-yellow-100 text-yellow-800',
                text: (t as any)('common:status.pending') || 'Gözləyir'
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

    const columns: Column[] = [
        {
            key: 'created_at',
            label: 'Tarix',
            sortable: true,
            render: (log: SmsLog) => (
                <div className="text-sm text-gray-900">
                    {formatDate(log.created_at)}
                </div>
            ),
        },
        {
            key: 'phone_number',
            label: 'Telefon',
            render: (log: SmsLog) => (
                <div className="text-sm text-gray-900">
                    {log.phone_number}
                </div>
            ),
        },
        {
            key: 'message',
            label: 'Mesaj',
            render: (log: SmsLog) => (
                <div className="max-w-xs truncate text-sm text-gray-900" title={log.message}>
                    {log.message}
                </div>
            ),
        },
        {
            key: 'sender_name',
            label: 'Göndərən',
            hideOnMobile: true,
            render: (log: SmsLog) => (
                <div className="text-sm text-gray-900">
                    {log.sender_name}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (log: SmsLog) => getStatusBadge(log.status),
        },
        {
            key: 'details',
            label: 'Detallar',
            hideOnMobile: true,
            render: (log: SmsLog) => (
                <div className="text-sm">
                    {log.status === 'sent' && log.sent_at && (
                        <div className="text-green-600">
                            Göndərildi: {formatDate(log.sent_at)}
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
                </div>
            ),
        },
    ];

    // Handle double-click to view log details
    const handleRowDoubleClick = (log: SmsLog) => {
        // Show details modal or alert
        const details = `
SMS Log Details:
-----------------
Phone: ${log.phone_number}
Message: ${log.message}
Sender: ${log.sender_name}
Status: ${log.status}
Created: ${formatDate(log.created_at)}
${log.sent_at ? `Sent: ${formatDate(log.sent_at)}` : ''}
${log.error_message ? `Error: ${log.error_message}` : ''}
${log.response ? `Response: ${log.response}` : ''}
        `.trim();
        alert(details);
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} SMS loqu silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.delete('/sms/bulk-delete', {
            data: { ids: selectedIds },
            onSuccess: () => {
                // Success message handled by backend
            },
            onError: (errors: any) => {
                alert('Xəta baş verdi');
            },
            preserveScroll: true
        });
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedLogs: SmsLog[]): BulkAction[] => {
        // If only ONE log is selected, show individual actions
        if (selectedIds.length === 1 && selectedLogs.length === 1) {
            const log = selectedLogs[0];

            return [
                {
                    label: 'Baxış',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => handleRowDoubleClick(log)
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm('SMS loqunu silmək istədiyinizə əminsiniz?')) {
                            router.delete(`/sms/${log.id}`);
                        }
                    }
                }
            ];
        }

        // Multiple logs selected - show bulk actions
        return [
            {
                label: 'Toplu Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    return (
        <AuthenticatedLayout>
            <Head title="SMS Logları" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Məlumat
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>SMS logları göstərilir</li>
                        <li>Loglar son göndərilənlərdən əvvəlkilərə doğru sıralanır</li>
                        <li>Hər log mesajın statusunu və detallarını göstərir</li>
                        <li>Bir loqa iki dəfə klikləyərək detalları görə bilərsiniz</li>
                    </ul>
                </div>

                <SharedDataTable
                    data={logs}
                    columns={columns}
                    selectable={true}
                    bulkActions={getBulkActions}
                    emptyState={{
                        icon: (
                            <svg
                                className="w-12 h-12 text-gray-400"
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
                        ),
                        title: 'Heç bir SMS loqu yoxdur',
                        description: 'Göndərdiyiniz SMS-lər burada görünəcək.',
                    }}
                    onRowDoubleClick={handleRowDoubleClick}
                    rowClassName={() => 'cursor-pointer hover:bg-blue-50 transition-all duration-200'}
                    fullWidth={true}
                    dense={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}
