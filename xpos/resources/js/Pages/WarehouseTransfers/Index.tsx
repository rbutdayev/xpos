import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { WarehouseTransfer } from '@/types';
// Using hardcoded Azerbaijani strings like other pages in the application
import { EyeIcon } from '@heroicons/react/24/outline';
import InventoryNavigation from '@/Components/InventoryNavigation';

interface Props {
    transfers: {
        data: WarehouseTransfer[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    }; 
}

export default function Index({ transfers }: Props) {


    const getStatusBadge = () => {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Tamamlanıb
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(amount);
    };

    const columns = [
        {
            key: 'transfer_id',
            label: 'Transfer ID',
            render: (transfer: WarehouseTransfer) => `#${transfer.transfer_id}`
        },
        {
            key: 'from_warehouse',
            label: 'Haradan',
            render: (transfer: WarehouseTransfer) => transfer.from_warehouse?.name || '-'
        },
        {
            key: 'to_warehouse',
            label: 'Hara',
            render: (transfer: WarehouseTransfer) => transfer.to_warehouse?.name || '-'
        },
        {
            key: 'product',
            label: 'Məhsul',
            render: (transfer: WarehouseTransfer) => transfer.product?.name || '-'
        },
        {
            key: 'quantity',
            label: 'Miqdar',
            render: (transfer: WarehouseTransfer) => transfer.quantity
        },
        {
            key: 'total_cost',
            label: 'Ümumi Dəyər',
            render: (transfer: WarehouseTransfer) => formatCurrency(transfer.total_cost)
        },
        {
            key: 'status',
            label: 'Status',
            render: () => getStatusBadge()
        },
        {
            key: 'requested_at',
            label: 'Transfer Tarixi',
            render: (transfer: WarehouseTransfer) => {
                const d = (transfer as any).requested_at || transfer.created_at;
                return d ? new Date(d).toLocaleDateString('az-AZ') : '-';
            }
        }
    ];

    const actions = [
        {
            label: 'Bax',
            href: (transfer: WarehouseTransfer) => route('warehouse-transfers.show', transfer.transfer_id),
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'view' as const
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Anbar Transferləri" />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <InventoryNavigation currentRoute="warehouse-transfers" />
            </div>
            <div className="w-full">
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Anbar Transferləri
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Anbarlar arasında məhsul transferi
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href={route('warehouse-transfers.create')}
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Transfer Əlavə Et
                        </Link>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <SharedDataTable
                        data={transfers}
                        columns={columns}
                        actions={actions}
                        searchPlaceholder="Transferləri axtar"
                        emptyState={{
                            title: 'Transfer tapılmadı',
                            description: 'Hələ heç bir transfer yoxdur'
                        }}
                        fullWidth={true}

                        mobileClickable={true}

                        hideMobileActions={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
