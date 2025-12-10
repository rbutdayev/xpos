<?php

namespace App\Services;

class TranslationService
{
    /**
     * Translate enum value
     */
    public static function enum(string $type, string $value): string
    {
        return __("enums.{$type}.{$value}");
    }

    /**
     * Get all translations for an enum type
     */
    public static function enumOptions(string $type): array
    {
        $translations = __("enums.{$type}");

        if (!is_array($translations)) {
            return [];
        }

        return $translations;
    }

    /**
     * Translate payment method
     */
    public static function paymentMethod(string $method): string
    {
        return self::enum('payment_methods', $method);
    }

    /**
     * Translate expense type
     */
    public static function expenseType(string $type): string
    {
        return self::enum('expense_types', $type);
    }

    /**
     * Translate subscription plan
     */
    public static function subscriptionPlan(string $plan): string
    {
        return self::enum('subscription_plans', $plan);
    }

    /**
     * Translate user role
     */
    public static function userRole(string $role): string
    {
        return self::enum('user_roles', $role);
    }

    /**
     * Translate sale status
     */
    public static function saleStatus(string $status): string
    {
        return self::enum('sale_statuses', $status);
    }

    /**
     * Get current locale
     */
    public static function currentLocale(): string
    {
        return app()->getLocale();
    }

    /**
     * Check if current locale is Azerbaijani
     */
    public static function isAzerbaijani(): bool
    {
        return self::currentLocale() === 'az';
    }

    /**
     * Check if current locale is English
     */
    public static function isEnglish(): bool
    {
        return self::currentLocale() === 'en';
    }
}
