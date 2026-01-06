import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { BulkAction } from '@/Components/SharedDataTable';
import { WarehouseTransfer } from '@/types';
// Using hardcoded Azerbaijani strings like other pages in the application
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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

    // Handle double-click to view transfer
    const handleRowDoubleClick = (transfer: WarehouseTransfer) => {
        router.visit(route('warehouse-transfers.show', transfer.transfer_id));
    };

    // Bulk delete handler
    const handleBulkDelete = (selectedIds: (string | number)[]) => {
        const confirmMessage = `Seçilmiş ${selectedIds.length} transferi silmək istədiyinizə əminsiniz?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        router.post(route('warehouse-transfers.bulk-delete') as any, {
            ids: selectedIds
        }, {
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
    const getBulkActions = (selectedIds: (string | number)[], selectedTransfers: WarehouseTransfer[]): BulkAction[] => {
        // If only ONE transfer is selected, show individual actions
        if (selectedIds.length === 1 && selectedTransfers.length === 1) {
            const transfer = selectedTransfers[0];

            return [
                {
                    label: 'Bax',
                    icon: <EyeIcon className="w-4 h-4" />,
                    variant: 'view' as const,
                    onClick: () => router.visit(route('warehouse-transfers.show', transfer.transfer_id))
                },
                {
                    label: 'Redaktə et',
                    icon: <PencilIcon className="w-4 h-4" />,
                    variant: 'edit' as const,
                    onClick: () => router.visit(route('warehouse-transfers.edit', transfer.transfer_id))
                },
                {
                    label: 'Sil',
                    icon: <TrashIcon className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                        if (confirm('Bu transferi silmək istədiyinizə əminsiniz?')) {
                            router.delete(route('warehouse-transfers.destroy', transfer.transfer_id));
                        }
                    }
                }
            ];
        }

        // Multiple transfers selected - show bulk actions
        return [
            {
                label: 'Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'danger' as const,
                onClick: handleBulkDelete
            }
        ];
    };

    return (
        <AuthenticatedLayout>
            <Head title="Anbar Transferləri" />
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
                        selectable={true}
                        bulkActions={getBulkActions}
                        searchPlaceholder="Transferləri axtar"
                        emptyState={{
                            title: 'Transfer tapılmadı',
                            description: 'Hələ heç bir transfer yoxdur'
                        }}
                        fullWidth={true}
                        onRowDoubleClick={handleRowDoubleClick}
                        rowClassName={(transfer: WarehouseTransfer) =>
                            `cursor-pointer hover:bg-blue-50 transition-all duration-200`
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
