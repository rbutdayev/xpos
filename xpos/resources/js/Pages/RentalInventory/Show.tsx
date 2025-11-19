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
    product: Product;
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
                                    {inventoryItem.product.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.get(`/rental-inventory/${inventoryItem.id}/edit`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
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
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Əsas Məlumat
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">İnventar Nömrəsi</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {inventoryItem.inventory_number}
                                    </p>
                                </div>
                                {inventoryItem.barcode && (
                                    <div>
                                        <p className="text-sm text-gray-600">Barkod</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {inventoryItem.barcode}
                                        </p>
                                    </div>
                                )}
                                {inventoryItem.serial_number && (
                                    <div>
                                        <p className="text-sm text-gray-600">Seriya Nömrəsi</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {inventoryItem.serial_number}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">Məhsul</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {inventoryItem.product.name}
                                        {inventoryItem.product.sku && (
                                            <span className="text-sm text-gray-500 ml-2">
                                                ({inventoryItem.product.sku})
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Filial</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {inventoryItem.branch.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Kateqoriya</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {getCategoryLabel(inventoryItem.rental_category)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                                    >
                                        {statusInfo.label}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Aktiv</p>
                                    {inventoryItem.is_active ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <XCircleIcon className="w-5 h-5 text-red-600" />
                                    )}
                                </div>
                            </div>
                        </div>

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
