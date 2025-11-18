import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';


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
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Xəbərdarlıqlar
                </h2>
            }
        >
            <Head title="Xəbərdarlıqlar" />

            <div className="py-12">
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
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}