<?php

namespace App\Http\Controllers;

use App\Models\EmployeeSalary;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class EmployeeSalaryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('access-account-data');

        $query = EmployeeSalary::with(['employee']);

        if ($request->filled('search')) {
            $request->validate(['search' => 'required|string|max:255']);
            $validated = $request->validated();
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('employee', function ($subQ) use ($searchTerm) {
                    $subQ->where('name', 'like', '%' . $searchTerm . '%');
                });
            });
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        $salaries = $query->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate(15);

        $employees = User::select('id as employee_id', 'name')->where('account_id', Auth::user()->account_id)->orderBy('name')->get();

        // Transform data to match frontend expectations
        $transformedSalaries = $salaries->toArray();
        $transformedSalaries['data'] = collect($salaries->items())->map(function ($salary) {
            return [
                'id' => $salary->salary_id,
                'employee_name' => $salary->employee->name,
                'employee_id' => $salary->employee_id,
                'salary_month' => $salary->year . '-' . str_pad($salary->month, 2, '0', STR_PAD_LEFT),
                'base_salary' => $salary->amount,
                'bonuses' => $salary->bonus_amount,
                'deductions' => $salary->deduction_amount,
                'net_salary' => $salary->total_amount,
                'paid' => $salary->status === 'ödənilib',
                'paid_date' => $salary->payment_date?->format('Y-m-d'),
                'created_at' => $salary->created_at->format('Y-m-d H:i:s'),
            ];
        })->toArray();

        return Inertia::render('EmployeeSalaries/Index', [
            'employee_salaries' => $transformedSalaries,
            'employees' => $employees,
            'filters' => $request->only(['search', 'employee_id', 'status', 'year', 'month']),
            'statuses' => EmployeeSalary::getStatuses(),
            'months' => EmployeeSalary::getMonths(),
            'years' => range(date('Y'), date('Y') - 5),
        ]);
    }

    public function create()
    {
        Gate::authorize('access-account-data');

        $employees = User::select('id as employee_id', 'name', 'hourly_rate as base_salary')
            ->where('account_id', Auth::user()->account_id)
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                $nameParts = explode(' ', $user->name, 2);
                return [
                    'employee_id' => $user->employee_id,
                    'first_name' => $nameParts[0] ?? '',
                    'last_name' => $nameParts[1] ?? '',
                    'base_salary' => $user->base_salary,
                ];
            });

        return Inertia::render('EmployeeSalaries/Create', [
            'employees' => $employees,
            'statuses' => EmployeeSalary::getStatuses(),
            'months' => EmployeeSalary::getMonths(),
            'currentYear' => date('Y'),
            'currentMonth' => date('n'),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:' . (date('Y') + 1),
            'status' => 'required|in:hazırlanıb,ödənilib,gecikib',
            'payment_date' => 'nullable|date',
            'bonus_amount' => 'nullable|numeric|min:0',
            'deduction_amount' => 'nullable|numeric|min:0',
            'bonus_reason' => 'nullable|string|max:500',
            'deduction_reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check for duplicate salary record
        $exists = EmployeeSalary::where('account_id', Auth::user()->account_id)
            ->where('employee_id', $validated['employee_id'])
            ->where('month', $validated['month'])
            ->where('year', $validated['year'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['employee_id' => __('app.salary_already_exists_for_period')]);
        }

        $validated['account_id'] = Auth::user()->account_id;
        $validated['bonus_amount'] = $validated['bonus_amount'] ?? 0;
        $validated['deduction_amount'] = $validated['deduction_amount'] ?? 0;

        EmployeeSalary::create($validated);

        return redirect()->route('employee-salaries.index')
            ->with('success', __('app.employee_salary_created'));
    }

    public function show(EmployeeSalary $employeeSalary)
    {
        Gate::authorize('access-account-data');

        $employeeSalary->load(['employee']);

        // Transform data to match frontend expectations
        $transformedSalary = [
            'id' => $employeeSalary->salary_id,
            'salary_month' => $employeeSalary->year . '-' . str_pad($employeeSalary->month, 2, '0', STR_PAD_LEFT),
            'base_salary' => $employeeSalary->amount,
            'bonuses' => $employeeSalary->bonus_amount,
            'deductions' => $employeeSalary->deduction_amount,
            'net_salary' => $employeeSalary->total_amount,
            'paid' => $employeeSalary->status === 'ödənilib',
            'paid_date' => $employeeSalary->payment_date?->format('Y-m-d'),
            'notes' => $employeeSalary->notes,
            'created_at' => $employeeSalary->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $employeeSalary->updated_at->format('Y-m-d H:i:s'),
            'employee' => [
                'id' => $employeeSalary->employee->id,
                'name' => $employeeSalary->employee->name,
                'hourly_rate' => $employeeSalary->employee->hourly_rate ?? 0,
            ]
        ];

        return Inertia::render('EmployeeSalaries/Show', [
            'employee_salary' => $transformedSalary,
        ]);
    }

    public function edit(EmployeeSalary $employeeSalary)
    {
        Gate::authorize('access-account-data');

        $employeeSalary->load(['employee']);
        $employees = User::select('id as employee_id', 'name', 'hourly_rate as base_salary')
            ->where('account_id', Auth::user()->account_id)
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                $nameParts = explode(' ', $user->name, 2);
                return [
                    'employee_id' => $user->employee_id,
                    'first_name' => $nameParts[0] ?? '',
                    'last_name' => $nameParts[1] ?? '',
                    'base_salary' => $user->base_salary,
                ];
            });

        return Inertia::render('EmployeeSalaries/Edit', [
            'salary' => $employeeSalary,
            'employees' => $employees,
            'statuses' => EmployeeSalary::getStatuses(),
            'months' => EmployeeSalary::getMonths(),
        ]);
    }

    public function update(Request $request, EmployeeSalary $employeeSalary)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:' . (date('Y') + 1),
            'status' => 'required|in:hazırlanıb,ödənilib,gecikib',
            'payment_date' => 'nullable|date',
            'bonus_amount' => 'nullable|numeric|min:0',
            'deduction_amount' => 'nullable|numeric|min:0',
            'bonus_reason' => 'nullable|string|max:500',
            'deduction_reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check for duplicate salary record (excluding current record)
        $exists = EmployeeSalary::where('account_id', Auth::user()->account_id)
            ->where('employee_id', $validated['employee_id'])
            ->where('month', $validated['month'])
            ->where('year', $validated['year'])
            ->where('salary_id', '!=', $employeeSalary->salary_id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['employee_id' => __('app.salary_already_exists_for_period')]);
        }

        $validated['bonus_amount'] = $validated['bonus_amount'] ?? 0;
        $validated['deduction_amount'] = $validated['deduction_amount'] ?? 0;

        $employeeSalary->update($validated);

        return redirect()->route('employee-salaries.index')
            ->with('success', __('app.employee_salary_updated'));
    }

    public function destroy(EmployeeSalary $employeeSalary)
    {
        Gate::authorize('access-account-data');

        $employeeSalary->delete();

        return redirect()->route('employee-salaries.index')
            ->with('success', __('app.employee_salary_deleted'));
    }

    public function markAsPaid(Request $request, EmployeeSalary $employee_salary)
    {
        Gate::authorize('access-account-data');

        $validated = $request->validate([
            'payment_date' => 'required|date',
        ]);

        $employee_salary->markAsPaid($validated['payment_date']);

        return back()->with('success', __('app.salary_marked_as_paid'));
    }

    public function search(Request $request)
    {
        Gate::authorize('access-account-data');

        $request->validate([
            'q' => 'required|string|max:255',
        ]);

        $validated = $request->validated();
        $searchTerm = $validated['q'];

        $query = EmployeeSalary::with(['employee'])
            ->whereHas('employee', function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%');
            });

        $salaries = $query->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(10)
            ->get();

        return response()->json($salaries);
    }
}