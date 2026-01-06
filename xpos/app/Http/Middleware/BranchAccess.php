<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class BranchAccess
{
    /**
     * Handle an incoming request for branch-based access control
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Define roles that require branch assignment and should have branch-level access
        $branchRestrictedRoles = ['sales_staff', 'branch_manager', 'cashier', 'tailor'];

        // If user has a branch-restricted role, ensure they have branch_id
        if (in_array($user->role, $branchRestrictedRoles)) {
            if (!$user->branch_id) {
                $roleNames = [
                    'sales_staff' => 'Satış işçisi',
                    'branch_manager' => 'Filial müdiri',
                    'cashier' => 'Kassir',
                    'tailor' => 'Dərzi'
                ];
                $roleName = $roleNames[$user->role] ?? $user->role;
                abort(403, "{$roleName} üçün filial təyin edilməyib.");
            }

            // Store branch context in session for queries
            // Different session keys for different roles to allow more granular control if needed
            session([
                'user_branch_id' => $user->branch_id,
                'user_role' => $user->role
            ]);
        }

        // For other roles (account_owner, admin, warehouse_manager, accountant), no branch restriction
        // They can access all branches
        return $next($request);
    }
}