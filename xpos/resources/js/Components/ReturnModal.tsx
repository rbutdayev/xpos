import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { XMarkIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ReturnModalProps {
    show: boolean;
    onClose: () => void;
}

interface SaleItem {
    item_id: number;
    product: {
        name: string;
        unit?: string;
    };
    quantity: number;
    unit_price: number;
    returned_quantity: number;
    available_for_return: number;
}

interface Sale {
    sale_id: number;
    sale_number: string;
    total: string;
    use_fiscal_printer: boolean;
    items: SaleItem[];
    customer?: {
        name: string;
    };
}

export default function ReturnModal({ show, onClose }: ReturnModalProps) {
    const [saleNumber, setSaleNumber] = useState('');
    const [searching, setSearching] = useState(false);
    const [sale, setSale] = useState<Sale | null>(null);
    const [selectedItems, setSelectedItems] = useState<Map<number, { quantity: number; reason: string }>>(new Map());
    const [processing, setProcessing] = useState(false);

    const handleSearch = async () => {
        if (!saleNumber.trim()) {
            toast.error('Satış nömrəsi daxil edin');
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`/sales/search?query=${encodeURIComponent(saleNumber)}`);
            const data = await response.json();

            if (data.success && data.sales && data.sales.length > 0) {
                const foundSale = data.sales[0];

                // Fetch full sale details with return info
                const detailsResponse = await fetch(`/api/sales/${foundSale.sale_id}/for-return`);
                const detailsData = await detailsResponse.json();

                if (detailsData.success) {
                    setSale(detailsData.sale);
                    setSelectedItems(new Map());
                } else {
                    toast.error('Satış məlumatları yüklənə bilmədi');
                }
            } else {
                toast.error('Satış tapılmadı');
                setSale(null);
            }
        } catch (error) {
            toast.error('Axtarış xətası');
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const toggleItem = (itemId: number, availableQty: number) => {
        const newSelected = new Map(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.set(itemId, { quantity: availableQty, reason: '' });
        }
        setSelectedItems(newSelected);
    };

    const updateQuantity = (itemId: number, quantity: number) => {
        const newSelected = new Map(selectedItems);
        const item = newSelected.get(itemId);
        if (item) {
            item.quantity = quantity;
            newSelected.set(itemId, item);
            setSelectedItems(newSelected);
        }
    };

    const handleSubmit = async () => {
        if (!sale || selectedItems.size === 0) {
            toast.error('Zəhmət olmasa ən azı bir məhsul seçin');
            return;
        }

        const items = Array.from(selectedItems.entries()).map(([sale_item_id, data]) => ({
            sale_item_id,
            quantity: data.quantity,
            reason: data.reason,
        }));

        setProcessing(true);

        router.post('/returns', {
            sale_id: sale.sale_id,
            items,
            reason: '',
            notes: '',
            use_fiscal_printer: sale.use_fiscal_printer,
        }, {
            onSuccess: () => {
                toast.success('Qaytarma uğurla tamamlandı!');
                handleClose();
            },
            onError: (errors) => {
                toast.error(errors.error || 'Xəta baş verdi');
                setProcessing(false);
            },
        });
    };

    const handleClose = () => {
        setSaleNumber('');
        setSale(null);
        setSelectedItems(new Map());
        setProcessing(false);
        onClose();
    };

    const calculateTotal = () => {
        if (!sale) return 0;
        let total = 0;
        selectedItems.forEach((data, itemId) => {
            const item = sale.items.find(i => i.item_id === itemId);
            if (item) {
                total += data.quantity * item.unit_price;
            }
        });
        return total.toFixed(2);
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ArrowUturnLeftIcon className="w-7 h-7 mr-2 text-red-600" />
                        Mal Qaytarma
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Section */}
                <div className="mb-6">
                    <InputLabel htmlFor="saleNumber" value="Satış / Qəbz Nömrəsi" />
                    <div className="flex space-x-2 mt-2">
                        <TextInput
                            id="saleNumber"
                            type="text"
                            value={saleNumber}
                            onChange={(e) => setSaleNumber(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Məsələn: SAL0001"
                            className="flex-1"
                            autoFocus
                        />
                        <PrimaryButton onClick={handleSearch} disabled={searching}>
                            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                            {searching ? 'Axtarılır...' : 'Axtar'}
                        </PrimaryButton>
                    </div>
                </div>

                {/* Sale Details */}
                {sale && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Satış №:</span>
                                    <span className="ml-2 font-semibold">{sale.sale_number}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Müştəri:</span>
                                    <span className="ml-2 font-semibold">{sale.customer?.name || 'Anonim'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Məbləğ:</span>
                                    <span className="ml-2 font-semibold">{sale.total} ₼</span>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                {sale.items.map((item) => (
                                    <div
                                        key={item.item_id}
                                        className={`border rounded-lg p-4 ${
                                            selectedItems.has(item.item_id)
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-200'
                                        } ${item.available_for_return <= 0 ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.item_id)}
                                                onChange={() => toggleItem(item.item_id, item.available_for_return)}
                                                disabled={item.available_for_return <= 0}
                                                className="mt-1 rounded border-gray-300 text-red-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium">{item.product.name}</div>
                                                        <div className="text-sm text-gray-600">
                                                            Satılan: {item.quantity} {item.product.unit || 'ədəd'} × {item.unit_price} ₼
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Qaytarıla bilər: <span className="font-semibold text-red-600">
                                                                {item.available_for_return} {item.product.unit || 'ədəd'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedItems.has(item.item_id) && (
                                                    <div className="mt-3">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Qaytarılan Miqdar
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={selectedItems.get(item.item_id)?.quantity || 0}
                                                            onChange={(e) =>
                                                                updateQuantity(item.item_id, parseFloat(e.target.value) || 0)
                                                            }
                                                            min="0.001"
                                                            max={item.available_for_return}
                                                            step="0.001"
                                                            className="w-32 border-gray-300 rounded-md shadow-sm"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-600">
                                                            {item.product.unit || 'ədəd'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        {selectedItems.size > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Qaytarılacaq məbləğ:</span>
                                    <span className="text-red-600">{calculateTotal()} ₼</span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    Seçilmiş məhsul: {selectedItems.size}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <SecondaryButton onClick={handleClose} disabled={processing}>
                                Ləğv et
                            </SecondaryButton>
                            <PrimaryButton
                                onClick={handleSubmit}
                                disabled={processing || selectedItems.size === 0}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {processing ? 'İcra olunur...' : 'Qaytarmanı Tamamla'}
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {!sale && !searching && (
                    <div className="text-center py-12 text-gray-500">
                        <ArrowUturnLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Satış nömrəsini daxil edin və axtarın</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
