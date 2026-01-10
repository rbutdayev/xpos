import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ItemCalendar from '@/Components/ItemCalendar';
import {
    ArrowLeftIcon,
    PencilIcon,
    CubeIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Rental {
    id: number;
    rental_number: string;
    rental_start_date: string;
    rental_end_date: string;
    status: string;
}

interface RentalItem {
    id: number;
    rental: Rental;
}

interface InventoryItem {
    id: number;
    inventory_number: string;
    barcode: string | null;
    serial_number: string | null;
    product: Product | null; // Product can be null if deleted
    product_name: string; // Copied product data
    product_sku: string | null;
    product_description: string | null;
    product_category: string | null;
    product_brand: string | null;
    product_model: string | null;
    product_attributes: any | null;
    original_product_id: number | null;
    original_product_deleted_at: string | null;
    can_return_to_stock: boolean;
    branch: Branch;
    status: string;
    rental_category: string;
    daily_rate: number | null;
    weekly_rate: number | null;
    monthly_rate: number | null;
    purchase_price: number | null;
    replacement_cost: number | null;
    condition_notes: string | null;
    notes: string | null;
    is_active: boolean;
    last_maintenance_date: string | null;
    next_maintenance_date: string | null;
    created_at: string;
    updated_at: string;
    current_rental?: Rental;
    rental_items: RentalItem[];
}

interface Props {
    inventoryItem: InventoryItem;
}

export default function Show({ inventoryItem }: Props) {
    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            available: { label: 'Mövcud', className: 'bg-green-100 text-green-800' },
            rented: { label: 'Kirayədə', className: 'bg-blue-100 text-blue-800' },
            maintenance: { label: 'Təmirdə', className: 'bg-yellow-100 text-yellow-800' },
            damaged: { label: 'Zədəli', className: 'bg-red-100 text-red-800' },
            retired: { label: 'İstifadədən çıxarılıb', className: 'bg-gray-100 text-gray-800' },
        };
        return statusConfig[status] || statusConfig.available;
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            clothing: 'Geyim',
            electronics: 'Elektronika',
            home_appliances: 'Məişət texnikası',
            cosmetics: 'Kosmetika',
            event_equipment: 'Tədbir avadanlığı',
            furniture: 'Mebel',
            jewelry: 'Zərgərlik',
            toys: 'Oyuncaq',
            sports: 'İdman',
        };
        return labels[category] || category;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('az-AZ');
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return `${Number(amount).toFixed(2)} AZN`;
    };

    const statusInfo = getStatusBadge(inventoryItem.status);

    return (
        <AuthenticatedLayout>
            <Head title={`İnventar: ${inventoryItem.inventory_number}`} />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.get('/rental-inventory')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Geri
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <CubeIcon className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {inventoryItem.inventory_number}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {inventoryItem.product_name || inventoryItem.product?.name || 'Silinmiş məhsul'}
                                    {inventoryItem.original_product_deleted_at && (
                                        <span className="ml-2 text-xs text-red-600">⚠️</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.get(`/rental-inventory/${inventoryItem.id}/edit`)}
                            className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-slate-600 flex items-center"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Düzəlt
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                                <h2 className="text-lg font-bold text-white flex items-center">
                                    <CubeIcon className="w-5 h-5 mr-2" />
                                    Əsas Məlumat
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Product Name - Featured */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Məhsul</p>
                                    <div className="flex items-center">
                                        <p className="text-xl font-bold text-gray-900">
                                            {inventoryItem.product_name || inventoryItem.product?.name || 'Silinmiş məhsul'}
                                        </p>
                                        {inventoryItem.original_product_deleted_at && (
                                            <span className="ml-3 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium" title="Original product deleted">
                                                Silinmiş ⚠️
                                            </span>
                                        )}
                                    </div>
                                    {(inventoryItem.product_sku || inventoryItem.product?.sku) && (
                                        <p className="text-sm text-blue-600 mt-1 font-medium">
                                            SKU: {inventoryItem.product_sku || inventoryItem.product?.sku}
                                        </p>
                                    )}
                                </div>

                                {/* Information Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">İnventar №</p>
                                        <p className="text-lg font-bold text-gray-900">{inventoryItem.inventory_number}</p>
                                    </div>

                                    {inventoryItem.barcode && (
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Barkod</p>
                                            <p className="text-lg font-bold text-gray-900 font-mono">{inventoryItem.barcode}</p>
                                        </div>
                                    )}

                                    {inventoryItem.serial_number && (
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Seriya №</p>
                                            <p className="text-lg font-bold text-gray-900 font-mono">{inventoryItem.serial_number}</p>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Filial</p>
                                        <p className="text-lg font-bold text-gray-900">{inventoryItem.branch.name}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Kirayə Kateqoriyası</p>
                                        <p className="text-lg font-bold text-gray-900">{getCategoryLabel(inventoryItem.rental_category)}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Status</p>
                                        <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${statusInfo.className}`}>
                                            {statusInfo.label}
                                        </span>
                                        <div className="mt-2 flex items-center">
                                            <span className="text-xs text-gray-500 mr-2">Aktiv:</span>
                                            {inventoryItem.is_active ? (
                                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <XCircleIcon className="w-4 h-4 text-red-600" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Details (Clean UI) */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Məhsul Təfərrüatları
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Brand and Model */}
                                {(inventoryItem.product_brand || inventoryItem.product_model) && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Marka və Model</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {[inventoryItem.product_brand, inventoryItem.product_model].filter(Boolean).join(' ')}
                                        </p>
                                    </div>
                                )}
                                
                                {/* Category */}
                                {inventoryItem.product_category && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Kateqoriya</p>
                                        <p className="text-base font-medium text-gray-900">{inventoryItem.product_category}</p>
                                    </div>
                                )}
                                
                                {/* Size */}
                                {inventoryItem.product_attributes?.size && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Ölçü</p>
                                        <p className="text-base font-medium text-gray-900">{inventoryItem.product_attributes.size}</p>
                                    </div>
                                )}
                                
                                {/* Color */}
                                {inventoryItem.product_attributes?.color && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Rəng</p>
                                        <div className="flex items-center">
                                            {inventoryItem.product_attributes.color_code && (
                                                <div 
                                                    className="w-5 h-5 rounded-full border-2 border-gray-300 mr-2"
                                                    style={{ backgroundColor: inventoryItem.product_attributes.color_code }}
                                                ></div>
                                            )}
                                            <p className="text-base font-medium text-gray-900">{inventoryItem.product_attributes.color}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Material */}
                                {inventoryItem.product_attributes?.material && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Material</p>
                                        <p className="text-base font-medium text-gray-900">{inventoryItem.product_attributes.material}</p>
                                    </div>
                                )}
                                
                                {/* Style */}
                                {inventoryItem.product_attributes?.style && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Stil</p>
                                        <p className="text-base font-medium text-gray-900">{inventoryItem.product_attributes.style}</p>
                                    </div>
                                )}
                                
                                {/* Gender */}
                                {inventoryItem.product_attributes?.gender && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Cins</p>
                                        <p className="text-base font-medium text-gray-900">{inventoryItem.product_attributes.gender}</p>
                                    </div>
                                )}
                                
                                {/* Season */}
                                {inventoryItem.product_attributes?.season && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Mövsüm</p>
                                        <p className="text-base font-medium text-gray-900">{inventoryItem.product_attributes.season}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Product Description */}
                        {inventoryItem.product_description && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Məhsul Təsviri
                                </h2>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {inventoryItem.product_description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Pricing Information */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Qiymət Məlumatı
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Günlük Tarif</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {formatCurrency(inventoryItem.daily_rate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Həftəlik Tarif</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {formatCurrency(inventoryItem.weekly_rate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Aylıq Tarif</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {formatCurrency(inventoryItem.monthly_rate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Alış Qiyməti</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {formatCurrency(inventoryItem.purchase_price)}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-600">Əvəzləmə Dəyəri</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {formatCurrency(inventoryItem.replacement_cost)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Condition & Notes */}
                        {(inventoryItem.condition_notes || inventoryItem.notes) && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Vəziyyət və Qeydlər
                                </h2>
                                {inventoryItem.condition_notes && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-600 mb-2">
                                            Vəziyyət Qeydləri
                                        </p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {inventoryItem.condition_notes}
                                        </p>
                                    </div>
                                )}
                                {inventoryItem.notes && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">
                                            Ümumi Qeydlər
                                        </p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {inventoryItem.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Booking Calendar */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CalendarIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Rezervasiya Təqvimi
                            </h2>
                            <ItemCalendar inventoryId={inventoryItem.id} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Current Rental */}
                        {inventoryItem.current_rental && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                    Cari İcarə
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="text-blue-700">№:</span>{' '}
                                        {inventoryItem.current_rental.rental_number}
                                    </p>
                                    <p>
                                        <span className="text-blue-700">Başlama:</span>{' '}
                                        {formatDate(inventoryItem.current_rental.rental_start_date)}
                                    </p>
                                    <p>
                                        <span className="text-blue-700">Bitmə:</span>{' '}
                                        {formatDate(inventoryItem.current_rental.rental_end_date)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Maintenance Info */}
                        {(inventoryItem.last_maintenance_date || inventoryItem.next_maintenance_date) && (
                            <div className="bg-white shadow-sm rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Texniki Baxış
                                    </h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {inventoryItem.last_maintenance_date && (
                                        <div>
                                            <p className="text-gray-600">Son baxış</p>
                                            <p className="font-medium text-gray-900">
                                                {formatDate(inventoryItem.last_maintenance_date)}
                                            </p>
                                        </div>
                                    )}
                                    {inventoryItem.next_maintenance_date && (
                                        <div>
                                            <p className="text-gray-600">Növbəti baxış</p>
                                            <p className="font-medium text-gray-900">
                                                {formatDate(inventoryItem.next_maintenance_date)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="bg-white shadow-sm rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Statistika
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ümumi icarələr</span>
                                    <span className="font-medium text-gray-900">
                                        {inventoryItem.rental_items?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Yaradılıb</span>
                                    <span className="font-medium text-gray-900">
                                        {formatDate(inventoryItem.created_at)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Yenilənib</span>
                                    <span className="font-medium text-gray-900">
                                        {formatDate(inventoryItem.updated_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
