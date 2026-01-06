import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { EyeIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';


interface Alert {
    alert_id: number;
    warehouse: {
        id: number;
        name: string;
    };
    product: {
        id: number;
        name: string;
        sku: string;
    };
    alert_type: string;
    alert_message: string;
    alert_date: string;
    status: string;
    resolved_by?: {
        id: number;
        name: string;
    };
    resolved_at?: string;
}

interface Props {
    alerts: {
        data: Alert[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
}

export default function Index({ alerts }: Props) {
    // Handle double-click to view alert details
    const handleRowDoubleClick = (alert: Alert) => {
        router.visit(`/alerts/${alert.alert_id}`);
    };

    // Handle bulk delete
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        if (confirm(`Seçilmiş ${selectedIds.length} xəbərdarlığı silmək istədiyinizdən əminsiniz?`)) {
            router.delete('/alerts/bulk-delete', {
                data: { ids: selectedIds },
                onError: (errors) => {
                    window.alert('Xəta baş verdi. Xəbərdarlıqlar silinə bilmədi.');
                },
                preserveScroll: true
            });
        }
    };

    // Handle bulk resolve
    const handleBulkResolve = (selectedIds: (string | number)[]) => {
        if (confirm(`Seçilmiş ${selectedIds.length} xəbərdarlığı həll edilmiş kimi qeyd etmək istədiyinizdən əminsiniz?`)) {
            router.post('/alerts/bulk-resolve', {
                ids: selectedIds,
            }, {
                onError: (errors) => {
                    window.alert('Xəta baş verdi. Xəbərdarlıqlar həll edilə bilmədi.');
                },
                preserveScroll: true
            });
        }
    };

    // Delete single alert
    const deleteAlert = (alertItem: Alert) => {
        if (confirm(`Xəbərdarlıq #${alertItem.alert_id} silmək istədiyinizdən əminsiniz?`)) {
            router.delete(`/alerts/${alertItem.alert_id}`, {
                onError: (errors) => {
                    window.alert('Xəbərdarlıq silinə bilmədi.');
                }
            });
        }
    };

    // Resolve single alert
    const resolveAlert = (alertItem: Alert) => {
        if (confirm(`Xəbərdarlıq #${alertItem.alert_id} həll edilmiş kimi qeyd etmək istədiyinizdən əminsiniz?`)) {
            router.patch(`/alerts/${alertItem.alert_id}/resolve`, {}, {
                onError: (errors) => {
                    window.alert('Xəbərdarlıq həll edilə bilmədi.');
                },
                preserveScroll: true
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedAlerts: Alert[]): BulkAction[] => {
        // If only ONE alert is selected, show individual actions
        if (selectedIds.length === 1 && selectedAlerts.length === 1) {
            const alert = selectedAlerts[0];
            const actions: BulkAction[] = [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/alerts/${alert.alert_id}`)
                }
            ];

            // Only show resolve option if alert is not already resolved
            if (alert.status !== 'resolved') {
                actions.push({
                    label: 'Həll Et',
                    icon: <CheckCircleIcon className="w-4 h-4" />,
                    variant: 'success' as const,
                    onClick: () => resolveAlert(alert)
                });
            }

            actions.push({
                label: 'Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: () => deleteAlert(alert)
            });

            return actions;
        }

        // Multiple alerts selected - show bulk actions
        const bulkActions: BulkAction[] = [];

        // Check if any unresolved alerts exist in selection
        const hasUnresolvedAlerts = selectedAlerts.some(alert => alert.status !== 'resolved');

        if (hasUnresolvedAlerts) {
            bulkActions.push({
                label: 'Toplu Həll Et',
                icon: <CheckCircleIcon className="w-4 h-4" />,
                variant: 'success' as const,
                onClick: handleBulkResolve
            });
        }

        bulkActions.push({
            label: 'Toplu Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger' as const,
            onClick: handleBulkDelete
        });

        return bulkActions;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Xəbərdarlıqlar" />
            <div className="pb-12">
                <div className="w-full">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <SharedDataTable
                                data={alerts}
                                columns={tableConfig.alerts.columns}
                                actions={tableConfig.alerts.actions}
                                title="Xəbərdarlıqlar"
                                searchPlaceholder={tableConfig.alerts.searchPlaceholder}
                                emptyState={{
                                    title: tableConfig.alerts.emptyStateTitle,
                                    description: tableConfig.alerts.emptyStateDescription
                                }}
                                fullWidth={true}
                                mobileClickable={true}
                                hideMobileActions={true}
                                selectable={true}
                                bulkActions={getBulkActions}
                                onRowDoubleClick={handleRowDoubleClick}
                                rowClassName={(alert: Alert) =>
                                    `cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                                        alert.status === 'resolved' ? 'opacity-60' : ''
                                    }`
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}