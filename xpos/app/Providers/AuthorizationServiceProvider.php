<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthorizationServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        \App\Models\Product::class => \App\Policies\ProductPolicy::class,
        \App\Models\Sale::class => \App\Policies\SalePolicy::class,
        \App\Models\PrinterConfig::class => \App\Policies\PrinterConfigPolicy::class,
        \App\Models\ReceiptTemplate::class => \App\Policies\ReceiptTemplatePolicy::class,
        \App\Models\StockMovement::class => \App\Policies\StockMovementPolicy::class,
        \App\Models\ProductReturn::class => \App\Policies\ProductReturnPolicy::class,
        \App\Models\WarehouseTransfer::class => \App\Policies\WarehouseTransferPolicy::class,
        \App\Models\MinMaxAlert::class => \App\Policies\MinMaxAlertPolicy::class,
        \App\Models\Expense::class => \App\Policies\ExpensePolicy::class,
        \App\Models\ExpenseCategory::class => \App\Policies\ExpenseCategoryPolicy::class,
        \App\Models\AuditLog::class => \App\Policies\AuditLogPolicy::class,
        \App\Models\LoyaltyCard::class => \App\Policies\LoyaltyCardPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerGates();
    }

    /**
     * Register the authorization gates.
     */
    protected function registerGates(): void
    {
        // Dashboard Access
        Gate::define('access-dashboard', function (User $user) {
            // Super admins don't have an account, so check separately
            if ($user->isSuperAdmin()) {
                return $user->isActive();
            }
            return $user->isActive() && $user->account && $user->account->isActive();
        });

        // Sales Management
        Gate::define('manage-sales', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'sales_staff', 'warehouse_admin'
            ]);
        });

        // Inventory Control
        Gate::define('manage-inventory', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'sales_staff', 'warehouse_admin'
            ]);
        });

        // Customer Management
        Gate::define('manage-customers', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'sales_staff'
            ]);
        });

        // Online Orders Management
        Gate::define('manage-online-orders', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'sales_staff', 'branch_manager', 'accountant'
            ]);
        });

        // Financial Reports
        Gate::define('view-financial-reports', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'accountant'
            ]);
        });

        // Reports and Analytics (including SMS logs, Telegram logs, Audit logs)
        Gate::define('view-reports', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'accountant', 'branch_manager'
            ]);
        });

        // System Settings
        Gate::define('manage-system-settings', function (User $user) {
            if ($user->isSuperAdmin()) {
                return $user->isActive();
            }

            return $user->isActive()
                && $user->account
                && $user->account->isActive()
                && in_array($user->role, ['account_owner', 'admin']);
        });

        // User Management
        Gate::define('manage-users', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin'
            ]);
        });

        // Branch Operations
        Gate::define('manage-branch-operations', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin'
            ]);
        });

        // Account Owner specific permissions
        Gate::define('manage-account', function (User $user) {
            return $user->isOwner() && $user->account && $user->account->isActive();
        });

        // Subscription management
        Gate::define('manage-subscription', function (User $user) {
            return $user->isOwner();
        });

        // Product Management
        Gate::define('manage-products', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'warehouse_manager', 'accountant'
            ]);
        });

        // Supplier Management
        Gate::define('manage-suppliers', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'warehouse_manager', 'accountant'
            ]);
        });

        // Tailor Service Management (renamed from Service Management)
        Gate::define('manage-services', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'tailor'
            ]);
        });

        // Customer Items Management (renamed from Vehicle Management)
        Gate::define('manage-vehicles', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'sales_staff', 'tailor'
            ]);
        });

        // Tailor Service Record Creation (renamed from Service Record Creation)
        Gate::define('create-service-records', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'tailor'
            ]);
        });

        // Expense Management
        Gate::define('manage-expenses', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'accountant'
            ]);
        });

        // Expense Category Management
        Gate::define('manage-expense-categories', function (User $user) {
            return $user->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'accountant'
            ]);
        });


        // Multi-tenant data access - ensure users can only access their account's data
        Gate::define('access-account-data', function (User $user, $model = null) {
            // Super admins can access everything
            if ($user->isSuperAdmin()) {
                return $user->isActive();
            }

            if (!$user->isActive() || !$user->account || !$user->account->isActive()) {
                return false;
            }

            // If no model provided, just check user access
            if ($model === null) {
                return true;
            }

            // If the model has an account_id, check it matches user's account
            if (isset($model->account_id)) {
                return $model->account_id === $user->account_id;
            }

            // If the model belongs to an account through a relationship
            if (method_exists($model, 'account')) {
                return $model->account->id === $user->account_id;
            }

            return true;
        });

        // Create data in account (accountant excluded - they can only view)
        Gate::define('create-account-data', function (User $user) {
            return $user->isActive() && $user->account && $user->account->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'tailor'
            ]);
        });

        // Edit data in account (accountant excluded - they can only view)
        Gate::define('edit-account-data', function (User $user) {
            return $user->isActive() && $user->account && $user->account->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'tailor'
            ]);
        });

        // Delete data in account
        Gate::define('delete-account-data', function (User $user) {
            return $user->isActive() && $user->account && $user->account->isActive() && in_array($user->role, [
                'account_owner', 'admin'
            ]);
        });

        // Access POS system (excludes tailor and accountant roles)
        Gate::define('access-pos', function (User $user) {
            return $user->isActive() && $user->account && $user->account->isActive() && in_array($user->role, [
                'account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier'
            ]);
        });

        // Loyalty Cards Management (Super Admin only)
        Gate::define('manage-loyalty-cards', function (User $user) {
            return $user->isSuperAdmin();
        });

        // Assign Loyalty Cards (All active users can assign cards to their customers)
        Gate::define('assign-loyalty-cards', function (User $user) {
            return $user->isActive() && $user->account && $user->account->isActive();
        });

        // Gift Cards Management (Super Admin only)
        Gate::define('manage-gift-cards', function (User $user) {
            return $user->isSuperAdmin();
        });

        // Use Gift Cards (All active users can use gift cards at their account if module enabled)
        Gate::define('use-gift-cards', function (User $user) {
            return $user->isActive() &&
                   $user->account &&
                   $user->account->isActive() &&
                   $user->account->isGiftCardsModuleEnabled();
        });
    }
}
