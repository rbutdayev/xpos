import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableProductSelect from '@/Components/SearchableProductSelect';


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



interface Props {
    products: Product[];
    warehouses: Warehouse[];
    movementTypes: Record<string, string>;
}

interface StockMovementFormData {
    warehouse_id: string;
    product_id: string;
    movement_type: string;
    quantity: string;
    unit_cost: string;
    notes: string;
}

export default function Create({ products: initialProducts, warehouses, movementTypes }: Props) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const { data, setData, post, processing, errors } = useForm<StockMovementFormData>({
        warehouse_id: '',
        product_id: '',
        movement_type: '',
        quantity: '',
        unit_cost: '',
        notes: '',
    });

    // Fetch products when warehouse changes
    useEffect(() => {
        if (data.warehouse_id) {
            setLoadingProducts(true);
            window.axios.get(route('warehouse-transfers.warehouse-products'), {
                params: { warehouse_id: data.warehouse_id }
            })
            .then(response => {
                setProducts(response.data);
                setLoadingProducts(false);
            })
            .catch(error => {
                console.error('Failed to load warehouse products:', error);
                setProducts(initialProducts);
                setLoadingProducts(false);
            });
        } else {
            setProducts(initialProducts);
        }

        // Clear product selection when warehouse changes
        setData('product_id', '');
    }, [data.warehouse_id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('stock-movements.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Stok Hərəkəti Yarat" />

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
                                        Stok Hərəkəti Yarat
                                    </h2>
                                    <p className="text-gray-600">Yeni stok hərəkəti məlumatları</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Warehouse Selection */}
                                <div>
                                    <InputLabel htmlFor="warehouse_id" value="Anbar" />
                                    <select
                                        id="warehouse_id"
                                        value={data.warehouse_id}
                                        onChange={(e) => setData('warehouse_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        required
                                    >
                                        <option value="">Anbar seçin</option>
                                        {warehouses.map(warehouse => (
                                            <option key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.warehouse_id} className="mt-2" />
                                </div>

                                {/* Product Selection */}
                                <div>
                                    <InputLabel htmlFor="product_id" value="Məhsul" />
                                    {loadingProducts ? (
                                        <div className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-500">
                                            Məhsullar yüklənir...
                                        </div>
                                    ) : !data.warehouse_id ? (
                                        <div className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-500">
                                            Əvvəl anbar seçin
                                        </div>
                                    ) : (
                                        <SearchableProductSelect
                                            products={products}
                                            value={data.product_id}
                                            onChange={(value) => setData('product_id', value.toString())}
                                            placeholder="Məhsul seçin"
                                            error={errors.product_id}
                                            required
                                            showBarcode={true}
                                            className="mt-1"
                                        />
                                    )}
                                    <InputError message={errors.product_id} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Movement Type */}
                                <div>
                                    <InputLabel htmlFor="movement_type" value="Hərəkət növü" />
                                    <select
                                        id="movement_type"
                                        value={data.movement_type}
                                        onChange={(e) => setData('movement_type', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        required
                                    >
                                        <option value="">Hərəkət növü seçin</option>
                                        {Object.entries(movementTypes).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.movement_type} className="mt-2" />
                                </div>

                                {/* Quantity */}
                                <div>
                                    <InputLabel htmlFor="quantity" value="Miqdar" />
                                    <TextInput
                                        id="quantity"
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={data.quantity}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.quantity} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Unit Cost */}
                                <div>
                                    <InputLabel htmlFor="unit_cost" value="Vahid dəyəri (İxtiyari)" />
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
                                <InputLabel htmlFor="notes" value="Qeydlər (İxtiyari)" />
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    placeholder="Əlavə məlumat"
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end">
                                <Link
                                    href={route('stock-movements.index')}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                                >
                                    Ləğv et
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Emal edilir...' : 'Hərəkət yarat'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}