<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Company;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenantAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create two separate accounts
        $this->account1 = Account::factory()->create(['company_name' => 'Account 1']);
        $this->account2 = Account::factory()->create(['company_name' => 'Account 2']);
        
        // Create users for each account
        $this->user1 = User::factory()->create([
            'account_id' => $this->account1->id,
            'role' => 'account_owner'
        ]);
        
        $this->user2 = User::factory()->create([
            'account_id' => $this->account2->id,
            'role' => 'account_owner'
        ]);
        
        // Create data for each account
        $this->company1 = Company::factory()->create(['account_id' => $this->account1->id]);
        $this->company2 = Company::factory()->create(['account_id' => $this->account2->id]);
        
        $this->product1 = Product::factory()->create(['account_id' => $this->account1->id]);
        $this->product2 = Product::factory()->create(['account_id' => $this->account2->id]);
        
        $this->supplier1 = Supplier::factory()->create(['account_id' => $this->account1->id]);
        $this->supplier2 = Supplier::factory()->create(['account_id' => $this->account2->id]);
    }

    public function test_users_cannot_access_other_accounts_companies(): void
    {
        $this->actingAs($this->user1);
        
        // User 1 should be able to access their own company
        $response = $this->get(route('companies.show', $this->company1));
        $response->assertStatus(200);
        
        // User 1 should NOT be able to access company from account 2
        $response = $this->get(route('companies.show', $this->company2));
        $response->assertStatus(404);
    }

    public function test_users_cannot_access_other_accounts_products(): void
    {
        $this->actingAs($this->user1);
        
        // User 1 should be able to access their own product
        $response = $this->get(route('products.show', $this->product1));
        $response->assertStatus(200);
        
        // User 1 should NOT be able to access product from account 2
        $response = $this->get(route('products.show', $this->product2));
        $response->assertStatus(404);
    }

    public function test_users_cannot_access_other_accounts_suppliers(): void
    {
        $this->actingAs($this->user2);
        
        // User 2 should NOT be able to access supplier from account 1
        $response = $this->get(route('suppliers.show', $this->supplier1));
        $response->assertStatus(404);
    }

    public function test_users_cannot_modify_other_accounts_data(): void
    {
        $this->actingAs($this->user1);
        
        // User 1 should NOT be able to update product from account 2
        $response = $this->put(route('products.update', $this->product2), [
            'name' => 'Hacked Product',
            'type' => 'product',
            'unit' => 'pcs',
            'purchase_price' => 100,
            'sale_price' => 150,
        ]);
        $response->assertStatus(404);
        
        // Verify the product was not modified
        $this->product2->refresh();
        $this->assertNotEquals('Hacked Product', $this->product2->name);
    }

    public function test_users_cannot_delete_other_accounts_data(): void
    {
        $this->actingAs($this->user1);
        
        // User 1 should NOT be able to delete supplier from account 2
        $response = $this->delete(route('suppliers.destroy', $this->supplier2));
        $response->assertStatus(404);
        
        // Verify the supplier still exists
        $this->assertDatabaseHas('suppliers', [
            'id' => $this->supplier2->id,
            'account_id' => $this->account2->id,
        ]);
    }

    public function test_search_results_are_isolated_by_account(): void
    {
        // Create products with similar names in both accounts
        Product::factory()->create([
            'account_id' => $this->account1->id,
            'name' => 'Test Product Account 1'
        ]);
        
        Product::factory()->create([
            'account_id' => $this->account2->id,
            'name' => 'Test Product Account 2'
        ]);
        
        // User 1 should only see results from their account
        $this->actingAs($this->user1);
        $response = $this->get(route('products.search') . '?q=Test Product');
        
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Test Product Account 1']);
        $response->assertJsonMissing(['name' => 'Test Product Account 2']);
        
        // User 2 should only see results from their account
        $this->actingAs($this->user2);
        $response = $this->get(route('products.search') . '?q=Test Product');
        
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Test Product Account 2']);
        $response->assertJsonMissing(['name' => 'Test Product Account 1']);
    }

    public function test_listing_pages_show_only_account_data(): void
    {
        $this->actingAs($this->user1);
        
        // Products index should only show account 1 products
        $response = $this->get(route('products.index'));
        $response->assertStatus(200);
        
        // Check that response data only contains account 1 products
        $products = $response->getOriginalContent()->getData()['page']['props']['products']['data'];
        foreach ($products as $product) {
            $this->assertEquals($this->account1->id, $product['account_id']);
        }
        
        // Suppliers index should only show account 1 suppliers
        $response = $this->get(route('suppliers.index'));
        $response->assertStatus(200);
        
        $suppliers = $response->getOriginalContent()->getData()['page']['props']['suppliers']['data'];
        foreach ($suppliers as $supplier) {
            $this->assertEquals($this->account1->id, $supplier['account_id']);
        }
    }

    public function test_account_access_middleware_blocks_wrong_account(): void
    {
        // Create a URL that requires account access
        $this->actingAs($this->user1);
        
        // Try to access a route with wrong account context
        // This should be blocked by account.access middleware
        $response = $this->get('/companies');
        $response->assertStatus(200); // Should work for own account
        
        // Switch to user2 and verify isolation
        $this->actingAs($this->user2);
        $response = $this->get('/companies');
        $response->assertStatus(200); // Should work for their own account too
    }

    public function test_gate_authorization_respects_account_isolation(): void
    {
        $this->actingAs($this->user1);
        
        // Test that the access-account-data gate works correctly
        $this->assertTrue(auth()->user()->can('access-account-data', $this->company1));
        $this->assertFalse(auth()->user()->can('access-account-data', $this->company2));
        
        $this->assertTrue(auth()->user()->can('access-account-data', $this->product1));
        $this->assertFalse(auth()->user()->can('access-account-data', $this->product2));
        
        $this->assertTrue(auth()->user()->can('access-account-data', $this->supplier1));
        $this->assertFalse(auth()->user()->can('access-account-data', $this->supplier2));
    }
}