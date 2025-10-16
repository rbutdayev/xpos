<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Services\DocumentUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CompanyController extends Controller
{
    private DocumentUploadService $documentService;

    public function __construct(DocumentUploadService $documentService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->documentService = $documentService;
    }

    public function index()
    {
        Gate::authorize('manage-account');
        
        // In proper multi-tenant SaaS, there should be only 1 company per account
        $company = Auth::user()->account->companies()->first();
        
        if (!$company) {
            return redirect()->route('setup.wizard')
                ->with('error', 'Şirkət məlumatları tapılmadı. Zəhmət olmasa sistemin quraşdırılmasını tamamlayın.');
        }
        
        $user = Auth::user();
        
        // Get related statistics for the system tab
        $branches = Branch::where('account_id', $user->account_id)->get(['id', 'name', 'is_active']);
        $warehouses = Warehouse::where('account_id', $user->account_id)->get(['id', 'name', 'is_active']);
        $users = \App\Models\User::where('account_id', $user->account_id)->get(['id', 'name', 'email', 'role']);
        
        // Prepare company data with logo URL
        $companyData = $company->toArray();
        if ($company->logo_path) {
            $companyData['logo_url'] = $this->documentService->getFileUrl($company->logo_path);
        }
        
        return Inertia::render('Company/Show', [
            'company' => $companyData,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'users' => $users
        ]);
    }

    public function setupWizard()
    {
        Gate::authorize('manage-account');
        
        // Check if setup is already completed
        $hasCompany = Auth::user()->account->companies()->exists();
        
        if ($hasCompany) {
            return redirect()->route('dashboard');
        }
        
        return Inertia::render('Company/SetupWizard');
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-account');
        
        // Only setup wizard is allowed - customers cannot create multiple companies
        if (!$request->has('branch_name') || !$request->has('warehouse_name')) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Yalnız sistem quraşdırılması zamanı şirkət yaradıla bilər.']);
        }

        // Check if company already exists for this account
        if (Auth::user()->account->companies()->exists()) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Hesabınız üçün artıq şirkət mövcuddur.']);
        }
        
        $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            
            // Branch data
            'branch_name' => 'required|string|max:255',
            'branch_address' => 'nullable|string',
            'branch_phone' => 'nullable|string|max:20',
            'branch_email' => 'nullable|email|max:255',
            
            // Warehouse data
            'warehouse_name' => 'required|string|max:255',
            'warehouse_type' => 'required|in:main,auxiliary,mobile',
            'warehouse_location' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            $account = Auth::user()->account;
            
            // Create the single company for this account
            $account->companies()->create([
                'name' => $request->company_name,
                'address' => $request->address,
                'tax_number' => $request->tax_number,
                'phone' => $request->phone,
                'email' => $request->email,
                'website' => $request->website,
                'description' => $request->description,
                'default_language' => 'az',
                'is_active' => true,
            ]);

            // Create main branch
            $branch = $account->branches()->create([
                'name' => $request->branch_name,
                'address' => $request->branch_address,
                'phone' => $request->branch_phone,
                'email' => $request->branch_email,
                'is_main' => true,
                'is_active' => true,
            ]);

            // Create main warehouse
            $warehouse = $account->warehouses()->create([
                'name' => $request->warehouse_name,
                'type' => $request->warehouse_type,
                'location' => $request->warehouse_location,
                'is_active' => true,
            ]);

            // Grant full access to main branch for main warehouse
            $warehouse->grantBranchAccess($branch->id, [
                'can_transfer' => true,
                'can_view_stock' => true,
                'can_modify_stock' => true,
                'can_receive_stock' => true,
                'can_issue_stock' => true,
            ]);
        });

        return redirect()->route('dashboard')->with('success', __('app.setup_completed_successfully'));
    }

    public function show(Company $company)
    {
        Gate::authorize('access-account-data', $company);
        
        $user = Auth::user();
        
        // Get related statistics for the system tab
        $branches = Branch::where('account_id', $user->account_id)->get(['id', 'name', 'is_active']);
        $warehouses = Warehouse::where('account_id', $user->account_id)->get(['id', 'name', 'is_active']);
        $users = \App\Models\User::where('account_id', $user->account_id)->get(['id', 'name', 'email', 'role']);
        
        // Prepare company data with logo URL
        $companyData = $company->toArray();
        if ($company->logo_path) {
            $companyData['logo_url'] = $this->documentService->getFileUrl($company->logo_path);
        }
        
        return Inertia::render('Company/Show', [
            'company' => $companyData,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'users' => $users
        ]);
    }

    public function edit(Company $company)
    {
        Gate::authorize('manage-account');
        Gate::authorize('access-account-data', $company);
        
        // Prepare company data with logo URL
        $companyData = $company->toArray();
        if ($company->logo_path) {
            $companyData['logo_url'] = $this->documentService->getFileUrl($company->logo_path);
        }
        
        return Inertia::render('Company/Edit', [
            'company' => $companyData
        ]);
    }

    public function update(Request $request, Company $company)
    {
        Gate::authorize('manage-account');
        Gate::authorize('access-account-data', $company);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'default_language' => 'required|in:az,en,tr',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        DB::transaction(function () use ($request, $company) {
            // Update basic company information
            $company->update($request->only([
                'name', 'address', 'tax_number', 'phone', 'email', 
                'website', 'description', 'default_language'
            ]));

            // Handle logo upload if provided
            if ($request->hasFile('logo')) {
                try {
                    // Delete old logo if exists
                    if ($company->logo_path) {
                        $this->documentService->deleteFile($company->logo_path);
                    }

                    // Upload new logo
                    $logoPath = $this->documentService->uploadFile(
                        $request->file('logo'),
                        'company_logos',
                        'logo'
                    );

                    // Update company with new logo path
                    $company->update(['logo_path' => $logoPath]);

                } catch (\Exception $e) {
                    \Log::error('Logo upload failed: ' . $e->getMessage());
                    throw $e; // Re-throw to trigger rollback
                }
            }
        });

        return redirect()->route('companies.show', $company)
                        ->with('success', 'Şirkət məlumatları uğurla yeniləndi');
    }

    public function destroy(Company $company)
    {
        // Customers cannot delete their company - only superadmin can
        return redirect()->route('companies.index')
                        ->withErrors(['error' => 'Şirkət silinə bilməz. Dəstək ilə əlaqə saxlayın.']);
    }
}
