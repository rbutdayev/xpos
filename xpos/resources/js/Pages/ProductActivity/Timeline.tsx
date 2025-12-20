import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProductSelect from '@/Components/ProductSelect';
import { ArrowDownCircleIcon, ArrowUpCircleIcon, ArrowRightCircleIcon, ArrowLeftCircleIcon, AdjustmentsHorizontalIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import InventoryNavigation from '@/Components/InventoryNavigation';

interface Activity {
    id: number;
    type: string;
    type_label: string;
    quantity_before: number;
    quantity_change: number;
    quantity_after: number;
    warehouse_id: number;
    warehouse_name: string;
    user_name: string;
    occurred_at: string;
    occurred_at_formatted: string;
    notes?: string;
    reference_type?: string;
    reference_id?: number;
    color: string;
    icon: string;
}

interface ProductInfo {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    current_stocks: Array<{
        warehouse_id: number;
        warehouse_name: string;
        quantity: number;
        min_level: number;
        max_level: number;
    }>;
}

interface Props {
    products: Array<{ id: number; name: string; sku: string; barcode?: string; }>;
    warehouses: Array<{ id: number; name: string; }>;
    activities: {
        data: Activity[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    } | Activity[];
    productInfo?: ProductInfo;
    filters: {
        product_id?: string;
        warehouse_id?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function Timeline({ products, warehouses, activities, productInfo, filters }: Props) {
    const [productId, setProductId] = useState(filters.product_id || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [selectedProductData, setSelectedProductData] = useState<any>(null);

    const handleSearch = () => {
        router.get(route('product-activity.timeline'), {
            product_id: productId,
            warehouse_id: warehouseId,
            start_date: startDate,
            end_date: endDate
        }, { preserveState: false, replace: true });
    };

    const handleReset = () => {
        setProductId('');
        setWarehouseId('');
        setStartDate('');
        setEndDate('');
        setSelectedProductData(null);
        router.get(route('product-activity.timeline'), {}, { preserveState: false, replace: true });
    };

    const getActivityIcon = (iconName: string, color: string) => {
        const iconClasses = `h-8 w-8 ${color === 'green' ? 'text-green-600' : color === 'blue' ? 'text-blue-600' : color === 'orange' ? 'text-orange-600' : 'text-gray-600'}`;

        switch (iconName) {
            case 'arrow-down-circle':
                return <ArrowDownCircleIcon className={iconClasses} />;
            case 'arrow-up-circle':
                return <ArrowUpCircleIcon className={iconClasses} />;
            case 'arrow-right-circle':
                return <ArrowRightCircleIcon className={iconClasses} />;
            case 'arrow-left-circle':
                return <ArrowLeftCircleIcon className={iconClasses} />;
            case 'adjustments':
                return <AdjustmentsHorizontalIcon className={iconClasses} />;
            case 'clipboard':
                return <ClipboardDocumentListIcon className={iconClasses} />;
            default:
                return <ClipboardDocumentListIcon className={iconClasses} />;
        }
    };

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'green':
                return 'border-green-200 bg-green-50';
            case 'blue':
                return 'border-blue-200 bg-blue-50';
            case 'orange':
                return 'border-orange-200 bg-orange-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    const activitiesData = Array.isArray(activities) ? activities : activities.data;
    const paginationData = !Array.isArray(activities) ? activities : null;

    return (
        <AuthenticatedLayout>
            <Head title="Məhsul Fəaliyyət Tarixçəsi" />
            <div className="mx-auto sm:px-6 lg:px-8 mb-6">
                <InventoryNavigation currentRoute="product-activity.timeline" />
            </div>
            <div className="py-6 px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                                Məhsul Fəaliyyət Tarixçəsi
                            </h2>

                            {/* Filters */}
                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                                        Məhsul
                                    </label>
                                    <ProductSelect
                                        products={selectedProductData ? [selectedProductData, ...products as any] : products as any}
                                        value={productId}
                                        onChange={(value, product) => {
                                            setProductId(String(value));
                                            if (product) {
                                                setSelectedProductData(product);
                                            }
                                        }}
                                        placeholder="Məhsul axtar..."
                                        useAjaxSearch={!selectedProductData}
                                        showSearch={true}
                                        showStock={false}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-1">
                                        Anbar
                                    </label>
                                    <select
                                        id="warehouse"
                                        value={warehouseId}
                                        onChange={(e) => setWarehouseId(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="">Bütün Anbarlar</option>
                                        {warehouses.map((warehouse) => (
                                            <option key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                        Başlanğıc Tarixi
                                    </label>
                                    <input
                                        type="date"
                                        id="start_date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                        Bitmə Tarixi
                                    </label>
                                    <input
                                        type="date"
                                        id="end_date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={handleSearch}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Tarixçəni Göstər
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Sıfırla
                                </button>
                            </div>

                            {/* Product Info */}
                            {productInfo && (
                                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{productInfo.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                SKU: {productInfo.sku}
                                                {productInfo.barcode && ` | Barkod: ${productInfo.barcode}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Cari Stok:</p>
                                            <div className="space-y-1">
                                                {productInfo.current_stocks.map((stock) => (
                                                    <div key={stock.warehouse_id} className="text-sm">
                                                        <span className="font-medium">{stock.warehouse_name}:</span>{' '}
                                                        <span className={stock.quantity <= stock.min_level ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                            {stock.quantity} ədəd
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            {activitiesData && activitiesData.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Fəaliyyət Tarixçəsi ({paginationData?.total || activitiesData.length} qeyd)</h3>

                                    {activitiesData.map((activity, index) => (
                                        <div
                                            key={activity.id}
                                            className={`flex gap-4 p-4 rounded-lg border-2 ${getColorClasses(activity.color)}`}
                                        >
                                            <div className="flex-shrink-0">
                                                {getActivityIcon(activity.icon, activity.color)}
                                            </div>

                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="text-base font-semibold text-gray-900">
                                                            {activity.type_label}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {activity.occurred_at_formatted} | {activity.user_name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-lg font-bold ${activity.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {activity.quantity_change >= 0 ? '+' : ''}{activity.quantity_change}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                                    <div>
                                                        <span className="text-gray-600">Anbar:</span>{' '}
                                                        <span className="font-medium text-gray-900">{activity.warehouse_name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Əvvəl:</span>{' '}
                                                        <span className="font-medium text-gray-900">{activity.quantity_before}</span>
                                                        {' → '}
                                                        <span className="text-gray-600">Sonra:</span>{' '}
                                                        <span className="font-medium text-gray-900">{activity.quantity_after}</span>
                                                    </div>
                                                </div>

                                                {activity.reference_type && (
                                                    <div className="text-sm">
                                                        <span className="text-gray-600">
                                                            İstinad: <span className="font-medium text-gray-900">{activity.reference_type} #{activity.reference_id}</span>
                                                        </span>
                                                    </div>
                                                )}

                                                {activity.notes && (
                                                    <div className="mt-2 text-sm text-gray-700 italic">
                                                        {activity.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    {paginationData && paginationData.last_page > 1 && (
                                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                                            <div className="text-sm text-gray-700">
                                                {paginationData.from}-{paginationData.to} arası göstərilir (Cəmi: {paginationData.total})
                                            </div>
                                            <div className="flex gap-2">
                                                {paginationData.links.map((link, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => link.url && router.visit(link.url)}
                                                        disabled={!link.url}
                                                        className={`px-3 py-1 text-sm rounded ${
                                                            link.active
                                                                ? 'bg-indigo-600 text-white'
                                                                : link.url
                                                                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : productId ? (
                                <div className="text-center py-12 text-gray-500">
                                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2">Bu məhsul üçün heç bir fəaliyyət tapılmadı</p>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2">Fəaliyyət tarixçəsini görmək üçün məhsul seçin</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}
