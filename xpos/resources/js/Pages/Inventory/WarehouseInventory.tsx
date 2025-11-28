import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { Warehouse, ProductStock, Category } from '@/types';
import { useEffect, useState } from 'react';
import { 
    BuildingStorefrontIcon,
    CubeIcon,
    ArrowLeftIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatNumber } from '@/utils/formatters';
import useInventoryUpdate from '@/Pages/GoodsReceipts/Hooks/useInventoryUpdate';

interface Props {
    warehouse: Warehouse;
    productStock: {
        data: ProductStock[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    categories: Category[];
    filters: {
        search?: string;
        category_id?: string;
        status?: string;
    };
}

export default function WarehouseInventory({ warehouse, productStock, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const { subscribe } = useInventoryUpdate();

    const handleFilter = () => {
        router.get(route('inventory.warehouse', warehouse.id), {
            search: search || undefined,
            category_id: categoryId || undefined,
            status: status || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryId('');
        setStatus('');
        router.get(route('inventory.warehouse', warehouse.id), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        const unsubscribe = subscribe(() => {
            router.reload({ only: ['productStock'] });
        });
        return unsubscribe;
    }, []);

    const getStockStatusBadge = (stock: ProductStock) => {
        if (stock.quantity <= 0) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    Stok bitib
                </span>
            );
        }
        if (stock.min_level && stock.quantity <= stock.min_level) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    Az stok
                </span>
            );
        }
        if (stock.reorder_point && stock.quantity <= stock.reorder_point) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    Yenidən sifariş lazımdır
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Stokda var
            </span>
        );
    };

    const columns = [
        {
            key: 'product.name',
            label: 'Məhsul',
            sortable: true,
            render: (stock: ProductStock) => (
                <div className="flex items-center">
                    <CubeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {stock.product?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                            SKU: {stock.product?.sku || 'N/A'}
                        </div>
                        {stock.product?.barcode && (
                            <div className="text-xs text-gray-400">
                                Barkod: {stock.product.barcode}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'product.category.name',
            label: 'Kateqoriya',
            render: (stock: ProductStock) => (
                <span className="text-sm text-gray-600">
                    {stock.product?.category?.name || 'Kateqoriya yoxdur'}
                </span>
            )
        },
        {
            key: 'quantity',
            label: 'Say',
            sortable: true,
            render: (stock: ProductStock) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {formatNumber(stock.quantity)} {stock.product?.unit || ''}
                    </div>
                    {stock.reserved_quantity > 0 && (
                        <div className="text-xs text-orange-600">
                            Rezerv edilib: {formatNumber(stock.reserved_quantity)}
                        </div>
                    )}
                    <div className="text-xs text-green-600">
                        Mövcud: {formatNumber(stock.available_quantity)}
                    </div>
                </div>
            )
        },
        {
            key: 'min_level',
            label: 'Minimum səviyyə',
            render: (stock: ProductStock) => (
                <span className="text-sm text-gray-600">
                    {stock.min_level ? formatNumber(stock.min_level) : '-'}
                </span>
            )
        },
        {
            key: 'max_level',
            label: 'Maksimum səviyyə',
            render: (stock: ProductStock) => (
                <span className="text-sm text-gray-600">
                    {stock.max_level ? formatNumber(stock.max_level) : '-'}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (stock: ProductStock) => getStockStatusBadge(stock)
        },
        {
            key: 'location',
            label: 'Yer',
            render: (stock: ProductStock) => (
                <span className="text-sm text-gray-600">
                    {stock.location || '-'}
                </span>
            )
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`İnventar - ${warehouse.name}`} />

            <div className="mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Link
                                href={route('inventory.index')}
                                className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                                Geri
                            </Link>
                            <div className="flex items-center">
                                <BuildingStorefrontIcon className="w-8 h-8 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{warehouse.name}</h1>
                                    <p className="text-gray-600">Anbar inventarı</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <FunnelIcon className="w-5 h-5 mr-2" />
                            Filtrlər
                        </h3>
                        {(search || categoryId || status) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Filtrləri təmizlə
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Axtar
                            </label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Məhsulları axtar"
                                    className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kateqoriya
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Bütün kateqoriyalar</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stok statusu
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Bütün statuslar</option>
                                <option value="low_stock">Az stok</option>
                                <option value="out_of_stock">Stok bitib</option>
                                <option value="needs_reorder">Yenidən sifariş lazımdır</option>
                            </select>
                        </div>

                        {/* Apply Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Filtrləri tətbiq et
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <SharedDataTable
                    data={productStock}
                    columns={columns}
                    title="Anbardakı məhsullar"
                    emptyState={{
                        title: "Məhsul tapılmadı",
                        description: "Bu anbarda məhsul tapılmadı"
                    }}
                />

                {/* Summary */}
                {productStock.data.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{productStock.total}</div>
                                <div className="text-gray-600">Cəmi məhsullar</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {productStock.data.filter((s: ProductStock) => s.quantity > 0).length}
                                </div>
                                <div className="text-gray-600">Stokda var</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {productStock.data.filter((s: ProductStock) => s.min_level && s.quantity <= s.min_level).length}
                                </div>
                                <div className="text-gray-600">Az stok</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {productStock.data.filter((s: ProductStock) => s.quantity <= 0).length}
                                </div>
                                <div className="text-gray-600">Stok bitib</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
