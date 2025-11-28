import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import TextArea from '@/Components/TextArea';
import InputError from '@/Components/InputError';
import { PageProps } from '@/types';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Sale {
    sale_id: number;
    sale_number: string;
    fiscal_number?: string;
    use_fiscal_printer: boolean;
    total: string;
    sale_date: string;
    customer?: {
        name: string;
        phone?: string;
    };
    payments: Array<{
        method: string;
        amount: string;
    }>;
    items: Array<{
        item_id: number;
        product_id: number;
        product: {
            name: string;
            unit?: string;
        };
        quantity: string;
        unit_price: string;
        total: string;
        returned_quantity?: string;
        available_for_return?: string;
    }>;
}

interface CreateReturnsProps extends PageProps {
    sale: Sale;
}

interface ReturnItem {
    sale_item_id: number;
    quantity: number;
    reason: string;
}

export default function Create({ auth, sale }: CreateReturnsProps) {
    const [selectedItems, setSelectedItems] = useState<Map<number, ReturnItem>>(new Map());
    const [useFiscalPrinter, setUseFiscalPrinter] = useState(sale.use_fiscal_printer);

    const { data, setData, post, processing, errors, reset } = useForm({
        sale_id: sale.sale_id,
        items: [] as ReturnItem[],
        reason: '',
        notes: '',
        use_fiscal_printer: sale.use_fiscal_printer,
    });

    useEffect(() => {
        // Update form data when selected items change
        setData('items', Array.from(selectedItems.values()));
    }, [selectedItems]);

    useEffect(() => {
        setData('use_fiscal_printer', useFiscalPrinter);
    }, [useFiscalPrinter]);

    const handleItemToggle = (itemId: number) => {
        const newSelected = new Map(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            const saleItem = sale.items.find(i => i.item_id === itemId);
            if (saleItem) {
                const availableQty = parseFloat(saleItem.available_for_return || saleItem.quantity);
                newSelected.set(itemId, {
                    sale_item_id: itemId,
                    quantity: availableQty,
                    reason: '',
                });
            }
        }
        setSelectedItems(newSelected);
    };

    const handleQuantityChange = (itemId: number, quantity: number) => {
        const newSelected = new Map(selectedItems);
        const item = newSelected.get(itemId);
        if (item) {
            item.quantity = quantity;
            newSelected.set(itemId, item);
            setSelectedItems(newSelected);
        }
    };

    const handleReasonChange = (itemId: number, reason: string) => {
        const newSelected = new Map(selectedItems);
        const item = newSelected.get(itemId);
        if (item) {
            item.reason = reason;
            newSelected.set(itemId, item);
            setSelectedItems(newSelected);
        }
    };

    const incrementQuantity = (itemId: number) => {
        const saleItem = sale.items.find(i => i.item_id === itemId);
        const currentQty = selectedItems.get(itemId)?.quantity || 0;
        const maxQty = parseFloat(saleItem?.available_for_return || saleItem?.quantity || '0');

        if (currentQty < maxQty) {
            handleQuantityChange(itemId, currentQty + 1);
        }
    };

    const decrementQuantity = (itemId: number) => {
        const currentQty = selectedItems.get(itemId)?.quantity || 0;
        if (currentQty > 0.001) {
            handleQuantityChange(itemId, Math.max(0.001, currentQty - 1));
        }
    };

    const calculateTotal = () => {
        let total = 0;
        selectedItems.forEach((returnItem) => {
            const saleItem = sale.items.find(i => i.item_id === returnItem.sale_item_id);
            if (saleItem) {
                total += returnItem.quantity * parseFloat(saleItem.unit_price);
            }
        });
        return total.toFixed(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedItems.size === 0) {
            alert('Zəhmət olmasa ən azı bir məhsul seçin');
            return;
        }

        post(route('returns.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Mal Qaytarma - ${sale.sale_number}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Sale Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                        <h3 className="text-lg font-semibold mb-4">Satış Məlumatları</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm text-gray-600">Satış Nömrəsi</div>
                                <div className="font-medium">{sale.sale_number}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Müştəri</div>
                                <div className="font-medium">{sale.customer?.name || 'Anonim'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Ümumi Məbləğ</div>
                                <div className="font-medium">{sale.total} ₼</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Tarix</div>
                                <div className="font-medium">
                                    {new Date(sale.sale_date).toLocaleString('az-AZ')}
                                </div>
                            </div>
                            {sale.fiscal_number && (
                                <div>
                                    <div className="text-sm text-gray-600">Fiskal Nömrə</div>
                                    <div className="font-medium">{sale.fiscal_number}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Items Selection */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                            <h3 className="text-lg font-semibold mb-4">Qaytarılacaq Məhsullar</h3>

                            <div className="space-y-4">
                                {sale.items.map((item) => {
                                    const availableQty = parseFloat(item.available_for_return || item.quantity);
                                    const isSelected = selectedItems.has(item.item_id);
                                    const returnItem = selectedItems.get(item.item_id);

                                    return (
                                        <div
                                            key={item.item_id}
                                            className={`border rounded-lg p-4 ${
                                                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleItemToggle(item.item_id)}
                                                    className="mt-1 rounded border-gray-300 text-blue-600"
                                                    disabled={availableQty <= 0}
                                                />

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium">{item.product.name}</div>
                                                            <div className="text-sm text-gray-600">
                                                                Alınıb: {item.quantity} {item.product.unit || 'ədəd'} × {item.unit_price} ₼
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Qaytarıla bilər: {availableQty} {item.product.unit || 'ədəd'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-semibold">{item.total} ₼</div>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-4 space-y-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Qaytarılan Miqdar
                                                                </label>
                                                                <div className="flex items-center space-x-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => decrementQuantity(item.item_id)}
                                                                        className="p-2 border rounded hover:bg-gray-100"
                                                                    >
                                                                        <MinusIcon className="h-4 w-4" />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        value={returnItem?.quantity || 0}
                                                                        onChange={(e) =>
                                                                            handleQuantityChange(
                                                                                item.item_id,
                                                                                parseFloat(e.target.value) || 0
                                                                            )
                                                                        }
                                                                        min="0.001"
                                                                        max={availableQty}
                                                                        step="0.001"
                                                                        className="w-24 text-center border-gray-300 rounded-md shadow-sm"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => incrementQuantity(item.item_id)}
                                                                        className="p-2 border rounded hover:bg-gray-100"
                                                                    >
                                                                        <PlusIcon className="h-4 w-4" />
                                                                    </button>
                                                                    <span className="text-sm text-gray-600">
                                                                        {item.product.unit || 'ədəd'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Qaytarma Səbəbi
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={returnItem?.reason || ''}
                                                                    onChange={(e) =>
                                                                        handleReasonChange(item.item_id, e.target.value)
                                                                    }
                                                                    placeholder="Məsələn: qüsurlu, səhv məhsul, və s."
                                                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {errors.items && <InputError message={errors.items} className="mt-2" />}
                        </div>

                        {/* Return Details */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                            <h3 className="text-lg font-semibold mb-4">Qaytarma Məlumatları</h3>

                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="reason" value="Ümumi Qaytarma Səbəbi" />
                                    <TextArea
                                        id="reason"
                                        value={data.reason}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('reason', e.target.value)}
                                        placeholder="Qaytarmanın ümumi səbəbi (ixtiyari)"
                                        rows={3}
                                    />
                                    <InputError message={errors.reason} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="notes" value="Qeydlər" />
                                    <TextArea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                                        placeholder="Əlavə qeydlər (ixtiyari)"
                                        rows={2}
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="use_fiscal_printer"
                                        checked={useFiscalPrinter}
                                        onChange={(e) => setUseFiscalPrinter(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600"
                                    />
                                    <label htmlFor="use_fiscal_printer" className="ml-2 text-sm text-gray-700">
                                        Fiskal qəbz çap et
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        {selectedItems.size > 0 && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                                <h3 className="text-lg font-semibold mb-4">Xülasə</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Seçilmiş məhsul sayı:</span>
                                        <span className="font-medium">{selectedItems.size}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Qaytarılacaq məbləğ:</span>
                                        <span>{calculateTotal()} ₼</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        * Geri ödəniş orijinal ödəniş metodları ilə həyata keçiriləcək
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.visit(route('sales.show', sale.sale_id))}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                disabled={processing}
                            >
                                Ləğv et
                            </button>
                            <PrimaryButton type="submit" disabled={processing || selectedItems.size === 0}>
                                {processing ? 'İcra olunur...' : 'Qaytarmanı Tamamla'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
