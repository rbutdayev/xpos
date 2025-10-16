/**
 * Smart formatting for product quantities based on unit type
 */
export function formatQuantity(quantity: number | string, unit?: string): string {
    const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    
    if (isNaN(num)) return '0';
    
    // Units that typically use decimal places
    const decimalUnits = [
        'kq', 'qram',           // Weight units
        'litr', 'ml',           // Volume units  
        'metr', 'm²', 'm³'      // Measurement units
    ];
    
    // Units that are typically whole numbers
    const wholeUnits = [
        'ədəd', 'dənə',         // Count units
        'paket', 'dəst', 'qutu', // Package units
        'şüşə', 'torba', 'sandıq' // Container units
    ];
    
    // Determine decimal places based on unit
    if (unit && wholeUnits.includes(unit)) {
        // For count/package units, show no decimals unless fractional
        return num % 1 === 0 ? num.toString() : num.toFixed(1);
    } else if (unit && decimalUnits.includes(unit)) {
        // For weight/volume/measurement units, show up to 2 decimals
        if (num % 1 === 0) return num.toString();
        if ((num * 10) % 1 === 0) return num.toFixed(1);
        return num.toFixed(2);
    } else {
        // Default: remove unnecessary zeros
        if (num % 1 === 0) return num.toString();
        if ((num * 10) % 1 === 0) return num.toFixed(1);
        if ((num * 100) % 1 === 0) return num.toFixed(2);
        return num.toFixed(3);
    }
}

/**
 * Format quantity with unit for display
 */
export function formatQuantityWithUnit(quantity: number | string, unit?: string): string {
    const formattedQuantity = formatQuantity(quantity, unit);
    const displayUnit = unit || 'ədəd';
    return `${formattedQuantity} ${displayUnit}`;
}

/**
 * Format price with currency
 */
export function formatPrice(price: number | string): string {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(num: number | string): string {
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsedNum)) return '0';
    
    // For whole numbers, return as is
    if (parsedNum % 1 === 0) {
        return parsedNum.toString();
    }
    
    // For decimals, remove trailing zeros
    return parsedNum.toFixed(3).replace(/\.?0+$/, '');
}

/**
 * Normalize decimal separator to dot (.) from comma (,)
 */
export function normalizeDecimalInput(value: string): string {
    return value.replace(',', '.');
}

/**
 * Remove leading zeros from number input value with enhanced zero replacement
 */
export function removeLeadingZeros(value: string): string {
    if (!value || value === '') return '';
    
    // Handle negative numbers
    const isNegative = value.startsWith('-');
    const absoluteValue = isNegative ? value.slice(1) : value;
    
    // Handle decimal numbers
    if (absoluteValue.includes('.')) {
        const [integerPart, decimalPart] = absoluteValue.split('.');
        const cleanInteger = integerPart.replace(/^0+/, '') || '0';
        return (isNegative ? '-' : '') + cleanInteger + '.' + decimalPart;
    }
    
    // Handle whole numbers
    const cleanValue = absoluteValue.replace(/^0+/, '') || '0';
    return (isNegative ? '-' : '') + cleanValue;
}

/**
 * Enhanced number input change handler with comma/dot support and smart zero replacement
 * This version requires the current value to properly handle zero replacement
 */
export function handleNumberInputChange(
    newValue: string,
    currentValue: string,
    setter: (value: string) => void
): void {
    // Allow empty values for clearing the field
    if (newValue === '') {
        setter('');
        return;
    }
    
    // Normalize comma to dot for decimal separator
    const normalizedValue = normalizeDecimalInput(newValue);
    
    // Allow typing decimal point and negative sign at start
    if (normalizedValue === '.' || normalizedValue === '-' || normalizedValue === '-.') {
        setter(normalizedValue);
        return;
    }
    
    // Smart zero replacement: if current value is "0" and user types a digit (not a decimal), replace the zero
    if (currentValue === '0' && /^[1-9]/.test(normalizedValue)) {
        // User typed a non-zero digit when field was "0", replace the zero
        setter(normalizedValue);
        return;
    }
    
    // Handle the case where user types "0" followed by a number (like 01, 02, etc.)
    // This removes the leading zero from patterns like "01" -> "1"
    const cleanedValue = removeLeadingZeros(normalizedValue);
    setter(cleanedValue);
}

/**
 * Simplified wrapper for components that don't have access to current value
 * This version works with just the new value (legacy compatibility)
 */
export function handleNumberInputChangeSimple(
    value: string,
    setter: (value: string) => void
): void {
    // Allow empty values for clearing the field
    if (value === '') {
        setter('');
        return;
    }
    
    // Normalize comma to dot for decimal separator
    const normalizedValue = normalizeDecimalInput(value);
    
    // Allow typing decimal point and negative sign
    if (normalizedValue === '.' || normalizedValue === '-' || normalizedValue === '-.') {
        setter(normalizedValue);
        return;
    }
    
    // Remove leading zeros
    const cleanedValue = removeLeadingZeros(normalizedValue);
    setter(cleanedValue);
}

/**
 * React hook for enhanced number input handling
 * Returns a handler function that automatically manages the enhanced number input behavior
 */
export function useNumberInput(value: string, setter: (value: string) => void) {
    return (newValue: string) => {
        handleNumberInputChange(newValue, value, setter);
    };
}