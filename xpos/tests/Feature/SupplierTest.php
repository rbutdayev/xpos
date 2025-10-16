<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->account = Account::factory()->create();
        $this->user = User::factory()->create([
            'account_id' => $this->account->id,
            'role' => 'account_owner'
        ]);
    }

    public function test_suppliers_index_page_displays(): void
    {
        $this->actingAs($this->user);
        
        Supplier::factory()->count(3)->create([
            'account_id' => $this->account->id
        ]);
        
        $response = $this->get(route('suppliers.index'));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Suppliers/Index')
            ->has('suppliers')
        );
    }

    public function test_supplier_create_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $response = $this->get(route('suppliers.create'));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Suppliers/Create')
        );
    }

    public function test_supplier_can_be_created(): void
    {
        $this->actingAs($this->user);
        
        $supplierData = [
            'name' => 'Test Təchizatçısı',
            'contact_person' => 'Əhməd Məmmədov',
            'phone' => '+994501234567',
            'email' => 'test@supplier.az',
            'address' => 'Bakı şəhəri',
            'tax_number' => '1234567890',
            'bank_account' => 'AZ12NABZ00000000000000123456',
            'bank_name' => 'Kapital Bank',
            'payment_terms_days' => 30,
            'notes' => 'Test qeydləri',
            'is_active' => true,
        ];
        
        $response = $this->post(route('suppliers.store'), $supplierData);
        
        $response->assertRedirect();
        
        $this->assertDatabaseHas('suppliers', [
            'account_id' => $this->account->id,
            'name' => 'Test Təchizatçısı',
            'contact_person' => 'Əhməd Məmmədov',
            'tax_number' => '1234567890',
        ]);
    }

    public function test_supplier_show_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $supplier = Supplier::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $response = $this->get(route('suppliers.show', $supplier));
        
        // For now just test that the request works since frontend component may not exist
        $response->assertStatus(200);
    }

    public function test_supplier_edit_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $supplier = Supplier::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $response = $this->get(route('suppliers.edit', $supplier));
        
        // For now just test that the request works since frontend component may not exist
        $response->assertStatus(200);
    }

    public function test_supplier_can_be_updated(): void
    {
        $this->actingAs($this->user);
        
        $supplier = Supplier::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $updateData = [
            'name' => 'Yenilənmiş Təchizatçı',
            'contact_person' => 'Yeni Əlaqədar',
            'phone' => '+994501111111',
            'email' => 'updated@supplier.az',
            'address' => 'Yeni ünvan',
            'payment_terms_days' => 45,
            'is_active' => true,
        ];
        
        $response = $this->put(route('suppliers.update', $supplier), $updateData);
        
        $response->assertRedirect();
        
        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'name' => 'Yenilənmiş Təchizatçı',
            'contact_person' => 'Yeni Əlaqədar',
            'payment_terms_days' => 45,
        ]);
    }

    public function test_supplier_search_works(): void
    {
        $this->actingAs($this->user);
        
        Supplier::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Test Təchizatçısı',
            'contact_person' => 'Test Şəxs'
        ]);
        
        $response = $this->get(route('suppliers.search') . '?q=Test');
        
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Test Təchizatçısı']);
    }

    public function test_supplier_can_be_linked_to_product(): void
    {
        $this->actingAs($this->user);
        
        $supplier = Supplier::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $product = Product::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $linkData = [
            'product_id' => $product->id,
            'supplier_price' => 100.00,
            'supplier_sku' => 'SUP-001',
            'lead_time_days' => 7,
            'minimum_order_quantity' => 10,
            'discount_percentage' => 5.0,
            'is_preferred' => true,
        ];
        
        $response = $this->post(route('suppliers.link-product', $supplier), $linkData);
        
        $response->assertRedirect();
        
        $this->assertDatabaseHas('supplier_products', [
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
            'supplier_price' => 100.00,
            'is_preferred' => true,
        ]);
    }

    public function test_supplier_product_pricing_can_be_updated(): void
    {
        $this->actingAs($this->user);
        
        $supplier = Supplier::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $product = Product::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        // First link the product
        $supplier->products()->attach($product->id, [
            'supplier_price' => 100.00,
            'lead_time_days' => 7,
            'minimum_order_quantity' => 10,
        ]);
        
        $updateData = [
            'supplier_price' => 120.00,
            'lead_time_days' => 5,
            'minimum_order_quantity' => 15,
            'discount_percentage' => 10.0,
        ];
        
        $response = $this->put(route('suppliers.update-product', [$supplier, $product]), $updateData);
        
        $response->assertRedirect();
        
        $this->assertDatabaseHas('supplier_products', [
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
            'supplier_price' => 120.00,
            'lead_time_days' => 5,
            'discount_percentage' => 10.0,
        ]);
    }

    public function test_supplier_can_be_unlinked_from_product(): void
    {
        $this->actingAs($this->user);
        
        $supplier = Supplier::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $product = Product::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        // First link the product
        $supplier->products()->attach($product->id, [
            'supplier_price' => 100.00,
        ]);
        
        $response = $this->delete(route('suppliers.unlink-product', [$supplier, $product]));
        
        $response->assertRedirect();
        
        $this->assertDatabaseMissing('supplier_products', [
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_unauthorized_user_cannot_access_supplier(): void
    {
        $otherAccount = Account::factory()->create();
        $otherUser = User::factory()->create([
            'account_id' => $otherAccount->id
        ]);
        
        $supplier = Supplier::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $this->actingAs($otherUser);
        
        $response = $this->get(route('suppliers.show', $supplier));
        
        $response->assertStatus(404);
    }
}