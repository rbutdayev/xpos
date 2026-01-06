import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { auditLogTableConfig } from '@/Components/TableConfigurations';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

interface AuditLog {
    log_id: number;
    action: string;
    model_type: string;
    model_id: string | null;
    description: string | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    auditLogs: {
        data: AuditLog[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    users: Array<{id: number; name: string}>;
    actions: string[];
    modelTypes: string[];
    filters: {
        search?: string;
        action?: string;
        model_type?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function Index({ auditLogs, users, actions, modelTypes, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [actionValue, setActionValue] = useState(filters.action || '');
    const [modelTypeValue, setModelTypeValue] = useState(filters.model_type || '');
    const [userIdValue, setUserIdValue] = useState(filters.user_id || '');
    const [dateFromValue, setDateFromValue] = useState(filters.date_from || '');
    const [dateToValue, setDateToValue] = useState(filters.date_to || '');

    const handleSearch = () => {
        router.get('/audit-logs', {
            search: searchValue,
            action: actionValue,
            model_type: modelTypeValue,
            user_id: userIdValue,
            date_from: dateFromValue,
            date_to: dateToValue
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearchValue('');
        setActionValue('');
        setModelTypeValue('');
        setUserIdValue('');
        setDateFromValue('');
        setDateToValue('');
        router.get('/audit-logs', {}, {
            preserveState: true,
            replace: true,
        });
    };

    // Handle double-click to view audit log
    const handleRowDoubleClick = (auditLog: AuditLog) => {
        router.visit(`/audit-logs/${auditLog.log_id}`);
    };

    // Handle bulk delete for selected audit logs
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `${selectedIds.length} audit log silinəcək. Əminsiniz?`;

        if (confirm(confirmMessage)) {
            router.delete('/audit-logs/bulk-delete', {
                data: { ids: selectedIds },
                onError: (errors) => {
                    alert('Audit logları silərkən xəta baş verdi');
                },
                preserveScroll: true
            });
        }
    };

    // Get bulk actions - dynamic based on selection
    const getBulkActions = (selectedIds: (string | number)[], selectedLogs: AuditLog[]): BulkAction[] => {
        // If only ONE log is selected, show individual actions
        if (selectedIds.length === 1 && selectedLogs.length === 1) {
            const auditLog = selectedLogs[0];

            return [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(`/audit-logs/${auditLog.log_id}`)
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleBulkDelete([auditLog.log_id])
                }
            ];
        }

        // Multiple logs selected - show bulk delete only
        return [
            {
                label: 'Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    const tableFilters = [
        {
            key: 'action',
            type: 'dropdown' as const,
            label: 'Hadisə',
            value: actionValue,
            onChange: setActionValue,
            options: [
                { value: '', label: 'Bütün növlər' },
                ...actions.map(action => ({
                    value: action,
                    label: action
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'model_type',
            type: 'dropdown' as const,
            label: 'Model növü',
            value: modelTypeValue,
            onChange: setModelTypeValue,
            options: [
                { value: '', label: 'Bütün növlər' },
                ...modelTypes.map(type => ({
                    value: type,
                    label: type
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'user_id',
            type: 'dropdown' as const,
            label: 'İstifadəçi',
            value: userIdValue,
            onChange: setUserIdValue,
            options: [
                { value: '', label: 'Hamısı' } ,
                ...users.map(user => ({
                    value: user.id.toString(),
                    label: user.name
                }))
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'date_from',
            type: 'date' as const,
            label: 'Başlanğıc tarixi',
            value: dateFromValue,
            onChange: setDateFromValue,
            className: 'min-w-[150px]'
        },
        {
            key: 'date_to',
            type: 'date' as const,
            label: 'Bitiş tarixi',
            value: dateToValue,
            onChange: setDateToValue,
            className: 'min-w-[150px]'
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Audit Loglar" />

            <div className="py-6">
                <div className="w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Audit Loglar</h1>
                        <p className="text-gray-600">Bütün sistem fəaliyyətlərini izləyin və monitorinq edin</p>
                    </div>

                    <SharedDataTable
                        data={auditLogs}
                        columns={auditLogTableConfig.columns}
                        selectable={true}
                        bulkActions={getBulkActions}
                        title="Audit Loglar"
                        searchPlaceholder="Audit logları axtar..."
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        filters={tableFilters}
                        onSearch={handleSearch}
                        onReset={handleReset}
                        emptyState={{
                            title: 'Audit log tapılmadı',
                            description: 'Hələlik sistem fəaliyyət qeydi mövcud deyil'
                        }}
                        fullWidth={true}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={() => 'cursor-pointer hover:bg-blue-50 transition-all duration-200'}
                        mobileClickable={true}
                        hideMobileActions={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}