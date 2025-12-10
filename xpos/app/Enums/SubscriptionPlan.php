<?php

namespace App\Enums;

enum SubscriptionPlan: string
{
    case STARTER = 'starter';
    case PROFESSIONAL = 'professional';
    case ENTERPRISE = 'enterprise';

    /**
     * Get all values as an array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get the display name for the subscription plan
     */
    public function label(): string
    {
        return match($this) {
            self::STARTER => __('enums.subscription_plans.starter'),
            self::PROFESSIONAL => __('enums.subscription_plans.professional'),
            self::ENTERPRISE => __('enums.subscription_plans.enterprise'),
        };
    }

    /**
     * Get Azerbaijani translation (legacy support)
     */
    public function labelAz(): string
    {
        return match($this) {
            self::STARTER => 'Başlanğıc',
            self::PROFESSIONAL => 'Professional',
            self::ENTERPRISE => 'Enterprise',
        };
    }

    /**
     * Get the price for the plan (example values)
     */
    public function price(): float
    {
        return match($this) {
            self::STARTER => 0.00,
            self::PROFESSIONAL => 29.99,
            self::ENTERPRISE => 99.99,
        };
    }
}
