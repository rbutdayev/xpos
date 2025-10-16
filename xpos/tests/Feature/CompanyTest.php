<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create account and user for testing
        $this->account = Account::factory()->create();
        $this->user = User::factory()->create([
            'account_id' => $this->account->id,
            'role' => 'account_owner'
        ]);
    }

    public function test_company_index_page_displays(): void
    {
        $this->actingAs($this->user);
        
        // Create a company for the user first
        Company::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $response = $this->get(route('companies.index'));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Company/Show')
            ->has('company')
        );
    }

    public function test_company_setup_wizard_displays(): void
    {
        $this->actingAs($this->user);
        
        $response = $this->get(route('setup.wizard'));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Company/SetupWizard')
        );
    }

    public function test_company_can_be_created_through_setup(): void
    {
        $this->actingAs($this->user);
        
        $companyData = [
            'company_name' => 'Test Şirkəti',
            'address' => 'Bakı şəhəri',
            'tax_number' => '1234567890',
            'phone' => '+994501234567',
            'email' => 'test@company.az',
            'branch_name' => 'Əsas filial',
            'branch_address' => 'Bakı şəhəri',
            'branch_phone' => '+994501234567',
            'warehouse_name' => 'Əsas anbar',
            'warehouse_type' => 'main',
        ];
        
        $response = $this->post(route('setup.store'), $companyData);
        
        $response->assertRedirect(route('dashboard'));
        
        $this->assertDatabaseHas('companies', [
            'account_id' => $this->account->id,
            'name' => 'Test Şirkəti',
            'tax_number' => '1234567890',
        ]);
        
        $this->assertDatabaseHas('branches', [
            'account_id' => $this->account->id,
            'name' => 'Əsas filial',
            'is_main' => true,
        ]);
        
        $this->assertDatabaseHas('warehouses', [
            'account_id' => $this->account->id,
            'name' => 'Əsas anbar',
        ]);
    }

    public function test_company_edit_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $company = Company::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $response = $this->get(route('companies.edit', $company));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Company/Edit')
            ->has('company')
        );
    }

    public function test_company_can_be_updated(): void
    {
        $this->actingAs($this->user);
        
        $company = Company::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $updateData = [
            'name' => 'Yenilənmiş Şirkət',
            'address' => 'Yeni ünvan',
            'phone' => '+994501111111',
            'default_language' => 'az',
        ];
        
        $response = $this->put(route('companies.update', $company), $updateData);
        
        $response->assertRedirect();
        
        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Yenilənmiş Şirkət',
            'address' => 'Yeni ünvan',
        ]);
    }

    public function test_company_show_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $company = Company::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $response = $this->get(route('companies.show', $company));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Company/Show')
            ->has('company')
        );
    }

    public function test_unauthorized_user_cannot_access_company(): void
    {
        $otherAccount = Account::factory()->create();
        $otherUser = User::factory()->create([
            'account_id' => $otherAccount->id
        ]);
        
        $company = Company::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $this->actingAs($otherUser);
        
        $response = $this->get(route('companies.show', $company));
        
        $response->assertStatus(404);
    }
}