import { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Warehouse, Product, WarehouseTransfer, User } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableProductSelect from '@/Components/SearchableProductSelect';
import SearchableEmployeeSelect from '@/Components/SearchableEmployeeSelect';
import SearchableWarehouseSelect from '@/Components/SearchableWarehouseSelect';
import { formatQuantityWithUnit } from '@/utils/formatters';
// Using hardcoded Azerbaijani strings like other pages in the application

interface Props {
    transfer: WarehouseTransfer;
    warehouses: Warehouse[];
    products: Product[];
    employees?: User[]; // users used as employees
}

interface WarehouseProduct extends Product {
    available_stock: number;
}

interface WarehouseTransferFormData {
    from_warehouse_id: string;
    to_warehouse_id: string;
    product_id: string;
    quantity: string;
    requested_by: string;
    notes: string;
}

export default function Edit({ transfer, warehouses, products, employees }: Props) {
    const [warehouseProducts, setWarehouseProducts] = useState<WarehouseProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<WarehouseProduct | null>(null);

    const { data, setData, put, processing, errors } = useForm<WarehouseTransferFormData>({
        from_warehouse_id: transfer.from_warehouse_id?.toString() || '',
        to_warehouse_id: transfer.to_warehouse_id?.toString() || '',
        product_id: transfer.product_id?.toString() || '',
        quantity: transfer.quantity?.toString() || '',
        requested_by: transfer.requested_by?.toString() || '',
        notes: transfer.notes || '',
    });

    // Fetch products when source warehouse changes
    useEffect(() => {
        if (data.from_warehouse_id) {
            setLoadingProducts(true);
            fetch(route('warehouse-transfers.warehouse-products') + `?warehouse_id=${data.from_warehouse_id}`)
                .then(response => response.json())
                .then((data: WarehouseProduct[]) => {
                    setWarehouseProducts(data);
                    setLoadingProducts(false);
                })
                .catch(() => {
                    setWarehouseProducts([]);
                    setLoadingProducts(false);
                });
        } else {
            setWarehouseProducts([]);
            setSelectedProduct(null);
        }
    }, [data.from_warehouse_id]);

    // Update selected product info when product changes
    useEffect(() => {
        if (data.product_id && warehouseProducts.length > 0) {
            const product = warehouseProducts.find(p => p.id.toString() === data.product_id);
            setSelectedProduct(product || null);
        } else {
            setSelectedProduct(null);
        }
    }, [data.product_id, warehouseProducts]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('warehouse-transfers.update', transfer.transfer_id));
    };

    const handleWarehouseChange = (field: 'from_warehouse_id' | 'to_warehouse_id', value: string) => {
        setData(field, value);
        
        // Clear destination warehouse if it's the same as source
        if (field === 'from_warehouse_id' && value === data.to_warehouse_id) {
            setData('to_warehouse_id', '');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Transfer #${transfer.transfer_id} - Redaktə`} />

            <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex items-center mb-6">
                            <Link
                                href={route('warehouse-transfers.show', transfer.transfer_id)}
                                className="mr-4 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Link>
                            <h2 className="text-2xl font-semibold text-gray-900">
                                Transfer #{transfer.transfer_id} - Redaktə
                            </h2>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Transfer Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Transfer Məlumatları
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="from_warehouse_id" value="Mənbə Anbar *" />
                                        <SearchableWarehouseSelect
                                            warehouses={warehouses}
                                            value={data.from_warehouse_id}
                                            onChange={(warehouseId) => handleWarehouseChange('from_warehouse_id', warehouseId.toString())}
                                            placeholder="Mənbə anbar seçin"
                                            required
                                            className="mt-1"
                                        />
                                        <InputError message={errors.from_warehouse_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="to_warehouse_id" value="Təyinat Anbarı *" />
                                        <SearchableWarehouseSelect
                                            warehouses={warehouses}
                                            value={data.to_warehouse_id}
                                            onChange={(warehouseId) => handleWarehouseChange('to_warehouse_id', warehouseId.toString())}
                                            placeholder={!data.from_warehouse_id ? 'Əvvəl mənbə anbar seçin' : 'Təyinat anbarı seçin'}
                                            required
                                            disabled={!data.from_warehouse_id}
                                            excludeId={data.from_warehouse_id}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.to_warehouse_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="product_id" value="Məhsul *" />
                                        {!data.from_warehouse_id ? (
                                            <div className="mt-1 p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-500 text-sm">
                                                Məhsul seçməzdən əvvəl anbar seçin
                                            </div>
                                        ) : loadingProducts ? (
                                            <div className="mt-1 p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-500 text-sm">
                                                Məhsullar yüklənir...
                                            </div>
                                        ) : warehouseProducts.length === 0 ? (
                                            <div className="mt-1 p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-500 text-sm">
                                                Bu anbarda məhsul yoxdur
                                            </div>
                                        ) : (
                                            <SearchableProductSelect
                                                products={warehouseProducts}
                                                value={data.product_id}
                                                onChange={(value) => setData('product_id', value.toString())}
                                                placeholder="Məhsul seçin"
                                                error={errors.product_id}
                                                required
                                                className="mt-1"
                                                showBarcode={true}
                                                showPrice={false}
                                            />
                                        )}
                                        {selectedProduct && (
                                            <p className="mt-1 text-sm text-blue-600">
                                                Mövcud stok: {formatQuantityWithUnit(selectedProduct.available_stock + transfer.quantity, selectedProduct.unit)}
                                                <span className="text-gray-500 ml-1">
                                                    (Transfer məbləği daxil olmaqla)
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="quantity" value="Miqdar *" />
                                        <TextInput
                                            id="quantity"
                                            type="number"
                                            step="0.001"
                                            min="0.01"
                                            max={selectedProduct ? selectedProduct.available_stock + transfer.quantity : undefined}
                                            name="quantity"
                                            value={data.quantity}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('quantity', e.target.value)}
                                            required
                                            disabled={!selectedProduct}
                                        />
                                        <InputError message={errors.quantity} className="mt-2" />
                                        {selectedProduct && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Maksimum: {formatQuantityWithUnit(selectedProduct.available_stock + transfer.quantity, selectedProduct.unit)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="requested_by" value="Tələb edən işçi *" />
                                        <SearchableEmployeeSelect
                                            employees={employees || []}
                                            value={data.requested_by}
                                            onChange={(value) => setData('requested_by', value.toString())}
                                            placeholder="İşçi seçin"
                                            error={errors.requested_by}
                                            required
                                            className="mt-1"
                                            showPosition={true}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="notes" value="Qeydlər" />
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            placeholder="Transfer səbəbi və əlavə qeydlər"
                                        />
                                        <InputError message={errors.notes} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Warning Note */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            Xəbərdarlıq
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>
                                                Yalnız "Gözləmədə" statusu olan transferlər redaktə edilə bilər.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end space-x-2 pt-6 border-t border-gray-200">
                                <Link
                                    href={route('warehouse-transfers.show', transfer.transfer_id)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Ləğv et
                                </Link>
                                <PrimaryButton className="ml-4" disabled={processing}>
                                    {processing ? 'Yenilənir...' : 'Transferi Yenilə'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
