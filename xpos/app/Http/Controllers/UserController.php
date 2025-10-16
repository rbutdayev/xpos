<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');
        
        // Only account_owner and admin can manage users
        if (!Auth::user()->hasRole(['account_owner', 'admin'])) {
            abort(403, 'Unauthorized access');
        }

        $request->validate([
            'search' => 'nullable|string|max:255',
            'role' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:active,inactive',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);

        $validated = $request->only(['search', 'role', 'status', 'per_page']);
        $query = User::where('account_id', Auth::user()->account_id);

        // Search
        if ($request->filled('search')) {
            $search = $validated['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $validated['role']);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $validated['status']);
        }

        $users = $query->orderBy('name')
            ->paginate($validated['per_page'] ?? 25)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status']),
            'roleOptions' => $this->getRoleOptions(),
        ]);
    }

    public function create()
    {
        Gate::authorize('create-account-data');
        
        if (!Auth::user()->hasRole(['account_owner', 'admin'])) {
            abort(403);
        }

        $branches = \App\Models\Branch::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Users/Create', [
            'roleOptions' => $this->getRoleOptions(),
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create-account-data');
        
        if (!Auth::user()->hasRole(['account_owner', 'admin'])) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,branch_manager,warehouse_manager,sales_staff,cashier,accountant,tailor',
            'password' => 'required|string|min:8|confirmed',
            'status' => 'required|in:active,inactive',
            'position' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'hourly_rate' => 'nullable|numeric|min:0',
            'branch_id' => 'nullable|exists:branches,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['account_id'] = Auth::user()->account_id;

        User::create($validated);

        return redirect()->route('users.index')
            ->with('success', 'İstifadəçi uğurla yaradıldı.');
    }

    public function show(User $user)
    {
        Gate::authorize('access-account-data');
        
        if (!Auth::user()->hasRole(['account_owner', 'admin'])) {
            abort(403);
        }

        // Ensure user belongs to same account
        if ($user->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        return Inertia::render('Users/Show', [
            'user' => $user,
            'roleText' => $this->getRoleText($user->role),
        ]);
    }

    public function edit(User $user)
    {
        Gate::authorize('edit-account-data');
        
        if (!Auth::user()->hasRole(['account_owner', 'admin'])) {
            abort(403);
        }

        if ($user->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        $branches = \App\Models\Branch::where('account_id', Auth::user()->account_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roleOptions' => $this->getRoleOptions(),
            'branches' => $branches,
        ]);
    }

    public function update(Request $request, User $user)
    {
        Gate::authorize('edit-account-data');

        if (!Auth::user()->hasRole(['account_owner', 'admin'])) {
            abort(403);
        }

        if ($user->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Prevent changing the role of account_owner
        if ($user->role === 'account_owner') {
            return back()->withErrors([
                'role' => 'Hesab sahibinin rolunu dəyişdirmək mümkün deyil. Hesab sahibi həmişə "account_owner" rolunda qalmalıdır.'
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,branch_manager,warehouse_manager,sales_staff,cashier,accountant,tailor',
            'status' => 'required|in:active,inactive',
            'password' => 'nullable|string|min:8|confirmed',
            'position' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'hourly_rate' => 'nullable|numeric|min:0',
            'branch_id' => 'nullable|exists:branches,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('users.show', $user)
            ->with('success', 'İstifadəçi məlumatları yeniləndi.');
    }

    public function destroy(User $user)
    {
        Gate::authorize('delete-account-data');
        
        if (!Auth::user()->hasRole(['account_owner', 'admin'])) {
            abort(403);
        }

        if ($user->account_id !== Auth::user()->account_id) {
            abort(403);
        }

        // Prevent deleting yourself
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'Öz hesabınızı silə bilməzsiniz.']);
        }

        // Prevent deleting account owner
        if ($user->role === 'account_owner') {
            return back()->withErrors(['error' => 'Hesab sahibini silə bilməzsiniz.']);
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'İstifadəçi silindi.');
    }

    private function getRoleOptions(): array
    {
        return [
            ['value' => 'admin', 'label' => 'Administrator'],
            ['value' => 'branch_manager', 'label' => 'Filial müdiri'],
            ['value' => 'warehouse_manager', 'label' => 'Anbar müdiri'],
            ['value' => 'sales_staff', 'label' => 'Satış işçisi'],
            ['value' => 'cashier', 'label' => 'Kassir'],
            ['value' => 'accountant', 'label' => 'Mühasib'],
            ['value' => 'tailor', 'label' => 'Dərzi'],
        ];
    }

    private function getRoleText(string $role): string
    {
        $roles = [
            'account_owner' => 'Hesab sahibi',
            'admin' => 'Administrator',
            'branch_manager' => 'Filial müdiri',
            'warehouse_manager' => 'Anbar müdiri',
            'sales_staff' => 'Satış işçisi',
            'cashier' => 'Kassir',
            'accountant' => 'Mühasib',
            'tailor' => 'Dərzi',
        ];

        return $roles[$role] ?? $role;
    }
}