import { memo } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Product, Service } from '@/types';
import { ServiceItem } from '../Utils/serviceCalculations';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import SecondaryButton from '@/Components/SecondaryButton';

interface ServiceItemRowProps {
    item: ServiceItem;
    index: number;
    products: Product[];
    services: Service[];
    onUpdate: (index: number, field: keyof ServiceItem, value: string | number) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
}

export const ServiceItemRow = memo(({
    item,
    index,
    products,
    services,
    onUpdate,
    onRemove,
    disabled = false
}: ServiceItemRowProps) => {
    const updateField = (field: keyof ServiceItem, value: string | number) => {
        onUpdate(index, field, value);
    };

    const handleProductChange = (productId: string) => {
        updateField('product_id', productId);
        
        const product = products.find(p => p.id.toString() === productId);
        if (product) {
            const sellingUnit = product.base_unit || product.unit || 'ədəd';
            let unitPrice = Number(product.sale_price) || 0;
            
            updateField('item_name', product.name);
            updateField('unit_price', unitPrice);
            updateField('selling_unit', sellingUnit);
            
            // Calculate base quantity for inventory
            let baseQuantity = item.quantity;
            if (sellingUnit === 'L' && product.base_unit === 'ml') {
                baseQuantity = item.quantity * 1000;
            } else if (sellingUnit === 'ml' && product.base_unit === 'L') {
                baseQuantity = item.quantity / 1000;
            }
            updateField('base_quantity', baseQuantity);
        }
    };

    const handleServiceChange = (serviceId: string) => {
        updateField('service_id_ref', serviceId);
        
        const service = services.find(s => s.id.toString() === serviceId);
        if (service) {
            updateField('item_name', service.name);
            updateField('unit_price', Number(service.price) || 0);
            updateField('selling_unit', service.unit || 'saət');
        }
    };

    const handleQuantityChange = (quantity: number) => {
        updateField('quantity', quantity);
        
        // Recalculate base quantity if it's a product
        if (item.item_type === 'product' && item.product_id) {
            const product = products.find(p => p.id.toString() === item.product_id);
            if (product) {
                let baseQuantity = quantity;
                if (item.selling_unit === 'L' && product.base_unit === 'ml') {
                    baseQuantity = quantity * 1000;
                } else if (item.selling_unit === 'ml' && product.base_unit === 'L') {
                    baseQuantity = quantity / 1000;
                }
                updateField('base_quantity', baseQuantity);
            }
        }
    };

    const total = item.quantity * item.unit_price;

    return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Item Type */}
                    <div>
                        <InputLabel value="Növ" />
                        <select
                            value={item.item_type}
                            onChange={(e) => updateField('item_type', e.target.value)}
                            disabled={disabled}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        >
                            <option value="product">Məhsul</option>
                            <option value="service">Xidmət</option>
                        </select>
                    </div>

                    {/* Product/Service Selection */}
                    <div className="md:col-span-2">
                        <InputLabel value={item.item_type === 'product' ? 'Məhsul' : 'Xidmət'} />
                        {item.item_type === 'product' ? (
                            <select
                                value={item.product_id || ''}
                                onChange={(e) => handleProductChange(e.target.value)}
                                disabled={disabled}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            >
                                <option value="">Məhsul seçin</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} - {product.sale_price} AZN
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={item.service_id_ref || ''}
                                onChange={(e) => handleServiceChange(e.target.value)}
                                disabled={disabled}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            >
                                <option value="">Xidmət seçin</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} - {service.price} AZN
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <InputLabel value="Miqdar" />
                        <TextInput
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity || ''}
                            onChange={(e) => handleQuantityChange(Number(e.target.value))}
                            disabled={disabled}
                            className="mt-1 block w-full text-sm"
                            placeholder="0"
                        />
                        {item.selling_unit && (
                            <span className="text-xs text-gray-500 mt-1 block">{item.selling_unit}</span>
                        )}
                    </div>

                    {/* Unit Price */}
                    <div>
                        <InputLabel value="Vahid qiyməti" />
                        <TextInput
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price || ''}
                            onChange={(e) => updateField('unit_price', Number(e.target.value))}
                            disabled={disabled}
                            className="mt-1 block w-full text-sm"
                            placeholder="0.00"
                        />
                        <span className="text-xs text-gray-500 mt-1 block">AZN</span>
                    </div>

                    {/* Total */}
                    <div>
                        <InputLabel value="Cəmi" />
                        <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-medium text-gray-900">
                            {total.toFixed(2)} AZN
                        </div>
                    </div>
                </div>

                {/* Remove Button */}
                <div className="ml-4">
                    <SecondaryButton
                        type="button"
                        onClick={() => onRemove(index)}
                        disabled={disabled}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </SecondaryButton>
                </div>
            </div>

            {/* Notes */}
            <div>
                <InputLabel value="Qeydlər" />
                <textarea
                    value={item.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    disabled={disabled}
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    placeholder="Əlavə qeydlər..."
                />
            </div>
        </div>
    );
});