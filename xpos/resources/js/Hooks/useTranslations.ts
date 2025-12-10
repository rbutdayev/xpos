import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

/**
 * Hook to access backend translations for enums
 *
 * Usage:
 * const { paymentMethods, expenseTypes, translatePaymentMethod } = useTranslations();
 *
 * // Get translated label
 * translatePaymentMethod('cash') // Returns "Cash" or "Nağd" based on locale
 *
 * // Get all options for a dropdown
 * Object.entries(paymentMethods).map(([value, label]) => ({ value, label }))
 */
export function useTranslations() {
    const { translations = {}, locale = 'en' } = usePage<PageProps>().props;

    const translateEnum = (type: keyof typeof translations, value: string): string => {
        const enumTranslations = translations[type] || {};
        return enumTranslations[value] || value;
    };

    return {
        // Current locale
        locale,

        // Enum translations
        paymentMethods: translations.payment_methods || {},
        expenseTypes: translations.expense_types || {},
        subscriptionPlans: translations.subscription_plans || {},
        userRoles: translations.user_roles || {},
        saleStatuses: translations.sale_statuses || {},

        // Helper functions
        translatePaymentMethod: (value: string) => translateEnum('payment_methods', value),
        translateExpenseType: (value: string) => translateEnum('expense_types', value),
        translateSubscriptionPlan: (value: string) => translateEnum('subscription_plans', value),
        translateUserRole: (value: string) => translateEnum('user_roles', value),
        translateSaleStatus: (value: string) => translateEnum('sale_statuses', value),

        // Generic translator
        translate: translateEnum,

        // Locale helpers
        isAzerbaijani: locale === 'az',
        isEnglish: locale === 'en',
    };
}
