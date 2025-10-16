import { Product, Service } from '@/types';

export interface ServiceItem {
    item_type: 'product' | 'service';
    product_id?: string;
    service_id_ref?: string;
    item_name?: string;
    quantity: number;
    base_quantity?: number;
    unit_price: number;
    selling_unit?: string;
    notes?: string;
}

export interface ServiceTotals {
    itemsCost: number;
    laborCost: number;
    totalCost: number;
    formattedItemsCost: string;
    formattedLaborCost: string;
    formattedTotalCost: string;
}

export const calculateServiceTotals = (
    serviceItems: ServiceItem[],
    laborCost: number = 0
): ServiceTotals => {
    const itemsCost = serviceItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
    }, 0);

    const totalCost = laborCost + itemsCost;

    return {
        itemsCost,
        laborCost,
        totalCost,
        formattedItemsCost: formatCurrency(itemsCost),
        formattedLaborCost: formatCurrency(laborCost),
        formattedTotalCost: formatCurrency(totalCost),
    };
};

export const calculatePaymentAmounts = (
    paymentStatus: string,
    totalCost: number
): { paidAmount: number; creditAmount: number } => {
    switch (paymentStatus) {
        case 'paid':
            return { paidAmount: totalCost, creditAmount: 0 };
        case 'credit':
            return { paidAmount: 0, creditAmount: totalCost };
        case 'partial':
        default:
            return { paidAmount: 0, creditAmount: 0 };
    }
};

export const calculateBaseQuantity = (
    product: Product,
    quantity: number,
    sellingUnit: string
): number => {
    if (sellingUnit === 'L' && product.base_unit === 'ml') {
        return quantity * 1000;
    }
    if (sellingUnit === 'ml' && product.base_unit === 'L') {
        return quantity / 1000;
    }
    return quantity;
};

export const determineSellingUnit = (product: Product): string => {
    return product.base_unit || product.unit || 'ədəd';
};

export const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(2)} AZN`;
};

export const parseServiceItemFromProduct = (
    product: Product,
    quantity: number = 1
): Partial<ServiceItem> => {
    const sellingUnit = determineSellingUnit(product);
    const unitPrice = Number(product.sale_price) || 0;
    const baseQuantity = calculateBaseQuantity(product, quantity, sellingUnit);

    return {
        item_type: 'product',
        product_id: product.id.toString(),
        item_name: product.name,
        quantity,
        base_quantity: baseQuantity,
        unit_price: unitPrice,
        selling_unit: sellingUnit,
        notes: ''
    };
};

export const parseServiceItemFromService = (
    service: Service,
    quantity: number = 1
): Partial<ServiceItem> => {
    return {
        item_type: 'service',
        service_id_ref: service.id.toString(),
        item_name: service.name,
        quantity,
        unit_price: Number(service.price) || 0,
        selling_unit: service.unit || 'saət',
        notes: ''
    };
};