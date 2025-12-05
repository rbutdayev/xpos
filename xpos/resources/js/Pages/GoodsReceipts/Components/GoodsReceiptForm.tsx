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

interface Product { id: number; name: string; sku: string; barcode?: string; unit: string; base_unit?: string; packaging_size?: string; packaging_quantity?: number; unit_price?: number; purchase_price?: number; sale_price?: number; }
interface Supplier { id: number; name: string; payment_terms_days?: number; payment_terms_text?: string; }
interface Warehouse { id: number; name: string; }
interface Employee { employee_id: number; name: string; }

interface Props { 
    suppliers: Supplier[]; 
    warehouses: Warehouse[]; 
    employees?: Employee[];
    receipt?: GoodsReceipt; 
    isEditing?: boolean; 
}

export default function GoodsReceiptForm({ suppliers, warehouses, employees, receipt, isEditing = false }: Props) {
    const {
        form, submit, addProduct, removeProduct, updateProduct, handleFileChange,
        selectedSupplier, calculatedDueDate, handleSupplierChange, handlePaymentMethodChange,
        handleCustomTermsToggle, handleCustomTermsChange
    } = useGoodsReceiptForm(receipt, isEditing);

    const { query, setQuery, results, loading, error } = useProductSearch();

    const handleProductSelect = (product: Product) => {
        // Check if product is already added
        const existingProduct = form.data.products.find(p => p.product_id === product.id.toString());
        if (existingProduct) {
            alert('Bu məhsul artıq əlavə edilib');
            return;
        }
        
        addProduct(product);
        setQuery(''); // Clear search after selection
    };

    return (
        <div className="overflow-hidden">
            <form onSubmit={submit} className="space-y-6">
            {/* Warehouse */}
            <div className="bg-gray-50 rounded-lg p-4">
                <InputLabel htmlFor="warehouse_id" value="Anbar *" />
                <SearchableWarehouseSelect
                    warehouses={warehouses}
                    value={form.data.warehouse_id}
                    onChange={(id) => (form.setData as any)('warehouse_id', id.toString())}
                    placeholder="Anbar seçin"
                    required
                    className="mt-2"
                />
            </div>

            {/* Supplier */}
            <div className="bg-gray-50 rounded-lg p-4">
                <InputLabel htmlFor="supplier_id" value="Təchizatçı *" />
                <SearchableSupplierSelect
                    suppliers={suppliers}
                    value={form.data.supplier_id}
                    onChange={(value) => handleSupplierChange(value.toString(), suppliers)}
                    placeholder="Təchizatçı seçin"
                    required={true}
                />
            </div>

            {/* Product Search */}
            <div className="bg-blue-50 rounded-lg p-4">
                <InputLabel value="Məhsul axtarışı və əlavə etmə" className="mb-2" />
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
                    <InputLabel value="Ödəmə Metodu *" className="mb-3" />
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
                                <div className="font-medium">Dərhal ödə</div>
                                <div className="text-sm text-gray-600">Nağd ödəniş</div>
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
                                <div className="font-medium">Borc (Müddətli ödəmə)</div>
                                <div className="text-sm text-gray-600">Təchizatçı borcunda saxla</div>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* Payment Terms Information */}
            {!isEditing && selectedSupplier && form.data.payment_method === 'credit' && (
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Ödəmə Şərtləri</h4>
                    
                    {/* Supplier default payment terms */}
                    <div className="mb-4">
                        <p className="text-blue-700 mb-2">
                            Təchizatçı: {selectedSupplier.payment_terms_text || 
                                (selectedSupplier.payment_terms_days ? 
                                    `${selectedSupplier.payment_terms_days} gün müddətdə ödəmə` : 
                                    'Ödəmə şərtləri müəyyən edilməyib'
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
                            <span className="font-medium text-blue-900">Fərqli ödəmə müddəti təyin et</span>
                        </label>
                        
                        {form.data.use_custom_terms && (
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <TextInput
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={form.data.custom_payment_terms}
                                    onChange={(e) => handleCustomTermsChange(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-20"
                                />
                                <span className="text-blue-700 text-sm">gün sonra ödənilsin</span>
                            </div>
                        )}
                    </div>

                    {/* Calculated due date */}
                    {calculatedDueDate && (
                        <div className="mt-3 p-2 bg-blue-100 rounded">
                            <p className="text-blue-800 font-medium">Son ödəmə tarixi: {calculatedDueDate}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Products List */}
            {form.data.products.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-900">Seçilmiş məhsullar ({form.data.products.length})</h3>
                    </div>
                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                        {form.data.products.map((productItem: ProductItem, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{productItem.product?.name || 'Məhsul'}</h4>
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
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div>
                                        <InputLabel value="Miqdar *" />
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
                                        <InputLabel value="Qəbul vahidi" />
                                        {productItem.product?.packaging_quantity && productItem.product?.unit_price ? (
                                            <select
                                                value={productItem.receiving_unit || productItem.unit}
                                                onChange={(e) => updateProduct(index, 'receiving_unit', e.target.value)}
                                                className="mt-1 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <option value={productItem.product.base_unit || 'L'}>
                                                    {productItem.product.base_unit || 'L'} (Vahid)
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
                                        <InputLabel value="Alış qiyməti" />
                                        <TextInput
                                            value={productItem.unit_cost}
                                            onChange={(e) => updateProduct(index, 'unit_cost', e.target.value)}
                                            className="mt-1 w-full"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={productItem.product?.purchase_price ? `Hazırda: ${productItem.product.purchase_price}` : "0.00"}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Satış qiyməti" />
                                        <TextInput
                                            value={productItem.sale_price || ''}
                                            onChange={(e) => updateProduct(index, 'sale_price', e.target.value)}
                                            className="mt-1 w-full"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={productItem.product?.sale_price ? `Hazırda: ${productItem.product.sale_price}` : "0.00"}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Baza miqdarı" />
                                        <TextInput
                                            value={productItem.base_quantity}
                                            className="mt-1 w-full"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Document */}
            <div className="bg-gray-50 rounded-lg p-4">
                <InputLabel htmlFor="document" value="Sənəd (PDF/PNG/JPG)" className="mb-2" />
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
                <InputLabel htmlFor="notes" value="Qeydlər" className="mb-2" />
                <textarea 
                    id="notes" 
                    rows={3} 
                    value={form.data.notes} 
                    onChange={(e) => (form.setData as any)('notes', e.target.value)} 
                    className="mt-2 w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                    placeholder="Bu mal qəbulu haqqında əlavə məlumat..."
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 sm:flex-1">
                    {form.data.products.length > 0 && (
                        <span>Toplam {form.data.products.length} məhsul seçilmişdir</span>
                    )}
                </div>
                <PrimaryButton 
                    disabled={form.processing || form.data.products.length === 0}
                    className="w-full sm:w-auto"
                >
                    {form.processing ? 'Emal edilir...' : `Mal qəbulunu tamamla${form.data.products.length > 0 ? ` (${form.data.products.length} məhsul)` : ''}`}
                </PrimaryButton>
            </div>
            </form>
        </div>
    );
}

