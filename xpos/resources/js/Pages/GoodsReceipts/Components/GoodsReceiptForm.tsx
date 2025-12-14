import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableSupplierSelect from '@/Components/SearchableSupplierSelect';
import SearchableWarehouseSelect from '@/Components/SearchableWarehouseSelect';
import useGoodsReceiptForm, { ProductItem } from '../Hooks/useGoodsReceiptForm';
import { useProductSearch } from '../Hooks/useProductSearch';
import ProductSearchSection from './ProductSearchSection';
import { TrashIcon } from '@heroicons/react/24/outline';
import { GoodsReceipt } from '@/types';
import { useTranslations } from '@/Hooks/useTranslations';
import { useTranslation } from 'react-i18next';

interface Product { id: number; name: string; sku: string; barcode?: string; unit: string; base_unit?: string; packaging_size?: string; packaging_quantity?: number; unit_price?: number; purchase_price?: number; sale_price?: number; }
interface Supplier { id: number; name: string; payment_terms_days?: number; payment_terms_text?: string; }
interface Warehouse { id: number; name: string; }
interface Employee { employee_id: number; name: string; }

interface Props {
    suppliers: Supplier[];
    warehouses: Warehouse[];
    employees?: Employee[];
    receipt?: GoodsReceipt;
    batchReceipts?: GoodsReceipt[];
    isEditing?: boolean;
}

