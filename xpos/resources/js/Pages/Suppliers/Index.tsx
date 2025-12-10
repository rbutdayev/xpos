import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Supplier, Product } from '@/types';
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    TruckIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';
import SharedDataTable from '@/Components/SharedDataTable';
import { supplierTableConfig } from '@/Components/TableConfigurations';
import SupplierProductSelector from '@/Components/SupplierProductSelector';
import { useTranslation } from 'react-i18next';

interface Props {
    suppliers: {
        data: Supplier[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ suppliers, filters }: Props) {
    const { t } = useTranslation(['suppliers', 'common']);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
    const [showProducts, setShowProducts] = useState(false);

    const handleSearch = () => {
        router.get(route('suppliers.index'), { search, status }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        router.get(route('suppliers.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const deleteSupplier = (supplier: Supplier) => {
        if (confirm(t('messages.confirmDelete', { name: supplier.name }))) {
            router.delete(route('suppliers.destroy', supplier.id));
        }
    };

    const viewSupplierProducts = async (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setShowProducts(true);
        try {
            const response = await fetch(route('suppliers.products', supplier.id));
            const products = await response.json();
            setSupplierProducts(products);
        } catch (error) {
            console.error('Error fetching supplier products:', error);
            setSupplierProducts([]);
        }
    };

    const tableFilters = [
        {
            key: 'status',
            type: 'dropdown' as const,
            label: t('labels.status', { ns: 'common' }),
            value: status,
            onChange: setStatus,
            options: [
                { value: '', label: t('status.all') },
                { value: 'active', label: t('status.active') },
                { value: 'inactive', label: t('status.inactive') }
            ]
        }
    ];

    const tableActions = [
        {
            label: t('actions.view'),
            href: (supplier: Supplier) => route('suppliers.show', supplier.id),
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'view' as const
        },
        {
            label: t('actions.products'),
            icon: <ShoppingBagIcon className="w-4 h-4" />,
            variant: 'secondary' as const,
            onClick: viewSupplierProducts
        },
        {
            label: t('actions.edit'),
            href: (supplier: Supplier) => route('suppliers.edit', supplier.id),
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'edit' as const
        },
        {
            label: t('actions.delete'),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'delete' as const,
            onClick: deleteSupplier
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />

            <div className="w-full">
                <SharedDataTable
                    data={suppliers}
                    columns={supplierTableConfig.columns}
                    actions={tableActions}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={t('placeholders.search')}
                    filters={tableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    title={t('title')}
                    subtitle={t('manageSuppliers')}
                    createButton={{
                        label: t('newSupplier'),
                        href: route('suppliers.create')
                    }}
                    emptyState={{
                        icon: <TruckIcon className="w-12 h-12" />,
                        title: t('emptyState.title'),
                        description: t('emptyState.description')
                    }}
                    fullWidth={true}

                    mobileClickable={true}

                    hideMobileActions={true}
                />
            </div>

            {/* Products Modal */}
            {showProducts && selectedSupplier && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div 
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => setShowProducts(false)}
                        ></div>

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {t('products.title', { name: selectedSupplier.name })}
                                    </h3>
                                    <button
                                        onClick={() => setShowProducts(false)}
                                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <span className="sr-only">{t('actions.close')}</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {supplierProducts.length > 0 ? (
                                    <SharedDataTable
                                        data={{
                                            data: supplierProducts,
                                            links: [],
                                            current_page: 1,
                                            last_page: 1,
                                            total: supplierProducts.length,
                                            per_page: supplierProducts.length,
                                            from: 1,
                                            to: supplierProducts.length
                                        }}
                                        columns={[
                                            {
                                                key: 'name',
                                                label: t('products.productName'),
                                                sortable: true,
                                                render: (product: any) => (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                        {product.sku && (
                                                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                        )}
                                                    </div>
                                                )
                                            },
                                            {
                                                key: 'pricing',
                                                label: t('products.price'),
                                                sortable: true,
                                                render: (product: any) => (
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {new Intl.NumberFormat('az-AZ', {
                                                                style: 'currency',
                                                                currency: 'AZN'
                                                            }).format(product.pivot?.supplier_price || 0)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {t('products.averagePrice')}
                                                        </div>
                                                    </div>
                                                )
                                            },
                                            {
                                                key: 'latest_price',
                                                label: t('products.lastPrice'),
                                                render: (product: any) => (
                                                    <span className="text-sm text-gray-700">
                                                        {new Intl.NumberFormat('az-AZ', {
                                                            style: 'currency',
                                                            currency: 'AZN'
                                                        }).format(product.pivot?.latest_price || 0)}
                                                    </span>
                                                )
                                            },
                                            {
                                                key: 'quantity',
                                                label: t('products.totalPurchased'),
                                                render: (product: any) => (
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {product.pivot?.total_purchased || 0}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {t('products.times', { count: product.pivot?.purchase_count || 0 })}
                                                        </div>
                                                    </div>
                                                )
                                            },
                                            {
                                                key: 'last_purchase',
                                                label: t('products.lastPurchase'),
                                                render: (product: any) => (
                                                    <span className="text-sm text-gray-500">
                                                        {product.pivot?.last_purchased
                                                            ? new Date(product.pivot.last_purchased).toLocaleDateString('az-AZ')
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                )
                                            }
                                        ]}
                                        emptyState={{
                                            icon: <ShoppingBagIcon className="w-12 h-12" />,
                                            title: t('emptyState.noProducts'),
                                            description: t('emptyState.noProductsDescription')
                                        }}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('emptyState.noProducts')}</h3>
                                        <p className="mt-1 text-sm text-gray-500">{t('emptyState.noProductsDescription')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}