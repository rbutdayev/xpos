<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Account;
use App\Models\StorageSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('superadmin');
    }

    /**
     * Show the super admin dashboard
     */
    public function index(): Response
    {
        try {
            $stats = [
                'total_accounts' => Account::count(),
                'active_accounts' => Account::where('is_active', true)->count(),
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),

                // Detailed statistics
                'accounts' => [
                    'total' => Account::count(),
                    'active' => Account::where('is_active', true)->count(),
                    'suspended' => Account::where('is_active', false)->count(),
                    'created_this_month' => Account::whereMonth('created_at', now()->month)->count(),
                ],

                'users' => [
                    'total' => User::count(),
                    'active' => User::where('status', 'active')->count(),
                    'inactive' => User::where('status', 'inactive')->count(),
                    'created_this_month' => User::whereMonth('created_at', now()->month)->count(),
                ],

                'roles' => User::select('role', DB::raw('count(*) as count'))
                              ->groupBy('role')
                              ->pluck('count', 'role')
                              ->toArray(),
            ];

            return Inertia::render('SuperAdmin/Dashboard', [
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            \Log::error('SuperAdmin Dashboard Error: ' . $e->getMessage());
            return Inertia::render('SuperAdmin/Dashboard', [
                'stats' => [
                    'total_accounts' => 0,
                    'active_accounts' => 0,
                    'total_users' => 0,
                    'active_users' => 0,
                    'accounts' => ['total' => 0, 'active' => 0, 'suspended' => 0, 'created_this_month' => 0],
                    'users' => ['total' => 0, 'active' => 0, 'inactive' => 0, 'created_this_month' => 0],
                    'roles' => [],
                ],
                'error' => 'Məlumat bazası xətası: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * List all accounts
     */
    public function accounts(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'plan' => 'nullable|string|in:başlanğıc,professional,enterprise',
        ]);

        $search = $validated['search'] ?? null;
        $plan = $validated['plan'] ?? null;

        // Map Azerbaijani plan names to database enum values for filtering
        $planMapping = [
            'başlanğıc' => 'starter',
            'professional' => 'professional',
            'enterprise' => 'enterprise',
        ];
        $dbPlan = $plan ? ($planMapping[$plan] ?? null) : null;

        $accounts = Account::query()
            ->when($search, function ($query, $search) {
                $query->where('company_name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
            })
            ->when($dbPlan, function ($query, $dbPlan) {
                $query->where('subscription_plan', $dbPlan);
            })
            ->withCount('users')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('SuperAdmin/Accounts', [
            'accounts' => $accounts,
            'search' => $search,
            'plan' => $plan,
            'plans' => [
                'başlanğıc' => 'Başlanğıc',
                'professional' => 'Professional',
                'enterprise' => 'Korporativ'
            ],
        ]);
    }

    /**
     * Show account details
     */
    public function showAccount(Account $account)
    {
        $account->load(['users' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        $stats = [
            'total_users' => $account->users()->count(),
            'active_users' => $account->users()->where('status', 'active')->count(),
            'last_login' => $account->users()->whereNotNull('last_login_at')->latest('last_login_at')->first()?->last_login_at,
        ];

        return Inertia::render('SuperAdmin/AccountDetails', [
            'account' => $account,
            'stats' => $stats,
        ]);
    }

    /**
     * Suspend/activate account
     */
    public function toggleAccountStatus(Account $account)
    {
        $newStatus = !$account->is_active;

        // Direct assignment is needed because is_active is in the $guarded array
        $account->is_active = $newStatus;
        $account->save();

        return redirect()->back()->with('success',
            $newStatus
                ? 'Hesab aktivləşdirildi.'
                : 'Hesab dayandırıldı.'
        );
    }

    /**
     * List all users across accounts
     */
    public function users(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
        ]);

        $search = $validated['search'] ?? null;
        
        $users = User::query()
            ->with(['account:id,company_name'])
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%')
                      ->orWhereHas('account', function ($q) use ($search) {
                          $q->where('company_name', 'like', '%' . $search . '%');
                      });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('SuperAdmin/Users', [
            'users' => $users,
            'search' => $search,
        ]);
    }

    /**
     * Show system statistics
     */
    public function systemStats()
    {
        $stats = [
            // Account statistics
            'accounts' => [
                'total' => Account::count(),
                'active' => Account::where('is_active', true)->count(),
                'suspended' => Account::where('is_active', false)->count(),
                'created_this_month' => Account::whereMonth('created_at', now()->month)->count(),
            ],
            
            // User statistics
            'users' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
                'inactive' => User::where('status', 'inactive')->count(),
                'created_this_month' => User::whereMonth('created_at', now()->month)->count(),
            ],
            
            // Role distribution
            'roles' => User::select('role', DB::raw('count(*) as count'))
                          ->groupBy('role')
                          ->pluck('count', 'role')
                          ->toArray(),
        ];

        return Inertia::render('SuperAdmin/SystemStats', [
            'stats' => $stats,
        ]);
    }

    /**
     * Create new account
     */
    public function createAccount(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_email' => 'required|email|unique:users,email',
                'user_password' => 'required|string|min:8',
                'subscription_plan' => 'required|in:başlanğıc,professional,enterprise',
                'monthly_payment_amount' => 'nullable|numeric|min:0',
                'payment_start_date' => 'nullable|date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Account validation failed', [
                'errors' => $e->errors(),
                'data' => $request->all()
            ]);
            throw $e;
        }

        try {
            DB::transaction(function () use ($validated) {
                // Map Azerbaijani plan names to database enum values
                $planMapping = [
                    'başlanğıc' => 'starter',
                    'professional' => 'professional',
                    'enterprise' => 'enterprise',
                ];
                $dbPlan = $planMapping[$validated['subscription_plan']] ?? 'starter';

                // Generate a temporary company name from email
                // User will set the actual company name during setup wizard
                $emailUsername = explode('@', $validated['user_email'])[0];
                $tempCompanyName = ucfirst($emailUsername) . ' Company';

                // Create account with explicit defaults
                $account = Account::create([
                    'company_name' => $tempCompanyName, // Temporary name - will be set in setup wizard
                    'email' => $validated['user_email'], // Use account owner's email
                    'phone' => null,
                    'address' => null,
                    'language' => 'az',
                    'settings' => [
                        'timezone' => 'Asia/Baku',
                        'currency' => 'AZN',
                        'date_format' => 'd.m.Y',
                    ],
                ]);

                // Verify account was created successfully
                if (!$account || !$account->id) {
                    throw new \Exception('Account creation failed - no ID returned');
                }

                // Set guarded fields directly (subscription_plan, is_active, payment fields)
                $account->subscription_plan = $dbPlan;
                $account->is_active = true;
                $account->monthly_payment_amount = $validated['monthly_payment_amount'] ?? null;
                $account->payment_start_date = $validated['payment_start_date'] ?? null;
                $account->save();

                // Create initial user as account owner (no branch_id - will be set during setup wizard)
                // Company, Branch, and Warehouse will be created during the setup wizard
                $user = User::create([
                    'name' => ucfirst($emailUsername), // Use email username as initial name
                    'email' => $validated['user_email'],
                    'password' => bcrypt($validated['user_password']),
                    'position' => 'Administrator',
                    'hire_date' => now(),
                    'branch_id' => null, // Will be set during setup wizard
                ]);

                if (!$user || !$user->id) {
                    throw new \Exception('User creation failed - no ID returned');
                }

                // Set guarded fields directly (account_id, role, status, permissions)
                $user->account_id = $account->id;
                $user->role = 'account_owner';
                $user->status = 'active';
                $user->permissions = [
                    'manage_users' => true,
                    'manage_products' => true,
                    'manage_sales' => true,
                    'manage_inventory' => true,
                    'manage_reports' => true,
                    'manage_settings' => true,
                ];
                $user->save();

                // Create active subscription
                \App\Models\Subscription::create([
                    'account_id' => $account->id,
                    'plan_type' => $dbPlan,
                    'price' => $validated['monthly_payment_amount'] ?? 0,
                    'status' => 'active',
                    'starts_at' => now()->toDateString(),
                    'expires_at' => now()->addYear()->toDateString(), // 1 year subscription
                    'billing_cycle' => 'monthly',
                ]);

                \Log::info('Account and user created successfully - user will complete setup wizard', [
                    'account_id' => $account->id,
                    'user_id' => $user->id,
                    'email' => $validated['user_email']
                ]);
            });
        } catch (\Exception $e) {
            \Log::error('Account creation failed: ' . $e->getMessage(), [
                'data' => $validated,
                'trace' => $e->getTraceAsString(),
                'sql_error' => $e instanceof \Illuminate\Database\QueryException ? $e->errorInfo : null
            ]);

            return redirect()->back()
                ->with('error', 'Hesab yaradılarkən xəta baş verdi: ' . $e->getMessage())
                ->withInput();
        }

        return redirect()->route('superadmin.accounts')->with('success', 'Yeni hesab və istifadəçi yaradıldı. İstifadəçi ilk dəfə daxil olduqda quraşdırma sehrbazını tamamlamalıdır.');
    }

    /**
     * Update account
     */
    public function updateAccount(Request $request, Account $account)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'email' => 'required|email|unique:accounts,email,' . $account->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'is_active' => 'required|boolean',
            'monthly_payment_amount' => 'nullable|numeric|min:0',
            'payment_start_date' => 'nullable|date',
        ]);

        // Update fillable fields
        $account->update([
            'company_name' => $validated['company_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
        ]);

        // Update guarded fields directly
        $account->is_active = $validated['is_active'];
        $account->monthly_payment_amount = $validated['monthly_payment_amount'];
        $account->payment_start_date = $validated['payment_start_date'];
        $account->save();

        return redirect()->back()->with('success', 'Hesab məlumatları yeniləndi.');
    }

    /**
     * Delete account with cascade deletion
     * Deletes all related data: users, products, sales, expenses, etc.
     * Files are automatically cleaned up by AccountObserver
     */
    public function deleteAccount(Account $account)
    {
        $companyName = $account->company_name;
        $accountId = $account->id;

        try {
            DB::beginTransaction();

            // Log the deletion attempt
            \Log::info("Starting cascade deletion for account", [
                'account_id' => $accountId,
                'company_name' => $companyName,
            ]);

            // Get counts before deletion for logging
            $stats = [
                'users' => $account->users()->count(),
                'products' => $account->products()->count(),
                'customers' => $account->customers()->count(),
                'suppliers' => $account->suppliers()->count(),
                'categories' => $account->categories()->count(),
                'branches' => $account->branches()->count(),
                'warehouses' => $account->warehouses()->count(),
            ];

            // Delete related data in correct order (respecting foreign keys)

            // 1. Delete sales and related records (depends on products, customers)
            \DB::table('sale_items')->whereIn('sale_id', function($query) use ($accountId) {
                $query->select('sale_id')->from('sales')->where('account_id', $accountId);
            })->delete();
            \DB::table('payments')->whereIn('sale_id', function($query) use ($accountId) {
                $query->select('sale_id')->from('sales')->where('account_id', $accountId);
            })->delete();
            \DB::table('sales')->where('account_id', $accountId)->delete();

            // 2. Delete purchases and related records (if tables exist)
            if (\Schema::hasTable('purchase_items') && \Schema::hasTable('purchases')) {
                \DB::table('purchase_items')->whereIn('purchase_id', function($query) use ($accountId) {
                    $query->select('purchase_id')->from('purchases')->where('account_id', $accountId);
                })->delete();
                \DB::table('purchases')->where('account_id', $accountId)->delete();
            }

            // 3. Delete product-related data
            \DB::table('product_photos')->where('account_id', $accountId)->delete();
            \DB::table('product_documents')->whereIn('product_id', function($query) use ($accountId) {
                $query->select('id')->from('products')->where('account_id', $accountId);
            })->delete();
            \DB::table('product_prices')->whereIn('product_id', function($query) use ($accountId) {
                $query->select('id')->from('products')->where('account_id', $accountId);
            })->delete();
            \DB::table('product_stock')->where('account_id', $accountId)->delete();
            \DB::table('stock_history')->whereIn('warehouse_id', function($query) use ($accountId) {
                $query->select('id')->from('warehouses')->where('account_id', $accountId);
            })->delete();
            \DB::table('product_variants')->whereIn('product_id', function($query) use ($accountId) {
                $query->select('id')->from('products')->where('account_id', $accountId);
            })->delete();

            // 4. Delete inventory-related data
            \DB::table('stock_movements')->where('account_id', $accountId)->delete();
            \DB::table('warehouse_transfers')->where('account_id', $accountId)->delete();
            \DB::table('goods_receipts')->where('account_id', $accountId)->delete();
            \DB::table('product_returns')->where('account_id', $accountId)->delete();
            \DB::table('min_max_alerts')->where('account_id', $accountId)->delete();

            // 5. Delete expenses
            \DB::table('expenses')->where('account_id', $accountId)->delete();

            // 6. Delete customer and supplier related data
            \DB::table('customer_credits')->where('account_id', $accountId)->delete();
            \DB::table('supplier_credits')->where('account_id', $accountId)->delete();
            if (\Schema::hasTable('supplier_payments')) {
                \DB::table('supplier_payments')->where('account_id', $accountId)->delete();
            }
            \DB::table('customer_items')->whereIn('customer_id', function($query) use ($accountId) {
                $query->select('id')->from('customers')->where('account_id', $accountId);
            })->delete();

            // 7. Delete rental system data
            if (\Schema::hasTable('rental_items')) {
                \DB::table('rental_items')->whereIn('rental_id', function($query) use ($accountId) {
                    $query->select('id')->from('rentals')->where('account_id', $accountId);
                })->delete();
            }
            if (\Schema::hasTable('rental_agreements')) {
                \DB::table('rental_agreements')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('rentals')) {
                \DB::table('rentals')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('rental_categories')) {
                \DB::table('rental_categories')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('rental_inventory')) {
                \DB::table('rental_inventory')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('rental_agreement_templates')) {
                \DB::table('rental_agreement_templates')->where('account_id', $accountId)->delete();
            }

            // 8. Delete tailor services
            if (\Schema::hasTable('tailor_service_items')) {
                \DB::table('tailor_service_items')->whereIn('tailor_service_id', function($query) use ($accountId) {
                    $query->select('id')->from('tailor_services')->where('account_id', $accountId);
                })->delete();
            }
            \DB::table('tailor_services')->where('account_id', $accountId)->delete();

            // 9. Delete loyalty points and programs
            if (\Schema::hasTable('customer_points')) {
                \DB::table('customer_points')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('loyalty_programs')) {
                \DB::table('loyalty_programs')->where('account_id', $accountId)->delete();
            }

            // 10. Delete products (after all dependencies)
            \DB::table('products')->where('account_id', $accountId)->delete();

            // 11. Delete customers and suppliers
            \DB::table('customers')->where('account_id', $accountId)->delete();
            \DB::table('suppliers')->where('account_id', $accountId)->delete();

            // 12. Delete categories
            if (\Schema::hasTable('expense_categories')) {
                \DB::table('expense_categories')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('categories')) {
                \DB::table('categories')->where('account_id', $accountId)->delete();
            }

            // 13. Delete organizational structure
            if (\Schema::hasTable('warehouses')) {
                \DB::table('warehouses')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('branches')) {
                \DB::table('branches')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('companies')) {
                \DB::table('companies')->where('account_id', $accountId)->delete();
            }

            // 14. Delete notification and SMS credentials
            if (\Schema::hasTable('sms_credentials')) {
                \DB::table('sms_credentials')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('telegram_credentials')) {
                \DB::table('telegram_credentials')->where('account_id', $accountId)->delete();
            }

            // 15. Delete printer configs
            if (\Schema::hasTable('printer_configs')) {
                \DB::table('printer_configs')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('fiscal_printer_configs')) {
                \DB::table('fiscal_printer_configs')->where('account_id', $accountId)->delete();
            }

            // 16. Delete audit logs
            if (\Schema::hasTable('audit_logs')) {
                \DB::table('audit_logs')->where('account_id', $accountId)->delete();
            }

            // 17. Delete subscriptions
            if (\Schema::hasTable('subscriptions')) {
                \DB::table('subscriptions')->where('account_id', $accountId)->delete();
            }

            // 18. Delete ALL users belonging to this account (after all dependencies)
            // Note: We delete all users including super_admin IF they belong to this account
            // System-wide super_admins should not have account_id set to regular accounts
            \DB::table('users')
                ->where('account_id', $accountId)
                ->delete();

            // 19. Finally, delete the account
            // This triggers AccountObserver::deleting() which cleans up files from blob storage
            $account->delete();

            DB::commit();

            // Log successful deletion
            \Log::info("Account cascade deletion completed successfully", [
                'account_id' => $accountId,
                'company_name' => $companyName,
                'deleted_stats' => $stats,
            ]);

            return redirect()->route('superadmin.accounts')->with('success',
                "Hesab '{$companyName}' və bütün məlumatları tamamilə silindi. " .
                "({$stats['users']} istifadəçi, {$stats['products']} məhsul, və s.)"
            );

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error("Account deletion failed", [
                'account_id' => $accountId,
                'company_name' => $companyName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error',
                "Hesab silinərkən xəta baş verdi: " . $e->getMessage()
            );
        }
    }

    /**
     * Delete user
     */
    public function deleteUser(User $user)
    {
        // Don't allow deleting super admin users
        if ($user->role === 'super_admin') {
            return redirect()->back()->with('error', 'Super admin istifadəçisini silmək olmaz.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'İstifadəçi silindi.');
    }

    /**
     * Toggle user status
     */
    public function toggleUserStatus(User $user)
    {
        // Don't allow deactivating super admin users
        if ($user->role === 'super_admin') {
            return redirect()->back()->with('error', 'Super admin istifadəçisinin statusunu dəyişmək olmaz.');
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';

        $user->update(['status' => $newStatus]);

        return redirect()->back()->with('success',
            $newStatus === 'active'
                ? 'İstifadəçi aktivləşdirildi.'
                : 'İstifadəçi deaktivləşdirildi.'
        );
    }

    /**
     * Clear all account data (reset to fresh state)
     * Keeps: Account, Users, Companies, Branches, Warehouses, Categories
     * Deletes: All transactional data (sales, products, customers, inventory, etc.)
     */
    public function clearAccountData(Account $account)
    {
        $companyName = $account->company_name;
        $accountId = $account->id;

        try {
            DB::beginTransaction();

            // Log the data clearing attempt
            \Log::info("Starting data clearing for account", [
                'account_id' => $accountId,
                'company_name' => $companyName,
            ]);

            // Get counts before clearing for logging
            $stats = [
                'sales' => \DB::table('sales')->where('account_id', $accountId)->count(),
                'products' => \DB::table('products')->where('account_id', $accountId)->count(),
                'customers' => \DB::table('customers')->where('account_id', $accountId)->count(),
                'suppliers' => \DB::table('suppliers')->where('account_id', $accountId)->count(),
                'expenses' => \DB::table('expenses')->where('account_id', $accountId)->count(),
            ];

            // 1. Delete all sales and related records
            \DB::table('sale_items')->whereIn('sale_id', function($query) use ($accountId) {
                $query->select('sale_id')->from('sales')->where('account_id', $accountId);
            })->delete();
            \DB::table('payments')->whereIn('sale_id', function($query) use ($accountId) {
                $query->select('sale_id')->from('sales')->where('account_id', $accountId);
            })->delete();
            \DB::table('sales')->where('account_id', $accountId)->delete();

            // 2. Delete purchases and related records (if tables exist)
            if (\Schema::hasTable('purchase_items') && \Schema::hasTable('purchases')) {
                \DB::table('purchase_items')->whereIn('purchase_id', function($query) use ($accountId) {
                    $query->select('id')->from('purchases')->where('account_id', $accountId);
                })->delete();
                \DB::table('purchases')->where('account_id', $accountId)->delete();
            }

            // 3. Delete goods receipts
            if (\Schema::hasTable('goods_receipt_items')) {
                \DB::table('goods_receipt_items')->where('account_id', $accountId)->delete();
            }
            \DB::table('goods_receipts')->where('account_id', $accountId)->delete();

            // 4. Delete product returns
            if (\Schema::hasTable('product_return_items')) {
                \DB::table('product_return_items')->where('account_id', $accountId)->delete();
            }
            \DB::table('product_returns')->where('account_id', $accountId)->delete();

            // 5. Delete all inventory-related data
            \DB::table('stock_movements')->where('account_id', $accountId)->delete();
            \DB::table('warehouse_transfers')->where('account_id', $accountId)->delete();
            \DB::table('min_max_alerts')->where('account_id', $accountId)->delete();
            if (\Schema::hasTable('stock_history')) {
                \DB::table('stock_history')->whereIn('warehouse_id', function($query) use ($accountId) {
                    $query->select('id')->from('warehouses')->where('account_id', $accountId);
                })->delete();
            }

            // 6. Delete all expenses
            \DB::table('expenses')->where('account_id', $accountId)->delete();

            // 7. Delete tailor services and customer items
            if (\Schema::hasTable('tailor_service_items')) {
                \DB::table('tailor_service_items')->where('account_id', $accountId)->delete();
            }
            \DB::table('tailor_services')->where('account_id', $accountId)->delete();
            \DB::table('customer_items')->whereIn('customer_id', function($query) use ($accountId) {
                $query->select('id')->from('customers')->where('account_id', $accountId);
            })->delete();

            // 8. Delete rental system data
            if (\Schema::hasTable('rental_items')) {
                \DB::table('rental_items')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('rental_agreements')) {
                \DB::table('rental_agreements')->where('account_id', $accountId)->delete();
            }
            \DB::table('rentals')->where('account_id', $accountId)->delete();
            \DB::table('rental_categories')->where('account_id', $accountId)->delete();
            \DB::table('rental_inventory')->where('account_id', $accountId)->delete();
            \DB::table('rental_agreement_templates')->where('account_id', $accountId)->delete();

            // 9. Delete loyalty and gift card transactions
            if (\Schema::hasTable('customer_points')) {
                \DB::table('customer_points')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('gift_card_transactions')) {
                \DB::table('gift_card_transactions')->whereIn('gift_card_id', function($query) use ($accountId) {
                    $query->select('id')->from('gift_cards')->where('account_id', $accountId);
                })->delete();
            }
            // Unassign loyalty cards (reset to free/unused state)
            \DB::table('loyalty_cards')->where('account_id', $accountId)->update([
                'customer_id' => null,
                'assigned_at' => null,
                'status' => 'free'
            ]);
            // Deactivate gift cards
            \DB::table('gift_cards')->where('account_id', $accountId)->update([
                'status' => 'inactive',
                'current_balance' => 0,
                'initial_balance' => 0
            ]);

            // 10. Delete customer credits and supplier credits
            \DB::table('customer_credits')->where('account_id', $accountId)->delete();
            \DB::table('supplier_credits')->where('account_id', $accountId)->delete();
            if (\Schema::hasTable('supplier_payments')) {
                \DB::table('supplier_payments')->where('account_id', $accountId)->delete();
            }

            // 11. Delete all product-related data
            \DB::table('product_photos')->where('account_id', $accountId)->delete();
            \DB::table('product_documents')->whereIn('product_id', function($query) use ($accountId) {
                $query->select('id')->from('products')->where('account_id', $accountId);
            })->delete();
            \DB::table('product_prices')->whereIn('product_id', function($query) use ($accountId) {
                $query->select('id')->from('products')->where('account_id', $accountId);
            })->delete();
            \DB::table('product_stock')->where('account_id', $accountId)->delete();
            \DB::table('product_variants')->whereIn('product_id', function($query) use ($accountId) {
                $query->select('id')->from('products')->where('account_id', $accountId);
            })->delete();
            \DB::table('products')->where('account_id', $accountId)->delete();

            // 12. Delete all customers and suppliers
            \DB::table('customers')->where('account_id', $accountId)->delete();
            \DB::table('suppliers')->where('account_id', $accountId)->delete();

            // 13. Delete daily summaries and reports
            if (\Schema::hasTable('daily_summaries')) {
                \DB::table('daily_summaries')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('generated_reports')) {
                \DB::table('generated_reports')->where('account_id', $accountId)->delete();
            }

            // 14. Delete SMS and Telegram logs (keep credentials)
            if (\Schema::hasTable('sms_logs')) {
                \DB::table('sms_logs')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('telegram_logs')) {
                \DB::table('telegram_logs')->where('account_id', $accountId)->delete();
            }

            // 15. Delete fiscal printer logs and jobs (keep configs)
            if (\Schema::hasTable('fiscal_printer_jobs')) {
                \DB::table('fiscal_printer_jobs')->where('account_id', $accountId)->delete();
            }
            if (\Schema::hasTable('fiscal_printer_logs')) {
                \DB::table('fiscal_printer_logs')->where('account_id', $accountId)->delete();
            }

            // 16. Delete kiosk sync logs (keep device tokens)
            if (\Schema::hasTable('kiosk_sync_logs')) {
                \DB::table('kiosk_sync_logs')->where('account_id', $accountId)->delete();
            }

            // 17. Delete audit logs
            \DB::table('audit_logs')->where('account_id', $accountId)->delete();

            // 18. Delete import jobs
            if (\Schema::hasTable('import_jobs')) {
                \DB::table('import_jobs')->where('account_id', $accountId)->delete();
            }

            // 19. Reset barcode sequences
            if (\Schema::hasTable('barcode_sequences')) {
                \DB::table('barcode_sequences')->where('account_id', $accountId)->delete();
            }

            // 20. Delete async jobs
            if (\Schema::hasTable('async_jobs')) {
                \DB::table('async_jobs')->where('account_id', $accountId)->delete();
            }

            DB::commit();

            // Log successful data clearing
            \Log::info("Account data clearing completed successfully", [
                'account_id' => $accountId,
                'company_name' => $companyName,
                'cleared_stats' => $stats,
            ]);

            return redirect()->back()->with('success',
                "Hesab '{$companyName}' üçün bütün məlumatlar təmizləndi. " .
                "Hesab, istifadəçilər və əsas konfiqurasiya saxlanıldı. " .
                "Silinən: {$stats['sales']} satış, {$stats['products']} məhsul, " .
                "{$stats['customers']} müştəri, {$stats['suppliers']} təchizatçı, {$stats['expenses']} xərc."
            );

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error("Account data clearing failed", [
                'account_id' => $accountId,
                'company_name' => $companyName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error',
                "Hesab məlumatları təmizlənərkən xəta baş verdi: " . $e->getMessage()
            );
        }
    }

    /**
     * Storage settings management
     */
    public function storageSettings()
    {
        $currentSettings = [
            // Storage Driver Selection
            'storage_driver' => StorageSetting::getStorageDriver(),

            // Azure Settings
            'azure_connection_string' => StorageSetting::getAzureConnectionString(),
            'azure_container' => StorageSetting::getAzureContainer(),

            // S3/S3-Compatible Settings
            's3_access_key' => StorageSetting::getS3AccessKey(),
            's3_secret_key' => StorageSetting::getS3SecretKey(),
            's3_bucket' => StorageSetting::getS3Bucket(),
            's3_region' => StorageSetting::getS3Region(),
            's3_endpoint' => StorageSetting::getS3Endpoint(),
            's3_use_path_style_endpoint' => StorageSetting::getS3UsePathStyleEndpoint(),
            's3_url' => StorageSetting::getS3Url(),
        ];

        return Inertia::render('SuperAdmin/StorageSettings', [
            'currentSettings' => $currentSettings,
        ]);
    }

    /**
     * Update storage settings
     */
    public function updateStorageSettings(Request $request)
    {
        $rules = [
            'storage_driver' => 'required|in:local,azure,s3,s3-compatible',
        ];

        // Add conditional validation based on driver
        if ($request->storage_driver === 'azure') {
            $rules['azure_connection_string'] = 'required|string';
            $rules['azure_container'] = 'required|string';
        } elseif (in_array($request->storage_driver, ['s3', 's3-compatible'])) {
            $rules['s3_access_key'] = 'required|string';
            $rules['s3_secret_key'] = 'required|string';
            $rules['s3_bucket'] = 'required|string';
            $rules['s3_region'] = 'required|string';

            if ($request->storage_driver === 's3-compatible') {
                $rules['s3_endpoint'] = 'required|url';
                $rules['s3_use_path_style_endpoint'] = 'nullable|boolean';
            }

            $rules['s3_url'] = 'nullable|url';
        }

        $validated = $request->validate($rules);

        try {
            // Save storage driver selection
            StorageSetting::set('storage_driver', $validated['storage_driver'], false);

            // Save Azure settings if selected
            if ($validated['storage_driver'] === 'azure') {
                StorageSetting::set('azure_connection_string', $validated['azure_connection_string'], true);
                StorageSetting::set('azure_container', $validated['azure_container'], false);
            }

            // Save S3 settings if selected
            if (in_array($validated['storage_driver'], ['s3', 's3-compatible'])) {
                StorageSetting::set('s3_access_key', $validated['s3_access_key'], true);
                StorageSetting::set('s3_secret_key', $validated['s3_secret_key'], true);
                StorageSetting::set('s3_bucket', $validated['s3_bucket'], false);
                StorageSetting::set('s3_region', $validated['s3_region'], false);

                if ($validated['storage_driver'] === 's3-compatible') {
                    StorageSetting::set('s3_endpoint', $validated['s3_endpoint'] ?? '', false);
                    StorageSetting::set('s3_use_path_style_endpoint',
                        ($validated['s3_use_path_style_endpoint'] ?? false) ? 'true' : 'false', false);
                }

                StorageSetting::set('s3_url', $validated['s3_url'] ?? '', false);
            }

            // Clear any cached filesystem instances to force reload
            app()->forgetInstance('filesystem');

            $driverNames = [
                'local' => 'Lokal yaddaş',
                'azure' => 'Azure Blob Storage',
                's3' => 'AWS S3',
                's3-compatible' => 'S3-uyğun xidmət (Backblaze və s.)',
            ];

            $driverName = $driverNames[$validated['storage_driver']] ?? 'Yaddaş';

            return redirect()->back()->with('success', "{$driverName} parametrləri yeniləndi.");

        } catch (\Exception $e) {
            \Log::error('Storage settings update failed: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Yaddaş parametrləri yenilənərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Test storage connection
     */
    public function testStorageConnection(Request $request)
    {
        $validated = $request->validate([
            'storage_driver' => 'required|in:local,azure,s3,s3-compatible',
            'azure_connection_string' => 'nullable|string',
            'azure_container' => 'nullable|string',
            's3_access_key' => 'nullable|string',
            's3_secret_key' => 'nullable|string',
            's3_bucket' => 'nullable|string',
            's3_region' => 'nullable|string',
            's3_endpoint' => 'nullable|url',
            's3_use_path_style_endpoint' => 'nullable|boolean',
        ]);

        try {
            $driver = $validated['storage_driver'];

            switch ($driver) {
                case 'azure':
                    return $this->testAzureConnection($validated);

                case 's3':
                case 's3-compatible':
                    return $this->testS3Connection($validated, $driver);

                case 'local':
                    return response()->json([
                        'success' => true,
                        'message' => 'Lokal yaddaş həmişə əlçatandır!'
                    ]);

                default:
                    throw new \Exception('Naməlum yaddaş növü');
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bağlantı xətası: ' . $e->getMessage()
            ], 400);
        }
    }

    private function testAzureConnection(array $validated)
    {
        if (empty($validated['azure_connection_string'])) {
            throw new \Exception('Azure bağlantı sətri tələb olunur');
        }

        if (empty($validated['azure_container'])) {
            throw new \Exception('Azure konteyner adı tələb olunur');
        }

        // Parse connection string to validate format
        $requiredParts = ['DefaultEndpointsProtocol', 'AccountName', 'AccountKey'];

        foreach ($requiredParts as $part) {
            if (!str_contains($validated['azure_connection_string'], $part)) {
                throw new \Exception("Azure bağlantı sətrində {$part} tapılmadı");
            }
        }

        // Try to create a test disk configuration and test connection
        $config = [
            'driver' => 'azure',
            'connection_string' => $validated['azure_connection_string'],
            'container' => $validated['azure_container'],
        ];

        Config::set('filesystems.disks.test_storage', $config);
        $disk = \Storage::disk('test_storage');

        // Try to list files (this will test the connection)
        $disk->files();

        return response()->json([
            'success' => true,
            'message' => 'Azure Blob Storage bağlantısı uğurla test edildi!'
        ]);
    }

    private function testS3Connection(array $validated, string $driver)
    {
        if (empty($validated['s3_access_key'])) {
            throw new \Exception('S3 Access Key tələb olunur');
        }

        if (empty($validated['s3_secret_key'])) {
            throw new \Exception('S3 Secret Key tələb olunur');
        }

        if (empty($validated['s3_bucket'])) {
            throw new \Exception('S3 Bucket adı tələb olunur');
        }

        if (empty($validated['s3_region'])) {
            throw new \Exception('S3 Region tələb olunur');
        }

        $config = [
            'driver' => 's3',
            'key' => $validated['s3_access_key'],
            'secret' => $validated['s3_secret_key'],
            'region' => $validated['s3_region'],
            'bucket' => $validated['s3_bucket'],
            'throw' => false,
        ];

        // Add endpoint for S3-compatible services
        if ($driver === 's3-compatible') {
            if (empty($validated['s3_endpoint'])) {
                throw new \Exception('S3-uyğun xidmətlər üçün endpoint tələb olunur');
            }
            $config['endpoint'] = $validated['s3_endpoint'];
            $config['use_path_style_endpoint'] = $validated['s3_use_path_style_endpoint'] ?? true;
        }

        Config::set('filesystems.disks.test_storage', $config);
        $disk = \Storage::disk('test_storage');

        // Try to list files (this will test the connection)
        $disk->files();

        $serviceName = $driver === 's3' ? 'AWS S3' : 'S3-uyğun xidmət';

        return response()->json([
            'success' => true,
            'message' => "{$serviceName} bağlantısı uğurla test edildi!"
        ]);
    }
}