export default function GoodsReceiptForm({ suppliers, warehouses, employees, receipt, batchReceipts, isEditing = false }: Props) {
    const { t } = useTranslation(['inventory', 'common']);
    const { translatePaymentMethod } = useTranslations();
    const {
        form, submit, submitAsDraft, submitAsCompleted, addProduct, removeProduct, updateProduct, handleFileChange,
        selectedSupplier, calculatedDueDate, handleSupplierChange, handlePaymentMethodChange,
        handleCustomTermsToggle, handleCustomTermsChange
    } = useGoodsReceiptForm(receipt, batchReceipts, isEditing);

    const { query, setQuery, results, loading, error } = useProductSearch();

    const handleProductSelect = (product: Product) => {
        // Ensure products is an array
        if (!Array.isArray(form.data.products)) {
            console.error('form.data.products is not an array:', form.data.products);
            return;
        }

        // Check if product is already added - if so, increment quantity
        const existingIndex = form.data.products.findIndex(p => p.product_id === product.id.toString());
        if (existingIndex >= 0) {
            // Auto-increment quantity instead of showing alert
            const currentQty = parseFloat(form.data.products[existingIndex].quantity) || 0;
            updateProduct(existingIndex, 'quantity', (currentQty + 1).toString());
            setQuery(''); // Clear search after selection
            return;
        }

        addProduct(product);
        setQuery(''); // Clear search after selection
    };

    return (
        <div className="overflow-hidden">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Warehouse */}
            <div className="bg-gray-50 rounded-lg p-4">
                <InputLabel htmlFor="warehouse_id" value={`${t('goodsReceipts.selectWarehouse')} *`} />
                <SearchableWarehouseSelect
                    warehouses={warehouses}
                    value={form.data.warehouse_id}
                    onChange={(id) => (form.setData as any)('warehouse_id', id.toString())}
                    placeholder={t('goodsReceipts.selectWarehouse')}
                    required
                    className="mt-2"
                />
            </div>

            {/* Supplier */}
            <div className="bg-gray-50 rounded-lg p-4">
                <InputLabel htmlFor="supplier_id" value={`${t('goodsReceipts.supplier')} *`} />
                <SearchableSupplierSelect
                    suppliers={suppliers}
                    value={form.data.supplier_id}
                    onChange={(value) => handleSupplierChange(value.toString(), suppliers)}
                    placeholder={t('goodsReceipts.selectSupplier')}
                    required={true}
                />
            </div>

            {/* Supplier Invoice Number - Optional */}
            {!isEditing && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <InputLabel htmlFor="invoice_number" value="Faktura Nömrəsi" />
                    <TextInput
                        id="invoice_number"
                        type="text"
                        value={form.data.invoice_number || ''}
                        onChange={(e) => (form.setData as any)('invoice_number', e.target.value)}
                        className="mt-2 block w-full"
                        placeholder="Təchizatçının faktura nömrəsini daxil edin (ixtiyari)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Təchizatçıdan aldığınız faktura nömrəsini daxil edin. Bu, bütün məhsulları bir partiyada qruplaşdırmağa kömək edəcək.
                    </p>
                </div>
            )}

            {/* Product Search */}
            <div className="bg-blue-50 rounded-lg p-4">
                <InputLabel value={t('goodsReceipts.productSearch')} className="mb-2" />
                <ProductSearchSection
                    query={query}
                    setQuery={setQuery}
                    loading={loading}
                    results={results}
                    error={error}
                    onSelect={handleProductSelect}
                    selectedProduct={null}
                />
            </div>

            {/* Payment Method Selection - Only show when creating */}
            {!isEditing && (
                <div className="bg-yellow-50 rounded-lg p-4">
                    <InputLabel value={`${t('goodsReceipts.paymentMethod')} *`} className="mb-3" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-yellow-100 ${
                            form.data.payment_method === 'instant' ? 'border-yellow-500 bg-yellow-100' : 'border-gray-300'
                        }`}>
                            <input
                                type="radio"
                                value="instant"
                                checked={form.data.payment_method === 'instant'}
                                onChange={(e) => handlePaymentMethodChange(e.target.value as 'instant' | 'credit')}
                                className="mr-3"
                            />
                            <div>
                                <div className="font-medium">{t('goodsReceipts.payInstantly')}</div>
                                <div className="text-sm text-gray-600">{t('goodsReceipts.cashPayment')}</div>
                            </div>
                        </label>
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-yellow-100 ${
                            form.data.payment_method === 'credit' ? 'border-yellow-500 bg-yellow-100' : 'border-gray-300'
                        }`}>
                            <input
                                type="radio"
                                value="credit"
                                checked={form.data.payment_method === 'credit'}
                                onChange={(e) => handlePaymentMethodChange(e.target.value as 'instant' | 'credit')}
                                className="mr-3"
                            />
                            <div>
                                <div className="font-medium">{t('goodsReceipts.creditDebt')}</div>
                                <div className="text-sm text-gray-600">{t('goodsReceipts.keepOnSupplierDebt')}</div>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* Payment Terms Information */}
            {!isEditing && selectedSupplier && form.data.payment_method === 'credit' && (
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">{t('goodsReceipts.paymentTerms')}</h4>

                    {/* Supplier default payment terms */}
                    <div className="mb-4">
                        <p className="text-blue-700 mb-2">
                            {t('goodsReceipts.supplier')}: {selectedSupplier.payment_terms_text ||
                                (selectedSupplier.payment_terms_days ?
                                    t('goodsReceipts.daysPaymentTerm', { days: selectedSupplier.payment_terms_days }) :
                                    t('goodsReceipts.paymentTermsNotSet')
                                )
                            }
                        </p>
                    </div>

                    {/* Custom payment terms option */}
                    <div className="border-t border-blue-200 pt-3">
                        <label className="flex items-center mb-3">
                            <input
                                type="checkbox"
                                checked={form.data.use_custom_terms}
                                onChange={(e) => handleCustomTermsToggle(e.target.checked)}
                                className="mr-3"
                            />
                            <span className="font-medium text-blue-900">{t('goodsReceipts.customPaymentTerms')}</span>
                        </label>

                        {form.data.use_custom_terms && (
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <TextInput
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={form.data.custom_payment_terms}
                                    onChange={(e) => handleCustomTermsChange(parseInt(e.target.value) || 0)}
                                    placeholder={t('goodsReceipts.enterCustomTerms')}
                                    className="w-20"
                                />
                                <span className="text-blue-700 text-sm">{t('goodsReceipts.calculatesDueDate')}</span>
                            </div>
                        )}
                    </div>

                    {/* Calculated due date */}
                    {calculatedDueDate && (
                        <div className="mt-3 p-2 bg-blue-100 rounded">
                            <p className="text-blue-800 font-medium">{t('goodsReceipts.dueDate')}: {calculatedDueDate}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Products List */}
            {Array.isArray(form.data.products) && form.data.products.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-900">{t('goodsReceipts.addedProducts')} ({form.data.products.length})</h3>
                    </div>
                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                        {form.data.products.map((productItem: ProductItem, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{productItem.product?.name || t('product')}</h4>
                                        <p className="text-sm text-gray-600">SKU: {productItem.product?.sku || 'N/A'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeProduct(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                                    <div>
                                        <InputLabel value={`${t('quantity')} *`} />
                                        <TextInput
                                            value={productItem.quantity}
                                            onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                                            className="mt-1 w-full"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value={t('goodsReceipts.unit')} />
                                        {productItem.product?.packaging_quantity && productItem.product?.unit_price ? (
                                            <select
                                                value={productItem.receiving_unit || productItem.unit}
                                                onChange={(e) => updateProduct(index, 'receiving_unit', e.target.value)}
                                                className="mt-1 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <option value={productItem.product.base_unit || 'L'}>
                                                    {productItem.product.base_unit || 'L'} ({t('goodsReceipts.unit')})
                                                </option>
                                                <option value="qab">
                                                    Qab ({productItem.product.packaging_size})
                                                </option>
                                            </select>
                                        ) : (
                                            <TextInput
                                                value={productItem.unit}
                                                onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                                                className="mt-1 w-full"
                                                readOnly
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <InputLabel value={t('purchasePrice')} />
                                        <TextInput
                                            value={productItem.unit_cost}
                                            onChange={(e) => updateProduct(index, 'unit_cost', e.target.value)}
                                            className="mt-1 w-full"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={productItem.product?.purchase_price ? `${t('current')}: ${productItem.product.purchase_price}` : "0.00"}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Endirim %" />
                                        <TextInput
                                            value={productItem.discount_percent || '0'}
                                            onChange={(e) => updateProduct(index, 'discount_percent', e.target.value)}
                                            className="mt-1 w-full"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value={t('salePrice')} />
                                        <TextInput
                                            value={productItem.sale_price || ''}
                                            onChange={(e) => updateProduct(index, 'sale_price', e.target.value)}
                                            className="mt-1 w-full"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={productItem.product?.sale_price ? `${t('current')}: ${productItem.product.sale_price}` : "0.00"}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value={t('baseQuantity')} />
                                        <TextInput
                                            value={productItem.base_quantity}
                                            className="mt-1 w-full"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                {/* Show calculated total for this product */}
                                <div className="mt-2 text-sm text-gray-600 flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span>Ara cəm: {(() => {
                                        const qty = parseFloat(productItem.quantity) || 0;
                                        const cost = parseFloat(productItem.unit_cost) || 0;
                                        return (qty * cost).toFixed(2);
                                    })()} AZN</span>
                                    {parseFloat(productItem.discount_percent || '0') > 0 && (
                                        <>
                                            <span className="text-red-600">Endirim: -{(() => {
                                                const qty = parseFloat(productItem.quantity) || 0;
                                                const cost = parseFloat(productItem.unit_cost) || 0;
                                                const discount = parseFloat(productItem.discount_percent) || 0;
                                                const subtotal = qty * cost;
                                                return ((subtotal * discount) / 100).toFixed(2);
                                            })()} AZN ({productItem.discount_percent}%)</span>
                                            <span className="font-bold text-green-700">Yekun: {(() => {
                                                const qty = parseFloat(productItem.quantity) || 0;
                                                const cost = parseFloat(productItem.unit_cost) || 0;
                                                const discount = parseFloat(productItem.discount_percent) || 0;
                                                const subtotal = qty * cost;
                                                const discountAmount = (subtotal * discount) / 100;
                                                return (subtotal - discountAmount).toFixed(2);
                                            })()} AZN</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Document */}
            <div className="bg-gray-50 rounded-lg p-4">
                <InputLabel htmlFor="document" value={t('document')} className="mb-2" />
                <input
                    id="document"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            {/* Notes */}
            <div className="bg-gray-50 rounded-lg p-4">
                <InputLabel htmlFor="notes" value={t('notes')} className="mb-2" />
                <textarea
                    id="notes"
                    rows={3}
                    value={form.data.notes}
                    onChange={(e) => (form.setData as any)('notes', e.target.value)}
                    className="mt-2 w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder={t('additionalInfo')}
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 sm:flex-1">
                    {form.data.products.length > 0 && (
                        <span>{t('goodsReceipts.noProductsAdded')}</span>
                    )}
                </div>
                {!isEditing || (isEditing && receipt?.status === 'draft') ? (
                    <>
                        {/* Save as Draft Button - Black */}
                        <button
                            type="button"
                            onClick={submitAsDraft}
                            disabled={form.processing || form.data.products.length === 0}
                            className="w-full sm:w-auto px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {form.processing ? t('processing') : 'Qaralama olaraq saxla'}
                        </button>
                        {/* Complete Receipt Button - Blue */}
                        <button
                            type="button"
                            onClick={submitAsCompleted}
                            disabled={form.processing || form.data.products.length === 0}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {form.processing ? t('processing') : 'Mal qəbulunu tamamla'}
                        </button>
                    </>
                ) : (
                    <PrimaryButton
                        type="button"
                        onClick={submit}
                        disabled={form.processing || form.data.products.length === 0}
                        className="w-full sm:w-auto"
                    >
                        {form.processing ? t('processing') : t('goodsReceipts.save')}
                    </PrimaryButton>
                )}
            </div>
            </form>
        </div>
    );
}

