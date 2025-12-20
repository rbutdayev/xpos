import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    price?: number;
}

interface Warehouse {
    id: number;
    name: string;
}

interface StockMovement {
    movement_id: number;
    warehouse_id: number;
    product_id: number;
    movement_type: string;
    quantity: number;
    unit_cost?: number;
    employee_id?: number;
    notes?: string;
    created_at: string;
}

interface Props {
    movement: StockMovement;
    products: Product[];
    warehouses: Warehouse[];
    movementTypes: Record<string, string>;
}

interface StockMovementFormData {
    unit_cost: string;
    notes: string;
}

export default function Edit({ movement, products, warehouses, movementTypes }: Props) {
    const { t } = useTranslation(['inventory', 'common']);
    const { data, setData, put, processing, errors } = useForm<StockMovementFormData>({
        unit_cost: movement.unit_cost?.toString() || '',
        notes: movement.notes || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('stock-movements.update', movement.movement_id));
    };

    const product = products.find(p => p.id === movement.product_id);
    const warehouse = warehouses.find(w => w.id === movement.warehouse_id);

    return (
        <AuthenticatedLayout>
            <Head title={t('editStockMovement')} />

            <div className="px-4 sm:px-6 lg:px-8">
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
                                        {t('editStockMovement')}
                                    </h2>
                                    <p className="text-gray-600">{t('updateMovementDetails')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Read-only information */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-semibold">{t('product')}:</span> {product?.name} ({product?.sku})
                                </div>
                                <div>
                                    <span className="font-semibold">{t('stockMovements.warehouse')}:</span> {warehouse?.name}
                                </div>
                                <div>
                                    <span className="font-semibold">{t('stockMovements.movementType')}:</span> {movementTypes[movement.movement_type]}
                                </div>
                                <div>
                                    <span className="font-semibold">{t('quantity')}:</span> {movement.quantity}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Unit Cost */}
                                <div>
                                    <InputLabel htmlFor="unit_cost" value={`${t('stockMovements.unitCost')} (${t('optional')})`} />
                                    <TextInput
                                        id="unit_cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.unit_cost}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('unit_cost', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    <InputError message={errors.unit_cost} className="mt-2" />
                                </div>

                            </div>

                            {/* Notes */}
                            <div>
                                <InputLabel htmlFor="notes" value={`${t('notes')} (${t('optional')})`} />
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    placeholder={t('additionalInfo')}
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end">
                                <Link
                                    href={route('stock-movements.index')}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                                >
                                    {t('cancel')}
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? t('processing') : t('update')}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}