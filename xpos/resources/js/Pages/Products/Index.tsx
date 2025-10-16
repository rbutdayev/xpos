import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Product, Category } from '@/types';
import { 
    PlusIcon, 
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CubeIcon,
    TagIcon,
    HomeModernIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import SharedDataTable from '@/Components/SharedDataTable';
import { productTableConfig } from '@/Components/TableConfigurations';
import { formatQuantityWithUnit } from '@/utils/formatters';

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
    const { auth } = usePage().props as any;
    const currentUser = auth.user;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState(filters.warehouse_id || '');

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
        const confirmMessage = `${product.name} məhsulunu silmək istədiyinizə əminsiniz?\n\nQeyd: Stok hərəkəti olan məhsullar silinə bilməz. Əgər məhsul istifadə edilmişsə, yalnız deaktiv edə bilərsiniz.`;
        
        if (confirm(confirmMessage)) {
            router.delete(`/products/${product.id}`, {
                onError: (errors) => {
                    // Handle specific error cases
                    if (errors.error) {
                        alert(`Silmə xətası: ${errors.error}`);
                    } else if (errors.product) {
                        alert(`Silmə xətası: ${errors.product}`);
                    } else {
                        alert('Məhsul silinərkən xəta baş verdi.');
                    }
                },
                onSuccess: () => {
                    // Success message will be shown via flash message
                }
            });
        }
    };

    const toggleProductStatus = (product: Product) => {
        const action = product.is_active ? 'deaktiv' : 'aktiv';
        const confirmMessage = `${product.name} məhsulunu ${action} etmək istədiyinizə əminsiniz?`;
        
        if (confirm(confirmMessage)) {
            router.patch(`/products/${product.id}`, {
                is_active: !product.is_active
            }, {
                onError: (errors) => {
                    alert('Status dəyişdirilərkən xəta baş verdi.');
                },
                preserveScroll: true
            });
        }
    };

    const tableFilters = [
        {
            key: 'category_id',
            type: 'dropdown' as const,
            label: 'Kateqoriya',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
                { value: '', label: 'Bütün kateqoriyalar' },
                ...categories.map(cat => ({
                    value: cat.id.toString(),
                    label: cat.name
                }))
            ]
        },
        {
            key: 'warehouse_id',
            type: 'dropdown' as const,
            label: 'Anbar Filtri',
            value: selectedWarehouseFilter,
            onChange: setSelectedWarehouseFilter,
            options: [
                { value: '', label: 'Bütün anbarlar' },
                ...warehouses.map(warehouse => ({
                    value: warehouse.id.toString(),
                    label: `${warehouse.name} ${warehouse.type === 'main' ? '(Əsas)' : ''}`
                }))
            ]
        },
        {
            key: 'type',
            type: 'dropdown' as const,
            label: 'Növ',
            value: selectedType,
            onChange: setSelectedType,
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'product', label: 'Məhsul' },
                { value: 'service', label: 'Xidmət' },
            ]
        },
        {
            key: 'status',
            type: 'dropdown' as const,
            label: 'Status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' },
            ]
        }
    ];

    // Custom table configuration with warehouse-aware stock and role-based pricing
    const customTableConfig = {
        ...productTableConfig,
        columns: productTableConfig.columns.map(col => {
            if (col.key === 'stock_info') {
                return {
                    ...col,
                    label: getCurrentWarehouseName() ? `Stok (${getCurrentWarehouseName()})` : 'Stok məlumatları',
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
                                    <div className="text-xs text-gray-500">
                                        {stockInfo.details.length} anbar
                                    </div>
                                )}
                                {isLowStock && (
                                    <div className="text-xs text-red-500">Az stok!</div>
                                )}
                            </div>
                        );
                    }
                };
            } else if (col.key === 'pricing') {
                return {
                    ...col,
                    render: (product: Product) => (
                        <div className="text-sm text-right">
                            <div className="text-gray-900">
                                Satış: {product.sale_price ? `${product.sale_price.toLocaleString('az-AZ')} ₼` : '-'}
                            </div>
                            {!['sales_staff', 'warehouse_manager'].includes(currentUser.role) && (
                                <div className="text-gray-500">
                                    Alış: {product.purchase_price ? `${product.purchase_price.toLocaleString('az-AZ')} ₼` : '-'}
                                </div>
                            )}
                        </div>
                    )
                };
            }
            return col;
        })
    };

    const tableActions = [
        {
            label: 'Bax',
            href: (product: Product) => `/products/${product.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'view' as const
        },
        // Only show edit/delete actions for non-salesmen
        ...(currentUser.role !== 'sales_staff' ? [
            {
                label: 'Düzəlt',
                href: (product: Product) => `/products/${product.id}/edit`,
                icon: <PencilIcon className="w-4 h-4" />,
                variant: 'edit' as const
            },
            {
                label: 'Status Dəyiş',
                icon: <TagIcon className="w-4 h-4" />,
                variant: 'secondary' as const,
                onClick: toggleProductStatus
            },
            {
                label: 'Sil',
                icon: <TrashIcon className="w-4 h-4" />,
                variant: 'delete' as const,
                onClick: deleteProduct
            }
        ] : [])
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Məhsul Kataloqu" />

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
                                {selectedWarehouseFilter ? 'Anbar filtri aktiv: ' : 'Seçilmiş anbar: '}
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
                    searchPlaceholder="Ad, SKU və ya barkod ilə axtarış..."
                    filters={tableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    title="Məhsul Kataloqu"
                    createButton={currentUser.role !== 'sales_staff' ? {
                        label: 'Yeni Məhsul',
                        href: '/products/create'
                    } : undefined}
                    emptyState={{
                        icon: <CubeIcon className="w-12 h-12" />,
                        title: 'Heç bir məhsul tapılmadı',
                        description: 'Başlamaq üçün yeni məhsul əlavə edin.'
                    }}
                    fullWidth={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}