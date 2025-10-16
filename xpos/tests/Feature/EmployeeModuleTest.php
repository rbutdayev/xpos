<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Account;
use App\Models\Employee;
use App\Models\Branch;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Account $account;
    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create account and user
        $this->account = Account::factory()->create();
        $this->user = User::factory()->create([
            'account_id' => $this->account->id,
            'role' => 'account_owner'
        ]);
        
        // Create company and branch
        $company = Company::factory()->create(['account_id' => $this->account->id]);
        $this->branch = Branch::factory()->create(['account_id' => $this->account->id]);
    }

    public function test_employee_index_displays_employees()
    {
        // Create test employees
        $employees = Employee::factory()->count(3)->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->actingAs($this->user)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Employees/Index')
                ->has('employees.data', 3)
                ->where('employees.data.0.name', $employees[0]->name)
        );
    }

    public function test_employee_create_form_displays()
    {
        $response = $this->actingAs($this->user)->get('/employees/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Employees/Create')
                ->has('branches')
        );
    }

    public function test_employee_can_be_created()
    {
        $employeeData = [
            'name' => 'John Doe',
            'phone' => '+994501234567',
            'email' => 'john@example.com',
            'position' => 'Mexanik',
            'hire_date' => '2024-01-15',
            'hourly_rate' => 15.50,
            'branch_id' => $this->branch->id,
            'is_active' => true,
            'notes' => 'Test employee notes',
        ];

        $response = $this->actingAs($this->user)->post('/employees', $employeeData);

        $this->assertDatabaseHas('employees', [
            'name' => 'John Doe',
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'hourly_rate' => 15.50,
        ]);

        $employee = Employee::where('name', 'John Doe')->first();
        $response->assertRedirect("/employees/{$employee->employee_id}");
    }

    public function test_employee_validation_rules()
    {
        $response = $this->actingAs($this->user)->post('/employees', []);

        $response->assertSessionHasErrors(['name', 'position', 'hire_date', 'hourly_rate', 'branch_id']);
    }

    public function test_employee_show_displays_employee_details()
    {
        $employee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'name' => 'Jane Smith',
            'position' => 'Satış texniki',
        ]);

        $response = $this->actingAs($this->user)->get("/employees/{$employee->employee_id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Employees/Show')
                ->where('employee.name', 'Jane Smith')
                ->where('employee.position', 'Satış texniki')
                ->has('stats')
        );
    }

    public function test_employee_edit_form_displays()
    {
        $employee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->actingAs($this->user)->get("/employees/{$employee->employee_id}/edit");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Employees/Edit')
                ->where('employee.name', $employee->name)
                ->has('branches')
        );
    }

    public function test_employee_can_be_updated()
    {
        $employee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'phone' => '+994501234567',
            'email' => 'updated@example.com',
            'position' => 'Manager',
            'hire_date' => '2024-02-01',
            'hourly_rate' => 20.00,
            'branch_id' => $this->branch->id,
            'is_active' => false,
            'notes' => 'Updated notes',
        ];

        $response = $this->actingAs($this->user)->put("/employees/{$employee->employee_id}", $updateData);

        $this->assertDatabaseHas('employees', [
            'employee_id' => $employee->employee_id,
            'name' => 'Updated Name',
            'hourly_rate' => 20.00,
            'is_active' => false,
        ]);

        $response->assertRedirect("/employees/{$employee->employee_id}");
    }

    public function test_employee_can_be_deleted_when_no_work_history()
    {
        $employee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->actingAs($this->user)->delete("/employees/{$employee->employee_id}");

        $this->assertDatabaseMissing('employees', [
            'employee_id' => $employee->employee_id,
        ]);

        $response->assertRedirect('/employees');
    }

    public function test_employee_search_api_returns_correct_results()
    {
        $employee1 = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'name' => 'Alice Johnson',
            'position' => 'Mexanik',
            'is_active' => true,
        ]);

        $employee2 = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'name' => 'Bob Wilson',
            'position' => 'Servis texniki',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)->get('/employees/search?q=Alice');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.name', 'Alice Johnson');
    }

    public function test_employee_filtering_by_branch()
    {
        $branch2 = Branch::factory()->create(['account_id' => $this->account->id]);

        $employee1 = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
        ]);

        $employee2 = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $branch2->id,
        ]);

        $response = $this->actingAs($this->user)->get("/employees?branch_id={$this->branch->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('employees.data', 1)
                ->where('employees.data.0.branch_id', $this->branch->id)
        );
    }

    public function test_employee_filtering_by_status()
    {
        $activeEmployee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $inactiveEmployee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->user)->get('/employees?status=active');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('employees.data', 1)
                ->where('employees.data.0.is_active', true)
        );
    }

    public function test_employee_search_functionality()
    {
        $employee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'name' => 'Test Employee',
            'position' => 'Mechanic',
            'phone' => '+994501234567',
            'email' => 'test@employee.com',
        ]);

        // Test search by name
        $response = $this->actingAs($this->user)->get('/employees?search=Test');
        $response->assertInertia(fn ($page) => $page->has('employees.data', 1));

        // Test search by position
        $response = $this->actingAs($this->user)->get('/employees?search=Mechanic');
        $response->assertInertia(fn ($page) => $page->has('employees.data', 1));

        // Test search by phone
        $response = $this->actingAs($this->user)->get('/employees?search=5012345');
        $response->assertInertia(fn ($page) => $page->has('employees.data', 1));
    }

    public function test_employee_sorting()
    {
        $employee1 = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'name' => 'Alice Employee',
            'hire_date' => '2024-01-01',
        ]);

        $employee2 = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'name' => 'Bob Employee',
            'hire_date' => '2024-02-01',
        ]);

        // Test sorting by name ascending
        $response = $this->actingAs($this->user)->get('/employees?sort=name&direction=asc');
        $response->assertInertia(fn ($page) => 
            $page->where('employees.data.0.name', 'Alice Employee')
        );

        // Test sorting by hire_date descending
        $response = $this->actingAs($this->user)->get('/employees?sort=hire_date&direction=desc');
        $response->assertInertia(fn ($page) => 
            $page->where('employees.data.0.name', 'Bob Employee')
        );
    }

    public function test_employees_are_isolated_by_account()
    {
        // Create another account with employees
        $otherAccount = Account::factory()->create();
        $otherBranch = Branch::factory()->create(['account_id' => $otherAccount->id]);
        $otherCompany = Company::factory()->create(['account_id' => $otherAccount->id]);
        
        Employee::factory()->count(2)->create([
            'account_id' => $otherAccount->id,
            'branch_id' => $otherBranch->id,
        ]);

        // Create employee for current account
        Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->actingAs($this->user)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('employees.data', 1) // Should only see own account's employees
        );
    }

    public function test_employee_authorization_prevents_cross_account_access()
    {
        // Create employee in another account
        $otherAccount = Account::factory()->create();
        $otherBranch = Branch::factory()->create(['account_id' => $otherAccount->id]);
        $otherCompany = Company::factory()->create(['account_id' => $otherAccount->id]);
        
        $otherEmployee = Employee::factory()->create([
            'account_id' => $otherAccount->id,
            'branch_id' => $otherBranch->id,
        ]);

        // Try to access other account's employee
        $response = $this->actingAs($this->user)->get("/employees/{$otherEmployee->employee_id}");
        $response->assertStatus(403);

        // Try to edit other account's employee
        $response = $this->actingAs($this->user)->get("/employees/{$otherEmployee->employee_id}/edit");
        $response->assertStatus(403);

        // Try to delete other account's employee
        $response = $this->actingAs($this->user)->delete("/employees/{$otherEmployee->employee_id}");
        $response->assertStatus(403);
    }

    public function test_employee_model_attributes_and_accessors()
    {
        $employee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'branch_id' => $this->branch->id,
            'phone' => '994501234567',
        ]);

        // Test formatted phone accessor
        $this->assertNotNull($employee->getFormattedPhoneAttribute());
        $this->assertStringContainsString('+994 50', $employee->formatted_phone);

        // Test activity scope
        $activeEmployees = Employee::active()->get();
        $this->assertTrue($activeEmployees->contains($employee));

        // Test relationships
        $this->assertInstanceOf(Account::class, $employee->account);
        $this->assertInstanceOf(Branch::class, $employee->branch);
    }
}