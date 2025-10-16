<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleBasedAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$allowedRoles): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Account owner has access to everything
        if ($user->role === 'account_owner') {
            return $next($request);
        }

        // Check if user's role is in the allowed roles
        if (!in_array($user->role, $allowedRoles)) {
            abort(403, 'Bu səhifəyə giriş icazəniz yoxdur.');
        }

        return $next($request);
    }

    /**
     * Define role permissions for different modules
     */
    public static function getModulePermissions(): array
    {
        return [
            // Dashboard - everyone can access
            'dashboard' => ['account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor'],

            // Inventory Management
            'products' => ['account_owner', 'admin', 'warehouse_manager', 'accountant'],
            'categories' => ['account_owner', 'admin', 'warehouse_manager'],
            'suppliers' => ['account_owner', 'admin', 'warehouse_manager', 'accountant'],
            'warehouses' => ['account_owner', 'admin', 'warehouse_manager'],

            // Customer Services
            'customers' => ['account_owner', 'admin', 'branch_manager', 'sales_staff', 'tailor'],
            'customer-items' => ['account_owner', 'admin', 'branch_manager', 'sales_staff', 'tailor'],
            'tailor-services' => ['account_owner', 'admin', 'branch_manager', 'sales_staff', 'tailor'],
            
            // Human Resources
            'employees' => ['account_owner', 'admin', 'branch_manager'],
            'users' => ['account_owner', 'admin'], // Only admin and owner can manage users
            
            // Stock Management
            'stock-movements' => ['account_owner', 'admin', 'warehouse_manager', 'accountant'],
            'warehouse-transfers' => ['account_owner', 'admin', 'warehouse_manager'],
            'product-returns' => ['account_owner', 'admin', 'warehouse_manager'],
            'alerts' => ['account_owner', 'admin', 'warehouse_manager'],
            
            // Sales & POS
            'sales' => ['account_owner', 'admin', 'branch_manager', 'sales_staff', 'cashier', 'accountant', 'salesman'],
            
            // Finance
            'expenses' => ['account_owner', 'admin', 'accountant'],
            'expense-categories' => ['account_owner', 'admin', 'accountant'],
            'employee-salaries' => ['account_owner', 'admin', 'accountant'],
            'supplier-payments' => ['account_owner', 'admin', 'accountant'],
            
            // Reports
            'reports' => ['account_owner', 'admin', 'branch_manager', 'accountant'],
            
            // System Settings
            'companies' => ['account_owner'], // Only account owner
            'branches' => ['account_owner', 'admin'],
            'printer-configs' => ['account_owner', 'admin', 'branch_manager'],
            'receipt-templates' => ['account_owner', 'admin', 'branch_manager'],
            'settings' => ['account_owner', 'admin'],
            'audit-logs' => ['account_owner', 'admin'],
        ];
    }

    /**
     * Check if user has access to a specific module
     */
    public static function hasModuleAccess(string $module, string $userRole): bool
    {
        $permissions = self::getModulePermissions();
        
        if (!isset($permissions[$module])) {
            return false;
        }
        
        return in_array($userRole, $permissions[$module]);
    }
}