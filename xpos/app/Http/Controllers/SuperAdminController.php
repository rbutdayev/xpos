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
        
        $accounts = Account::query()
            ->when($search, function ($query, $search) {
                $query->where('company_name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
            })
            ->when($plan, function ($query, $plan) {
                $query->where('subscription_plan', $plan);
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
        
        $account->update(['is_active' => $newStatus]);

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
                'company_name' => 'required|string|max:255',
                'email' => 'required|email|unique:accounts,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'subscription_plan' => 'required|in:başlanğıc,professional,enterprise',
                'is_active' => 'boolean',
                // User creation fields
                'user_name' => 'required|string|max:255',
                'user_email' => 'required|email|unique:users,email',
                'user_password' => 'required|string|min:8',
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
                // Create account with explicit defaults
                $account = Account::create([
                    'company_name' => $validated['company_name'],
                    'email' => $validated['email'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'subscription_plan' => $validated['subscription_plan'],
                    'is_active' => $validated['is_active'] ?? true,
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

                // Create initial user as account owner (no branch_id - user will set up during onboarding)
                $user = User::create([
                    'account_id' => $account->id,
                    'name' => $validated['user_name'],
                    'email' => $validated['user_email'],
                    'password' => bcrypt($validated['user_password']),
                    'role' => 'account_owner',
                    'status' => 'active',
                    'position' => 'Administrator',
                    'hire_date' => now(),
                    'branch_id' => null, // Will be set during onboarding wizard
                    'permissions' => [
                        'manage_users' => true,
                        'manage_products' => true,
                        'manage_sales' => true,
                        'manage_inventory' => true,
                        'manage_reports' => true,
                        'manage_settings' => true,
                    ],
                ]);

                if (!$user || !$user->id) {
                    throw new \Exception('User creation failed - no ID returned');
                }

                \Log::info('Account and user created successfully', [
                    'account_id' => $account->id,
                    'user_id' => $user->id,
                    'company_name' => $validated['company_name']
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

        return redirect()->route('superadmin.accounts')->with('success', 'Yeni hesab və istifadəçi yaradıldı.');
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
        ]);

        $account->update($validated);

        return redirect()->back()->with('success', 'Hesab məlumatları yeniləndi.');
    }

    /**
     * Delete account
     */
    public function deleteAccount(Account $account)
    {
        // Check if account has users
        if ($account->users()->count() > 0) {
            return redirect()->back()->with('error', 'Bu hesabda istifadəçilər var. Əvvəlcə onları silin.');
        }

        $account->delete();

        return redirect()->route('superadmin.accounts')->with('success', 'Hesab silindi.');
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
     * Storage settings management
     */
    public function storageSettings()
    {
        $currentSettings = [
            // Azure Settings Only
            'azure_connection_string' => StorageSetting::getAzureConnectionString(),
            'azure_container' => StorageSetting::getAzureContainer(),
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
        $validated = $request->validate([
            // Azure Settings Only
            'azure_connection_string' => 'required|string',
            'azure_container' => 'required|string',
        ]);

        try {
            // Save Azure settings to database (encrypted)
            StorageSetting::set('azure_connection_string', $validated['azure_connection_string'], true);
            StorageSetting::set('azure_container', $validated['azure_container'], false);
            
            // Clear any cached filesystem instances to force reload
            app()->forgetInstance('filesystem');
            
            return redirect()->back()->with('success', 'Azure Blob Storage parametrləri yeniləndi.');
            
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
            'azure_connection_string' => 'required|string',
            'azure_container' => 'required|string',
        ]);

        try {
            // Test Azure connection - basic validation
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
            
            Config::set('filesystems.disks.test_azure', $config);
            $disk = \Storage::disk('test_azure');
            
            // Try to list files (this will test the connection)
            $disk->files();
            
            return response()->json([
                'success' => true,
                'message' => 'Azure Blob Storage bağlantısı uğurla test edildi!'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Azure bağlantı xətası: ' . $e->getMessage()
            ], 400);
        }
    }
}