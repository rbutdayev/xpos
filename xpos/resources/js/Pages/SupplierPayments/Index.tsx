import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';
import { tableConfig } from '@/Components/TableConfigurations';
import { 
    TruckIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface SupplierPayment {
    payment_id: number;
    reference_number: string;
    amount: number;
    description: string;
    payment_date: string;
    payment_method: string;
    invoice_number: string | null;
    notes: string | null;
    supplier: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface Props {
    payments: {
        data: SupplierPayment[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    suppliers: Array<{
        id: number;
        name: string;
    }>;
    filters: {
        search?: string;
        supplier_id?: string;
        payment_method?: string;
        start_date?: string;
        end_date?: string;
    };
    paymentMethods: Record<string, string>;
}

export default function Index({ payments, suppliers, filters, paymentMethods }: Props) {
    const [selectedPayments, setSelectedPayments] = useState<number[]>([]);

    const filterOptions: Filter[] = [
        {
            key: 'supplier_id',
            label: 'Təchizatçı',
            type: 'dropdown',
            value: filters.supplier_id || '',
            options: [
                { value: '', label: 'Bütün təchizatçılar' },
                ...suppliers.map(supplier => ({
                    value: supplier.id.toString(),
                    label: supplier.name
                }))
            ],
            onChange: (value: string) => {}
        },
        {
            key: 'payment_method',
            label: 'Ödəniş üsulu',
            type: 'dropdown',
            value: filters.payment_method || '',
            options: [
                { value: '', label: 'Bütün ödəniş üsulları' },
                ...Object.entries(paymentMethods).map(([key, value]) => ({
                    value: key,
                    label: value
                }))
            ],
            onChange: (value: string) => {}
        },
        {
            key: 'start_date',
            label: 'Başlanğıc tarixi',
            type: 'date',
            value: filters.start_date || '',
            onChange: (value: string) => {}
        },
        {
            key: 'end_date',
            label: 'Bitiş tarixi',
            type: 'date',
            value: filters.end_date || '',
            onChange: (value: string) => {}
        }
    ];

    const actions: Action[] = [
        {
            label: 'Bax',
            onClick: (payment: SupplierPayment) => router.get(`/supplier-payments/${payment.payment_id}`),
            variant: 'view'
        },
        {
            label: 'Düzəliş',
            onClick: (payment: SupplierPayment) => router.get(`/supplier-payments/${payment.payment_id}/edit`),
            variant: 'edit'
        },
        {
            label: 'Sil',
            onClick: (payment: SupplierPayment) => {
                if (confirm('Silməyə əminsiniz?')) {
                    router.delete(`/supplier-payments/${payment.payment_id}`);
                }
            },
            variant: 'delete'
        }
    ];

    const handleBulkAction = (action: string, selectedIds: number[]) => {
        if (action === 'delete') {
            if (confirm('Silməyə əminsiniz?')) {
                router.post('/supplier-payments/bulk-delete', {
                    ids: selectedIds
                });
            }
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <TruckIcon className="w-8 h-8 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Təchizatçı Ödənişləri
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Təchizatçı Ödənişləri" />

            <div className="py-12">
                <div className="w-full">
                    <SharedDataTable
                        data={payments}
                        columns={tableConfig.supplierPayments.columns}
                        searchValue={filters.search || ''}
                        searchPlaceholder={tableConfig.supplierPayments.searchPlaceholder}
                        filters={filterOptions}
                        actions={actions}
                        createButton={{
                            label: tableConfig.supplierPayments.createButtonText,
                            href: '/supplier-payments/create'
                        }}
                        emptyState={{
                            title: tableConfig.supplierPayments.emptyStateTitle,
                            description: tableConfig.supplierPayments.emptyStateDescription
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