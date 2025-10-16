import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';


interface StockMovement {
    id: number;
    product: {
        id: number;
        name: string;
        sku: string;
    };
    warehouse: {
        id: number;
        name: string;
    };
    employee?: {
        employee_id: number;
        name: string;
    };
    movement_type: string;
    quantity: number;
    unit_cost?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    movement: StockMovement;
}

export default function Show({ movement }: Props) {
    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('az-AZ', { 
            style: 'currency', 
            currency: 'AZN' 
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMovementTypeInfo = (type: string) => {
        const types = {
            daxil_olma: { name: 'Daxil olma', color: 'text-green-700 bg-green-50' },
            xaric_olma: { name: 'Xaric olma', color: 'text-red-700 bg-red-50' },
            transfer: { name: 'Transfer', color: 'text-blue-700 bg-blue-50' },
            qaytarma: { name: 'Qaytarma', color: 'text-yellow-700 bg-yellow-50' },
            itki_zerer: { name: 'İtki/Zərər', color: 'text-gray-700 bg-gray-50' },
        };
        return types[type as keyof typeof types] || { name: type, color: 'text-gray-700 bg-gray-50' };
    };

    const movementTypeInfo = getMovementTypeInfo(movement.movement_type);

    return (
        <AuthenticatedLayout>
            <Head title={`Stok Hərəkəti #${movement.id}`} />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Link
                                    href={route('stock-movements.index')}
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        Stok Hərəkəti #{movement.id}
                                    </h2>
                                    <p className="text-gray-600">Stok hərəkəti təfərrüatları</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    <PrinterIcon className="w-4 h-4 mr-2" />
                                    Çap et
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Movement Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Hərəkət məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Hərəkət ID
                                            </dt>
                                            <dd className="text-sm text-gray-900 font-mono">
                                                #{movement.id}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Yaradılma tarixi
                                            </dt>
                                            <dd className="text-sm text-gray-900">
                                                {formatDate(movement.created_at)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">
                                                Hərəkət növü
                                            </dt>
                                            <dd className="text-sm">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${movementTypeInfo.color}`}>
                                                    {movementTypeInfo.name}
                                                </span>
                                            </dd>
                                        </div>
                                        {movement.employee && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">
                                                    İcraçı
                                                </dt>
                                                <dd className="text-sm text-gray-900">
                                                    {movement.employee.name}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Product Information */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-blue-900 mb-4">
                                        Məhsul məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-blue-700">
                                                Məhsul adı
                                            </dt>
                                            <dd className="text-sm text-blue-900 font-medium">
                                                {movement.product.name}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-blue-700">
                                                SKU
                                            </dt>
                                            <dd className="text-sm text-blue-900 font-mono">
                                                {movement.product.sku}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Warehouse Information */}
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-purple-900 mb-4">
                                        Anbar məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-purple-700">
                                                Anbar adı
                                            </dt>
                                            <dd className="text-sm text-purple-900 font-medium">
                                                {movement.warehouse.name}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Quantity & Cost Information */}
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-yellow-900 mb-4">
                                        Miqdar və dəyər məlumatları
                                    </h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-yellow-700">
                                                Miqdar
                                            </dt>
                                            <dd className="text-lg text-yellow-900 font-bold">
                                                {movement.quantity}
                                            </dd>
                                        </div>
                                        {movement.unit_cost && (
                                            <div>
                                                <dt className="text-sm font-medium text-yellow-700">
                                                    Vahid dəyəri
                                                </dt>
                                                <dd className="text-sm text-yellow-900 font-medium">
                                                    {formatCurrency(movement.unit_cost)}
                                                </dd>
                                            </div>
                                        )}
                                        {movement.unit_cost && (
                                            <div>
                                                <dt className="text-sm font-medium text-yellow-700">
                                                    Ümumi dəyər
                                                </dt>
                                                <dd className="text-lg text-yellow-900 font-bold">
                                                    {formatCurrency(movement.unit_cost * movement.quantity)}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Notes */}
                                {movement.notes && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Qeydlər
                                        </h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {movement.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
                            <Link
                                href={route('stock-movements.index')}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                Siyahıya qayıt
                            </Link>
                            
                            <div className="text-xs text-gray-500">
                                Son yeniləmə: {formatDate(movement.updated_at)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}