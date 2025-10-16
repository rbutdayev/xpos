import { ServiceItem } from './serviceCalculations';

export interface ValidationErrors {
    [key: string]: string;
}

export const validateServiceRecord = (data: {
    customer_id?: string;
    description?: string;
    vehicle_id?: string;
    vehicle_mileage?: number;
}): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!data.customer_id) {
        errors.customer_id = 'Customer is required';
    }

    if (!data.description || data.description.trim() === '') {
        errors.description = 'Service description is required';
    }

    if (data.vehicle_id && !data.vehicle_mileage) {
        errors.vehicle_mileage = 'Vehicle mileage is required when vehicle is selected';
    }

    return errors;
};

export const validateServiceItem = (item: ServiceItem, index: number): ValidationErrors => {
    const errors: ValidationErrors = {};
    const prefix = `item_${index}`;

    if (item.quantity <= 0) {
        errors[`${prefix}_quantity`] = 'Quantity must be greater than 0';
    }

    if (item.unit_price < 0) {
        errors[`${prefix}_price`] = 'Price cannot be negative';
    }

    if (item.item_type === 'product' && !item.product_id) {
        errors[`${prefix}_product`] = 'Product selection is required';
    }

    if (item.item_type === 'service' && !item.service_id_ref) {
        errors[`${prefix}_service`] = 'Service selection is required';
    }

    return errors;
};

export const validatePaymentAmounts = (
    paidAmount: number,
    creditAmount: number,
    totalCost: number
): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (paidAmount < 0) {
        errors.paid_amount = 'Paid amount cannot be negative';
    }

    if (creditAmount < 0) {
        errors.credit_amount = 'Credit amount cannot be negative';
    }

    const totalPayment = paidAmount + creditAmount;
    if (Math.abs(totalPayment - totalCost) > 0.01) {
        errors.payment_total = 'Total payment amounts must equal service cost';
    }

    return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
    return Object.keys(errors).length > 0;
};

export const calculatePaymentAmounts = (
    totalCost: number,
    paymentStatus: string,
    paidAmount?: number
) => {
    switch (paymentStatus) {
        case 'paid':
            return { paid_amount: totalCost, credit_amount: 0 };
        case 'credit':
            return { paid_amount: 0, credit_amount: totalCost };
        case 'partial':
            return { 
                paid_amount: paidAmount || 0, 
                credit_amount: totalCost - (paidAmount || 0) 
            };
        default:
            return { paid_amount: 0, credit_amount: 0 };
    }
};