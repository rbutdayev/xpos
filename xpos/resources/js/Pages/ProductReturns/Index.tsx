import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { ProductReturn } from '@/types';


interface Props {
    returns: {
        data: ProductReturn[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export default function Index({ returns }: Props) {
    const handleDelete = (productReturn: ProductReturn) => {
        if (confirm('Silmək istədiyinizdən əminsiniz?')) {
            router.delete(route('product-returns.destroy', productReturn.return_id));
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'gozlemede': { label: 'Gözləmədə', color: 'bg-yellow-100 text-yellow-800' },
            'tesdiq_edilib': { label: 'Təsdiq edilib', color: 'bg-blue-100 text-blue-800' },
            'gonderildi': { label: 'Göndərildi', color: 'bg-purple-100 text-purple-800' },
            'tamamlanib': { label: 'Tamamlanıb', color: 'bg-green-100 text-green-800' },
            'ləğv_edildi': { label: 'Ləğv edildi', color: 'bg-red-100 text-red-800' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['gozlemede'];
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
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
            key: 'return_id',
            label: 'Qaytarma ID',
            render: (productReturn: ProductReturn) => `#${productReturn.return_id}`
        },
        {
            key: 'supplier',
            label: 'Təchizatçı',
            render: (productReturn: ProductReturn) => productReturn.supplier?.name || '-'
        },
        {
            key: 'product',
            label: 'Məhsul(lar)',
            render: (productReturn: ProductReturn) => {
                // Check if it's a multi-item return
                if (productReturn.items && productReturn.items.length > 0) {
                    if (productReturn.items.length === 1) {
                        return productReturn.items[0].product?.name || '-';
                    }
                    return `${productReturn.items.length} məhsul`;
                }
                // Fallback to single product (legacy)
                return productReturn.product?.name || '-';
            }
        },
        {
            key: 'quantity',
            label: 'Miqdar',
            render: (productReturn: ProductReturn) => {
                // Check if it's a multi-item return
                if (productReturn.items && productReturn.items.length > 0) {
                    const totalQty = productReturn.items.reduce((sum, item) => sum + parseFloat(item.quantity || '0'), 0);
                    return totalQty.toFixed(3);
                }
                // Fallback to single quantity (legacy)
                return productReturn.quantity || 0;
            }
        },
        {
            key: 'total_cost',
            label: 'Ümumi məbləğ',
            render: (productReturn: ProductReturn) => formatCurrency(productReturn.total_cost)
        },
        {
            key: 'status',
            label: 'Status',
            render: (productReturn: ProductReturn) => getStatusBadge(productReturn.status)
        },
        {
            key: 'return_date',
            label: 'Qaytarma tarixi',
            render: (productReturn: ProductReturn) => new Date(productReturn.return_date).toLocaleDateString('az-AZ')
        },
        {
            key: 'reason',
            label: 'Qaytarma səbəbi',
            render: (productReturn: ProductReturn) => productReturn.reason.length > 50
                ? productReturn.reason.substring(0, 50) + '...'
                : productReturn.reason
        }
    ];

    const actions = [
        {
            label: 'Bax',
            href: (productReturn: ProductReturn) => route('product-returns.show', productReturn.return_id),
            variant: 'view' as const
        },
        {
            label: 'Sil',
            onClick: handleDelete,
            variant: 'delete' as const
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Məhsul Qaytarmaları" />

            <div className="w-full">
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Məhsul Qaytarmaları
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Təchizatçıya qaytarma
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href={route('product-returns.create')}
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Qaytarma əlavə et
                        </Link>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <SharedDataTable
                        data={returns}
                        columns={columns}
                        actions={actions}
                        searchPlaceholder="Axtarış..."
                        emptyState={{
                            title: "Heç bir xəbərdarlıq tapılmadı",
                            description: "Hal-hazırda aktiv xəbərdarlıq yoxdur"
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