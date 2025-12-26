<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'language',
        'address',
        'tax_number',
        'phone',
        'email',
        'settings',
        'shop_slug',
        'shop_enabled',
        'shop_warehouse_id',
        'shop_settings',
        'shop_sms_merchant_notifications',
        'shop_notification_phone',
        'shop_sms_customer_notifications',
        'shop_customer_sms_template',
        'notification_settings',
        'auto_print_receipt',
        'fiscal_printer_enabled',
        // Delivery platform integrations
        'wolt_enabled',
        'wolt_api_key',
        'wolt_restaurant_id',
        'wolt_warehouse_id',
        'wolt_branch_id',
        'yango_enabled',
        'yango_api_key',
        'yango_restaurant_id',
        'yango_warehouse_id',
        'yango_branch_id',
        'bolt_enabled',
        'bolt_api_key',
        'bolt_restaurant_id',
        'bolt_warehouse_id',
        'bolt_branch_id',
    ];

    /**
     * The attributes that aren't mass assignable.
     * Security: Protect sensitive administrative fields
     *
     * @var list<string>
     */
    protected $guarded = [
        'id',
        'is_active',                   // Only super admin can activate/deactivate
        'monthly_payment_amount',      // Only super admin can set payment amount
        'payment_start_date',          // Only super admin can set payment dates
        'subscription_plan',           // Only super admin can change plans
        'loyalty_module_enabled',      // Paid features - only super admin
        'services_module_enabled',     // Paid features - only super admin
        'rent_module_enabled',         // Paid features - only super admin
        'discounts_module_enabled',    // Paid features - only super admin
        'gift_cards_module_enabled',   // Paid features - only super admin
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'monthly_payment_amount' => 'decimal:2',
        'payment_start_date' => 'date',
        'shop_enabled' => 'boolean',
        'shop_settings' => 'array',
        'shop_sms_merchant_notifications' => 'boolean',
        'shop_sms_customer_notifications' => 'boolean',
        'notification_settings' => 'array',
        'auto_print_receipt' => 'boolean',
        'fiscal_printer_enabled' => 'boolean',
        'loyalty_module_enabled' => 'boolean',
        'services_module_enabled' => 'boolean',
        'rent_module_enabled' => 'boolean',
        'discounts_module_enabled' => 'boolean',
        'gift_cards_module_enabled' => 'boolean',
        // Delivery platform integrations
        'wolt_enabled' => 'boolean',
        'wolt_api_key' => 'encrypted',
        'yango_enabled' => 'boolean',
        'yango_api_key' => 'encrypted',
        'bolt_enabled' => 'boolean',
        'bolt_api_key' => 'encrypted',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latest();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(AccountPayment::class);
    }

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function shopWarehouse(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'shop_warehouse_id');
    }

    // Delivery platform warehouse and branch relationships
    public function woltWarehouse(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'wolt_warehouse_id');
    }

    public function woltBranch(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Branch::class, 'wolt_branch_id');
    }

    public function yangoWarehouse(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'yango_warehouse_id');
    }

    public function yangoBranch(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Branch::class, 'yango_branch_id');
    }

    public function boltWarehouse(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'bolt_warehouse_id');
    }

    public function boltBranch(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Branch::class, 'bolt_branch_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function tailorServices(): HasMany
    {
        return $this->hasMany(TailorService::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function fiscalPrinterConfig(): HasOne
    {
        return $this->hasOne(FiscalPrinterConfig::class);
    }

    public function isActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }
        
        $subscription = $this->getCurrentSubscription();
        return $subscription ? $subscription->isActive() : true; // Allow accounts without subscription for now
    }

    public function getCurrentSubscription(): ?Subscription
    {
        return $this->subscription;
    }

    // Shop-related helper methods
    public function isShopEnabled(): bool
    {
        return $this->shop_enabled && $this->shop_slug;
    }

    public function getShopUrl(): ?string
    {
        if (!$this->isShopEnabled()) {
            return null;
        }

        // Generate shop URL using subdomain: shop.xpos.az/{slug}
        $shopDomain = config('app.shop_domain', 'shop.' . parse_url(config('app.url'), PHP_URL_HOST));
        $protocol = parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'https';

        return $protocol . '://' . $shopDomain . '/' . $this->shop_slug;
    }

    public function getShopSetting(string $key, $default = null)
    {
        return data_get($this->shop_settings, $key, $default);
    }

    public function updateShopSettings(array $settings): void
    {
        $this->update([
            'shop_settings' => array_merge($this->shop_settings ?? [], $settings)
        ]);
    }

    // Loyalty-related helper methods
    public function isLoyaltyModuleEnabled(): bool
    {
        return $this->loyalty_module_enabled ?? false;
    }

    // Services module helper methods
    public function isServicesModuleEnabled(): bool
    {
        return $this->services_module_enabled ?? false;
    }

    // Rent module helper methods
    public function isRentModuleEnabled(): bool
    {
        return $this->rent_module_enabled ?? false;
    }

    // Discounts module helper methods
    public function isDiscountsModuleEnabled(): bool
    {
        return $this->discounts_module_enabled ?? false;
    }

    // Gift cards module helper methods
    public function isGiftCardsModuleEnabled(): bool
    {
        return $this->gift_cards_module_enabled ?? false;
    }

    // Delivery platform helper methods
    public function isWoltEnabled(): bool
    {
        return $this->wolt_enabled ?? false;
    }

    public function isYangoEnabled(): bool
    {
        return $this->yango_enabled ?? false;
    }

    public function isBoltEnabled(): bool
    {
        return $this->bolt_enabled ?? false;
    }

    public function hasAnyPlatformEnabled(): bool
    {
        return $this->isWoltEnabled() || $this->isYangoEnabled() || $this->isBoltEnabled();
    }

    public function hasSmsConfigured(): bool
    {
        // Check if SMS credentials exist for this account
        return SmsCredential::where('account_id', $this->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Check if integration/dependency is configured
     * Used for module dependency checking
     */
    public function isDependencyMet(string $dependency): bool
    {
        return match($dependency) {
            'sms' => $this->hasSmsConfigured(),
            'telegram' => $this->hasTelegramConfigured(),
            'loyalty' => $this->isLoyaltyModuleEnabled(),
            'services' => $this->isServicesModuleEnabled(),
            'rent' => $this->isRentModuleEnabled(),
            'shop' => $this->isShopEnabled(),
            'discounts' => $this->isDiscountsModuleEnabled(),
            'gift_cards' => $this->isGiftCardsModuleEnabled(),
            default => false,
        };
    }

    /**
     * Check if all dependencies are met for a module
     * @param array $dependencies Array of dependency IDs
     * @return array ['met' => bool, 'missing' => array of missing dependency names]
     */
    public function checkModuleDependencies(array $dependencies): array
    {
        $missing = [];

        $dependencyNames = [
            'sms' => 'SMS Xidməti',
            'telegram' => 'Telegram Bot',
            'loyalty' => 'Loyallıq Proqramı',
            'services' => 'Xidmətlər Modulu',
            'rent' => 'İcarə Modulu',
            'shop' => 'Online Mağaza',
            'discounts' => 'Endirimlər Modulu',
            'gift_cards' => 'Hədiyyə Kartları',
        ];

        foreach ($dependencies as $dependency) {
            if (!$this->isDependencyMet($dependency)) {
                $missing[] = $dependencyNames[$dependency] ?? $dependency;
            }
        }

        return [
            'met' => empty($missing),
            'missing' => $missing,
        ];
    }

    public function getCustomerSmsTemplate(): string
    {
        // Default template if not customized
        $default = "Hörmətli {customer_name}, sifarişiniz qəbul edildi!\n"
            . "Sifariş №: {order_number}\n"
            . "Məbləğ: {total} ₼\n"
            . "Əlaqə: {shop_phone}\n"
            . "{shop_name}";

        return $this->shop_customer_sms_template ?: $default;
    }

    public function getMerchantNotificationPhone(): ?string
    {
        return $this->shop_notification_phone ?: $this->phone;
    }

    // === UNIFIED NOTIFICATION SYSTEM METHODS ===

    /**
     * Get notification setting value
     * Handles both dot-separated paths and literal dot keys
     */
    public function getNotificationSetting(string $key, $default = null)
    {
        // For event-based keys like "merchant.new_order.recipients.sms" (deeper paths)
        // Check this FIRST before matching shorter paths
        if (preg_match('/^([\w]+\.[\w]+)\.(.+\..+)/', $key, $matches)) {
            $eventKey = $matches[1]; // e.g., "merchant.new_order"
            $remainingPath = $matches[2]; // e.g., "recipients.sms"

            if (isset($this->notification_settings[$eventKey])) {
                return data_get($this->notification_settings[$eventKey], $remainingPath, $default);
            }
        }

        // For simpler paths like "merchant.new_order.enabled"
        if (preg_match('/^([\w]+\.[\w]+)\.(enabled|channels|recipients|templates)$/', $key, $matches)) {
            $eventKey = $matches[1]; // e.g., "merchant.new_order"
            $settingKey = $matches[2]; // e.g., "enabled"

            if (isset($this->notification_settings[$eventKey][$settingKey])) {
                return $this->notification_settings[$eventKey][$settingKey];
            }
        }

        // Fallback to standard data_get for other paths
        return data_get($this->notification_settings, $key, $default);
    }

    /**
     * Update notification settings
     */
    public function updateNotificationSettings(array $settings): void
    {
        $this->update([
            'notification_settings' => array_merge($this->notification_settings ?? [], $settings)
        ]);
    }

    /**
     * Check if Telegram is configured for this account
     */
    public function hasTelegramConfigured(): bool
    {
        return TelegramCredential::where('account_id', $this->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get enabled notification channels for a specific event
     * @param string $event e.g., 'merchant.new_order', 'customer.order_confirmation'
     * @return array e.g., ['sms', 'telegram']
     */
    public function getEnabledChannels(string $event): array
    {
        $enabled = $this->getNotificationSetting("{$event}.enabled", false);

        if (!$enabled) {
            return [];
        }

        $channels = $this->getNotificationSetting("{$event}.channels", []);

        // Filter channels based on what's actually configured
        return array_filter($channels, function($channel) {
            if ($channel === 'sms') {
                return $this->hasSmsConfigured();
            }
            if ($channel === 'telegram') {
                return $this->hasTelegramConfigured();
            }
            return false;
        });
    }

    /**
     * Get notification template for a specific event and channel
     */
    public function getNotificationTemplate(string $event, string $channel): ?string
    {
        return $this->getNotificationSetting("{$event}.templates.{$channel}");
    }

    /**
     * Get notification recipient for a specific event and channel
     */
    public function getNotificationRecipient(string $event, string $channel): ?string
    {
        $recipient = $this->getNotificationSetting("{$event}.recipients.{$channel}");

        // Fallback to default recipient if not set
        if (!$recipient) {
            if ($channel === 'sms') {
                return $this->getNotificationSetting('default_recipients.sms') ?: $this->phone;
            }
            if ($channel === 'telegram') {
                // Try default_recipients.telegram first, then fall back to TelegramCredential's default_chat_id
                $defaultRecipient = $this->getNotificationSetting('default_recipients.telegram');
                if ($defaultRecipient) {
                    return $defaultRecipient;
                }

                // Fallback to TelegramCredential's default_chat_id
                $telegramCred = TelegramCredential::where('account_id', $this->id)
                    ->where('is_active', true)
                    ->first();
                return $telegramCred?->default_chat_id;
            }
        }

        return $recipient;
    }

    /**
     * Check if a specific notification event is enabled
     */
    public function isNotificationEnabled(string $event): bool
    {
        return $this->getNotificationSetting("{$event}.enabled", false);
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($account) {
            // Create default rental categories for new account
            \App\Models\RentalCategory::createDefaultCategoriesForAccount($account->id);
            
            // Copy master rental agreement templates to new account
            \App\Models\RentalAgreementTemplate::copyMasterTemplatesToAccount($account->id);
        });
    }
}
