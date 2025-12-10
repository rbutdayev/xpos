/**
 * Currency configuration interface
 */
export interface CurrencyConfig {
    code: string;
    name: string;
    symbol: string;
    decimal_places: number;
    symbol_position: 'before' | 'after';
}

/**
 * Format amount with currency symbol and proper formatting
 *
 * @param amount - The amount to format
 * @param currency - Optional currency configuration (uses default if not provided)
 * @returns Formatted currency string
 */
export function formatCurrency(
    amount: number | string,
    currency?: CurrencyConfig | null
): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) {
        return formatCurrency(0, currency);
    }

    // Use default currency if not provided
    const currencyConfig = currency || getDefaultCurrency();

    // Format the number with proper decimal places
    const formattedAmount = num.toLocaleString('en-US', {
        minimumFractionDigits: currencyConfig.decimal_places,
        maximumFractionDigits: currencyConfig.decimal_places,
    });

    // Position the symbol
    return currencyConfig.symbol_position === 'before'
        ? `${currencyConfig.symbol}${formattedAmount}`
        : `${formattedAmount}${currencyConfig.symbol}`;
}

/**
 * Format amount using Intl.NumberFormat for proper internationalization
 *
 * @param amount - The amount to format
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR', 'AZN')
 * @returns Formatted currency string
 */
export function formatCurrencyWithIntl(
    amount: number | string,
    currencyCode?: string
): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) {
        return formatCurrencyWithIntl(0, currencyCode);
    }

    const code = currencyCode || 'USD';

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code,
        }).format(num);
    } catch (error) {
        // Fallback if currency code is invalid
        console.warn(`Invalid currency code: ${code}`, error);
        return num.toFixed(2);
    }
}

/**
 * Get currency symbol from configuration
 *
 * @param currency - Currency configuration
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency?: CurrencyConfig | null): string {
    return currency?.symbol || getDefaultCurrency().symbol;
}

/**
 * Get currency decimal places
 *
 * @param currency - Currency configuration
 * @returns Number of decimal places
 */
export function getCurrencyDecimals(currency?: CurrencyConfig | null): number {
    return currency?.decimal_places ?? getDefaultCurrency().decimal_places;
}

/**
 * Get default currency (USD)
 *
 * @returns Default currency configuration
 */
export function getDefaultCurrency(): CurrencyConfig {
    return {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimal_places: 2,
        symbol_position: 'before',
    };
}

/**
 * Parse currency string to number
 * Removes currency symbols and formatting
 *
 * @param value - Currency string
 * @returns Parsed number
 */
export function parseCurrency(value: string): number {
    // Remove currency symbols, commas, and spaces
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleanValue) || 0;
}

/**
 * Format a range of amounts
 *
 * @param min - Minimum amount
 * @param max - Maximum amount
 * @param currency - Currency configuration
 * @returns Formatted range string
 */
export function formatCurrencyRange(
    min: number,
    max: number,
    currency?: CurrencyConfig | null
): string {
    return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
}
