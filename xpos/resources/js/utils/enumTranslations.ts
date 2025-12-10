/**
 * Enum translation helper for use in non-React contexts
 * (like table config objects)
 *
 * Note: This uses hardcoded maps for now.
 * TODO: Connect to backend translations when possible
 */

// Get current locale from document or default to 'az'
const getCurrentLocale = (): string => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('i18nextLng') || 'az';
    }
    return 'az';
};

const PAYMENT_METHOD_TRANSLATIONS = {
    en: {
        'nağd': 'Cash',
        'cash': 'Cash',
        'kart': 'Card',
        'card': 'Card',
        'köçürmə': 'Bank Transfer',
        'bank_transfer': 'Bank Transfer',
        'bank_credit': 'Bank Credit',
        'gift_card': 'Gift Card',
    },
    az: {
        'nağd': 'Nağd',
        'cash': 'Nağd',
        'kart': 'Kart',
        'card': 'Kart',
        'köçürmə': 'Köçürmə',
        'bank_transfer': 'Bank köçürməsi',
        'bank_credit': 'Bank krediti',
        'gift_card': 'Hədiyyə kartı',
    },
};

/**
 * Translate payment method
 */
export const translatePaymentMethod = (method: string): string => {
    const locale = getCurrentLocale();
    const translations = PAYMENT_METHOD_TRANSLATIONS[locale as keyof typeof PAYMENT_METHOD_TRANSLATIONS]
        || PAYMENT_METHOD_TRANSLATIONS.az;

    return translations[method as keyof typeof translations] || method;
};

/**
 * Get payment method badge color
 */
export const getPaymentMethodColor = (method: string): string => {
    const normalized = method.toLowerCase();
    if (normalized === 'nağd' || normalized === 'cash') {
        return 'bg-green-100 text-green-800';
    }
    if (normalized === 'kart' || normalized === 'card') {
        return 'bg-blue-100 text-blue-800';
    }
    return 'bg-purple-100 text-purple-800';
};
