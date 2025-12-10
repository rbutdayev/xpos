import { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Product, Category } from '@/types';
import ProductsNavigation from '@/Components/ProductsNavigation';
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CubeIcon,
    TagIcon,
    HomeModernIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    QueueListIcon,
    MagnifyingGlassIcon,
    ArrowUpTrayIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import SharedDataTable from '@/Components/SharedDataTable';
import { productTableConfig } from '@/Components/TableConfigurations';
import { formatQuantityWithUnit } from '@/utils/formatters';
import StockDetailsModal from '@/Components/StockDetailsModal';
import ProductImportModal from '@/Components/ProductImportModal';

interface Props {
    products: {
        data: Product[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    categories: Category[];
    warehouses: Array<{
        id: number;
        name: string;
        type: string;
    }>;
    filters: {
        search?: string;
        category_id?: string;
        type?: string;
        status?: string;
        warehouse_id?: string;
    };
    selectedWarehouse?: number | null;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ products, categories, warehouses, filters, selectedWarehouse, flash }: Props) {
    const { t } = useTranslation(['products', 'common']);
    const { auth } = usePage().props as any;
    const currentUser = auth.user;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState(filters.warehouse_id || '');
    const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    // Get accessible warehouse IDs based on user role
    const getAccessibleWarehouses = () => {
        if (currentUser.role === 'sales_staff' && currentUser.branch_id) {
            // Sales staff can only see warehouses their branch has access to
            return warehouses.map(w => w.id);
        }
        // Admins and managers see all
        return [];
    };

    const accessibleWarehouses = getAccessibleWarehouses();
    const showAllWarehouses = currentUser.role !== 'sales_staff';

    const handleSearch = () => {
        router.get('/products', {
            search,
            category_id: selectedCategory,
            type: selectedType,
            status: selectedStatus,
            warehouse_id: selectedWarehouseFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedType('');
        setSelectedStatus('');
        setSelectedWarehouseFilter('');
        router.get('/products', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const getProductStock = (product: Product) => {
        if (!product.stock || product.stock.length === 0) return { total: 0, details: [] };
        
        if (selectedWarehouse || selectedWarehouseFilter) {
            // Show specific warehouse stock
            const warehouseId = Number(selectedWarehouseFilter || selectedWarehouse);
            const warehouseStock = product.stock.find(s => s.warehouse_id === warehouseId);
            return {
                total: warehouseStock?.quantity || 0,
                details: warehouseStock ? [warehouseStock] : []
            };
        } else {
            // Show total across all warehouses
            const total = product.stock.reduce((sum, s) => sum + s.quantity, 0);
            return {
                total,
                details: product.stock
            };
        }
    };

    const getCurrentWarehouseName = () => {
        if (selectedWarehouseFilter) {
            const warehouse = warehouses.find(w => w.id === Number(selectedWarehouseFilter));
            return warehouse?.name;
        }
        if (selectedWarehouse) {
            const warehouse = warehouses.find(w => w.id === selectedWarehouse);
            return warehouse?.name;
        }
        return null;
    };

    const deleteProduct = (product: Product) => {
        // Enhanced confirmation message with business rule warning
        const confirmMessage = t('products:messages.confirmDelete', { name: product.name });

        if (confirm(confirmMessage)) {
            router.delete(`/products/${product.id}`, {
                onError: (errors) => {
                    // Handle specific error cases
                    if (errors.error) {
                        alert(`${t('products:messages.deleteError')}: ${errors.error}`);
                    } else if (errors.product) {
                        alert(`${t('products:messages.deleteError')}: ${errors.product}`);
                    } else {
                        alert(t('products:messages.deleteError'));
                    }
                },
                onSuccess: () => {
                    // Success message will be shown via flash message
                }
            });
        }
    };

    const toggleProductStatus = (product: Product) => {
        const action = product.is_active ? t('products:status.deactivate') : t('products:status.activate');
        const confirmMessage = t('products:messages.confirmStatusChange', { name: product.name, action });

        if (confirm(confirmMessage)) {
            router.patch(`/products/${product.id}`, {
                is_active: !product.is_active
            }, {
                onError: (errors) => {
                    alert(t('products:messages.statusChangeError'));
                },
                preserveScroll: true
            });
        }
    };

    const tableFilters = [
        {
            key: 'category_id',
            type: 'dropdown' as const,
            label: t('products:fields.category'),
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
                { value: '', label: t('products:filters.allCategories') },
                ...categories.map(cat => ({
                    value: cat.id.toString(),
                    label: cat.name
                }))
            ]
        },
        {
            key: 'warehouse_id',
            type: 'dropdown' as const,
            label: t('products:filters.warehouseFilter'),
            value: selectedWarehouseFilter,
            onChange: setSelectedWarehouseFilter,
            options: [
                { value: '', label: t('products:filters.allWarehouses') },
                ...warehouses.map(warehouse => ({
                    value: warehouse.id.toString(),
                    label: `${warehouse.name} ${warehouse.type === 'main' ? t('products:filters.main') : ''}`
                }))
            ]
        },
        {
            key: 'type',
            type: 'dropdown' as const,
            label: t('products:fields.type'),
            value: selectedType,
            onChange: setSelectedType,
            options: [
                { value: '', label: t('products:filters.allTypes') },
                { value: 'product', label: t('products:types.product') },
                { value: 'service', label: t('products:types.service') },
            ]
        },
        {
            key: 'status',
            type: 'dropdown' as const,
            label: t('common:labels.status'),
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: '', label: t('products:filters.allStatuses') },
                { value: 'active', label: t('products:status.active') },
                { value: 'inactive', label: t('products:status.inactive') },
            ]
        }
    ];

    // Custom table configuration with warehouse-aware stock and role-based pricing
    const customTableConfig = {
        ...productTableConfig,
        columns: productTableConfig.columns.map(col => {
            if (col.key === 'stock_info') {
                return {
                    ...col,  // This preserves ALL original properties including mobileLabel, hideOnMobile
                    label: getCurrentWarehouseName() ? `${t('products:fields.stock')} (${getCurrentWarehouseName()})` : t('products:fields.stockInfo'),
                    render: (product: Product) => {
                        const stockInfo = getProductStock(product);
                        const isLowStock = stockInfo.details.some(s => s.min_level && s.quantity <= s.min_level);

                        return (
                            <div className="text-center">
                                <div className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                    {formatQuantityWithUnit(stockInfo.total, product.unit)}
                                </div>
                                {getCurrentWarehouseName() ? (
                                    <div className="text-xs text-blue-600 flex items-center justify-center">
                                        <HomeModernIcon className="w-3 h-3 mr-1" />
                                        {getCurrentWarehouseName()}
                                    </div>
                                ) : (
                                    <>
                                        {/* Show warehouse breakdown when no filter is active */}
                                        {stockInfo.details.length > 0 && stockInfo.details.length <= 3 ? (
                                            <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                                                {stockInfo.details.map((s: any) => (
                                                    <div key={s.id} className="flex items-center justify-center gap-1">
                                                        <span className="text-gray-500">{s.warehouse?.name}:</span>
                                                        <span className="font-medium">{formatQuantityWithUnit(s.quantity, product.unit)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">
                                                {stockInfo.details.length} {t('products:messages.warehousesCount')}
                                            </div>
                                        )}
                                        {/* View Details Button */}
                                        {stockInfo.details.length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStockModalProduct(product);
                                                }}
                                                className="mt-1 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                <MagnifyingGlassIcon className="w-3 h-3 mr-0.5" />
                                                {t('products:actions.viewDetails')}
                                            </button>
                                        )}
                                    </>
                                )}
                                {isLowStock && (
                                    <div className="text-xs text-red-500">{t('products:messages.lowStock')}</div>
                                )}
                            </div>
                        );
                    }
                };
            } else if (col.key === 'pricing') {
                return {
                    ...col,  // This preserves ALL original properties including mobileLabel, hideOnMobile
                    render: (product: Product) => (
                        <div className="text-sm text-right">
                            <div className="text-gray-900">
                                {t('products:fields.salePrice')}: {product.sale_price ? `${product.sale_price.toLocaleString('az-AZ')} ₼` : '-'}
                            </div>
                            {!['sales_staff', 'warehouse_manager'].includes(currentUser.role) && (
                                <div className="text-gray-500">
                                    {t('products:fields.purchasePrice')}: {product.purchase_price ? `${product.purchase_price.toLocaleString('az-AZ')} ₼` : '-'}
                                </div>
                            )}
                        </div>
                    )
                };
            }
            return col;  // This preserves ALL original properties for unmodified columns
        })
    };

    const tableActions = [
        {
            label: t('products:actions.view'),
            href: (product: Product) => `/products/${product.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'view' as const
        },
        {
            label: t('products:actions.stockDetails'),
            icon: <HomeModernIcon className="w-4 h-4" />,
            variant: 'secondary' as const,
            onClick: (product: Product) => setStockModalProduct(product)
        },
        // Only show edit/delete actions for non-salesmen
        ...(currentUser.role !== 'sales_staff' ? [
            {
                label: t('products:actions.edit'),
                href: (product: Product) => `/products/${product.id}/edit`,
                icon: <PencilIcon className="w-4 h-4" />,
                variant: 'edit' as const
            },
            {
                label: t('products:actions.changeStatus'),
                icon: <TagIcon className="w-4 h-4" />,
                variant: 'secondary' as const,
                onClick: toggleProductStatus
            },
            {
                label: t('products:actions.delete'),
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'delete' as const,
                onClick: deleteProduct
            }
        ] : [])
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('products:productCatalog')} />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <ProductsNavigation
                    currentRoute="products"
                    onImportClick={() => setShowImportModal(true)}
                />
            </div>
            <div className="w-full">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {flash?.error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warehouse Context Display */}
                {(selectedWarehouse || selectedWarehouseFilter) && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-center">
                            <HomeModernIcon className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="text-sm text-blue-700">
                                {selectedWarehouseFilter ? t('products:filters.warehouseFilterActive') : t('products:filters.selectedWarehouse')}
                                <strong>{getCurrentWarehouseName()}</strong>
                            </span>
                        </div>
                    </div>
                )}

                <SharedDataTable
                    data={products}
                    columns={customTableConfig.columns}
                    actions={tableActions}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={t('products:searchPlaceholder')}
                    filters={tableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    emptyState={{
                        icon: <CubeIcon className="w-12 h-12" />,
                        title: t('products:emptyState.title'),
                        description: t('products:emptyState.description')
                    }}
                    fullWidth={true}

                    mobileClickable={true}

                    hideMobileActions={true}
                />

                {/* Stock Details Modal */}
                {stockModalProduct && (
                    <StockDetailsModal
                        isOpen={!!stockModalProduct}
                        onClose={() => setStockModalProduct(null)}
                        product={stockModalProduct}
                        accessibleWarehouses={accessibleWarehouses}
                        showAllWarehouses={showAllWarehouses}
                    />
                )}

                {/* Import Modal */}
                <ProductImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                />
            </div>
        </AuthenticatedLayout>
    );
}