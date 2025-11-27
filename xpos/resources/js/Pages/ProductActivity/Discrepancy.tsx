import { useState, FormEvent } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProductSelect from '@/Components/ProductSelect';
import axios from 'axios';
import { ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
    products: Array<{ id: number; name: string; sku: string; barcode?: string; }>;
    warehouses: Array<{ id: number; name: string; }>;
}

interface Investigation {
    product: {
        id: number;
        name: string;
        sku: string;
    };
    warehouse: {
        id: number;
        name: string;
    };
    quantities: {
        system: number;
        expected: number;
        actual: number;
        calculated: number;
        discrepancy: number;
    };
    movement_summary: {
        total_in: number;
        total_out: number;
        transfers_in: number;
        transfers_out: number;
        adjustments: number;
        count: number;
    };
    recent_movements: Array<{
        type: string;
        quantity_change: number;
        quantity_after: number;
        user_name: string;
        occurred_at: string;
        notes?: string;
    }>;
    possible_causes: string[];
    date_noticed: string;
}

export default function Discrepancy({ products, warehouses }: Props) {
    const [productId, setProductId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [expectedQuantity, setExpectedQuantity] = useState('');
    const [actualQuantity, setActualQuantity] = useState('');
    const [dateNoticed, setDateNoticed] = useState(new Date().toISOString().split('T')[0]);
    const [investigation, setInvestigation] = useState<Investigation | null>(null);
    const [isInvestigating, setIsInvestigating] = useState(false);
    const [error, setError] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [adjustmentSuccess, setAdjustmentSuccess] = useState(false);
    const [selectedProductData, setSelectedProductData] = useState<any>(null);

    const handleInvestigate = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setInvestigation(null);
        setAdjustmentSuccess(false);
        setIsInvestigating(true);

        try {
            const response = await axios.post(route('product-activity.investigate'), {
                product_id: productId,
                warehouse_id: warehouseId,
                expected_quantity: parseFloat(expectedQuantity),
                actual_quantity: parseFloat(actualQuantity),
                date_noticed: dateNoticed,
            });

            setInvestigation(response.data.investigation);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Araşdırma zamanı xəta baş verdi');
        } finally {
            setIsInvestigating(false);
        }
    };

    const handleCreateAdjustment = async () => {
        if (!adjustmentReason.trim()) {
            alert('Düzəliş səbəbini daxil edin');
            return;
        }

        setIsAdjusting(true);
        setError('');

        try {
            const adjustmentQuantity = investigation!.quantities.actual - investigation!.quantities.system;

            const response = await axios.post(route('product-activity.create-adjustment'), {
                product_id: investigation!.product.id,
                warehouse_id: investigation!.warehouse.id,
                adjustment_quantity: adjustmentQuantity,
                reason: adjustmentReason,
            });

            setAdjustmentSuccess(true);
            setAdjustmentReason('');

            // Refresh investigation to show new quantities
            setTimeout(() => {
                handleInvestigate(new Event('submit') as any);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Düzəliş yaradıla bilmədi');
        } finally {
            setIsAdjusting(false);
        }
    };

    const handleReset = () => {
        setProductId('');
        setWarehouseId('');
        setExpectedQuantity('');
        setActualQuantity('');
        setDateNoticed(new Date().toISOString().split('T')[0]);
        setInvestigation(null);
        setError('');
        setAdjustmentReason('');
        setAdjustmentSuccess(false);
        setSelectedProductData(null);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Stok Fərq Araşdırması" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                                Stok Fərq Araşdırması
                            </h2>

                            {/* Investigation Form */}
                            <form onSubmit={handleInvestigate} className="space-y-6 mb-8">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                                            Məhsul <span className="text-red-500">*</span>
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
                                            required={true}
                                            useAjaxSearch={!selectedProductData}
                                            showSearch={true}
                                            showStock={false}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-1">
                                            Anbar <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="warehouse"
                                            value={warehouseId}
                                            onChange={(e) => setWarehouseId(e.target.value)}
                                            required
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="">Anbar seçin...</option>
                                            {warehouses.map((warehouse) => (
                                                <option key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="date_noticed" className="block text-sm font-medium text-gray-700 mb-1">
                                            Fərq Müəyyən Edilmə Tarixi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="date_noticed"
                                            value={dateNoticed}
                                            onChange={(e) => setDateNoticed(e.target.value)}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="expected_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                                            Gözlənilən Miqdar <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            id="expected_quantity"
                                            value={expectedQuantity}
                                            onChange={(e) => setExpectedQuantity(e.target.value)}
                                            required
                                            step="0.001"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="actual_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                                            Faktiki Miqdar (Sayım) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            id="actual_quantity"
                                            value={actualQuantity}
                                            onChange={(e) => setActualQuantity(e.target.value)}
                                            required
                                            step="0.001"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-md bg-red-50 p-4">
                                        <div className="flex">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                            <div className="ml-3">
                                                <p className="text-sm text-red-800">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isInvestigating}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                    >
                                        {isInvestigating ? (
                                            <>
                                                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                Araşdırılır...
                                            </>
                                        ) : (
                                            'Araşdır'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Sıfırla
                                    </button>
                                </div>
                            </form>

                            {/* Investigation Results */}
                            {investigation && (
                                <div className="space-y-6">
                                    {/* Product & Warehouse Info */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {investigation.product.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            SKU: {investigation.product.sku} | Anbar: {investigation.warehouse.name}
                                        </p>
                                    </div>

                                    {/* Quantities Comparison */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                            <p className="text-sm text-blue-600 font-medium mb-1">Sistemdəki Miqdar</p>
                                            <p className="text-2xl font-bold text-blue-900">{investigation.quantities.system}</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                                            <p className="text-sm text-green-600 font-medium mb-1">Faktiki Miqdar (Sayım)</p>
                                            <p className="text-2xl font-bold text-green-900">{investigation.quantities.actual}</p>
                                        </div>
                                        <div className={`p-4 rounded-lg border-2 ${Math.abs(investigation.quantities.discrepancy) < 0.01 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                            <p className={`text-sm font-medium mb-1 ${Math.abs(investigation.quantities.discrepancy) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                                Fərq
                                            </p>
                                            <p className={`text-2xl font-bold ${Math.abs(investigation.quantities.discrepancy) < 0.01 ? 'text-green-900' : 'text-red-900'}`}>
                                                {investigation.quantities.discrepancy >= 0 ? '+' : ''}{investigation.quantities.discrepancy}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Movement Summary */}
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="text-base font-semibold text-gray-900 mb-3">Hərəkət Xülasəsi</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Ümumi Daxilolma</p>
                                                <p className="text-lg font-semibold text-green-600">+{investigation.movement_summary.total_in}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Ümumi Xaricolma</p>
                                                <p className="text-lg font-semibold text-red-600">-{investigation.movement_summary.total_out}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Transferlər (Daxil)</p>
                                                <p className="text-lg font-semibold text-blue-600">+{investigation.movement_summary.transfers_in}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Transferlər (Xaric)</p>
                                                <p className="text-lg font-semibold text-orange-600">-{investigation.movement_summary.transfers_out}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Cəmi {investigation.movement_summary.count} hərəkət qeydə alınıb
                                        </p>
                                    </div>

                                    {/* Possible Causes */}
                                    {investigation.possible_causes.length > 0 && (
                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                            <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                                Mümkün Səbəblər
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                {investigation.possible_causes.map((cause, index) => (
                                                    <li key={index}>{cause}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Recent Movements */}
                                    {investigation.recent_movements.length > 0 && (
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h4 className="text-base font-semibold text-gray-900 mb-3">Son Hərəkətlər</h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Növ</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dəyişiklik</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sonra</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">İstifadəçi</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tarix</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {investigation.recent_movements.map((movement, index) => (
                                                            <tr key={index}>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{movement.type}</td>
                                                                <td className={`px-4 py-2 text-sm font-semibold ${movement.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {movement.quantity_change >= 0 ? '+' : ''}{movement.quantity_change}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{movement.quantity_after}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">{movement.user_name}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">{movement.occurred_at}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Adjustment Section */}
                                    {Math.abs(investigation.quantities.discrepancy) > 0.01 && (
                                        <div className="bg-white p-4 rounded-lg border-2 border-indigo-200">
                                            <h4 className="text-base font-semibold text-gray-900 mb-3">Stok Düzəlişi</h4>

                                            {adjustmentSuccess ? (
                                                <div className="rounded-md bg-green-50 p-4">
                                                    <div className="flex">
                                                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                                        <div className="ml-3">
                                                            <p className="text-sm text-green-800">
                                                                Düzəliş uğurla yaradıldı! Stok sistemdə yeniləndi.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        Fərqi düzəltmək üçün sistem stokunu avtomatik olaraq <strong>{investigation.quantities.actual}</strong> ədədə çatdıracaq
                                                        (Dəyişiklik: <strong className={investigation.quantities.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {investigation.quantities.discrepancy >= 0 ? '+' : ''}{investigation.quantities.discrepancy}
                                                        </strong>)
                                                    </p>
                                                    <div className="mb-3">
                                                        <label htmlFor="adjustment_reason" className="block text-sm font-medium text-gray-700 mb-1">
                                                            Düzəliş Səbəbi <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                            id="adjustment_reason"
                                                            value={adjustmentReason}
                                                            onChange={(e) => setAdjustmentReason(e.target.value)}
                                                            rows={3}
                                                            placeholder="Stok fərqinin səbəbini izah edin..."
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleCreateAdjustment}
                                                        disabled={isAdjusting || !adjustmentReason.trim()}
                                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                                    >
                                                        {isAdjusting ? (
                                                            <>
                                                                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                                Düzəldilir...
                                                            </>
                                                        ) : (
                                                            'Stoku Düzəlt'
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
