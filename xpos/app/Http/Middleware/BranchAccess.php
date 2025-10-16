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

        // If user is sales_staff, ensure they have branch_id and can only access their branch data
        if ($user->role === 'sales_staff') {
            if (!$user->branch_id) {
                abort(403, 'Satış əməkdaşı filialı təyin edilməyib.');
            }
            
            // Store branch context in session for queries
            session(['sales_staff_branch_id' => $user->branch_id]);
        }

        // For other roles (admin, manager, etc.), no branch restriction needed
        return $next($request);
    }
}