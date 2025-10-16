<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\ServiceRecord;
use App\Models\ServiceItem;
use App\Models\Product;
use App\Models\Branch;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class Module5CRUDTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $account;
    protected $user;
    protected $branch;
    protected $company;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test account and user
        $this->account = Account::create([
            'company_name' => 'Test Company',
            'subscription_plan' => 'professional',
            'language' => 'az'
        ]);

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'account_id' => $this->account->id,
            'role' => 'admin',
            'status' => 'active'
        ]);

        $this->company = Company::create([
            'account_id' => $this->account->id,
            'name' => 'Test Company LLC',
            'address' => 'Test Address',
            'default_language' => 'az'
        ]);

        $this->branch = Branch::create([
            'account_id' => $this->account->id,
            'name' => 'Main Branch',
            'address' => 'Test Address',
            'is_main' => true
        ]);
    }

    /** @test */
    public function it_can_create_customer_via_http(): void
    {
        $this->actingAs($this->user);

        $customerData = [
            'name' => 'John Doe',
            'phone' => '+994551234567',
            'email' => 'john@example.com',
            'address' => '123 Main St, Baku',
            'customer_type' => 'individual',
            'tax_number' => null,
            'notes' => 'Test customer',
            'is_active' => true
        ];

        $response = $this->post('/customers', $customerData);

        $response->assertRedirect();
        $this->assertDatabaseHas('customers', [
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'phone' => '+994551234567',
            'customer_type' => 'individual'
        ]);
    }

    /** @test */
    public function it_can_list_customers_via_http(): void
    {
        $this->actingAs($this->user);

        // Create test customers
        Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        Customer::create([
            'account_id' => $this->account->id,
            'name' => 'Jane Smith',
            'customer_type' => 'corporate'
        ]);

        $response = $this->get('/customers');

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => $assert
            ->component('Customers/Index')
            ->has('customers.data', 2)
        );
    }

    /** @test */
    public function it_can_show_customer_via_http(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual',
            'phone' => '+994551234567'
        ]);

        $response = $this->get("/customers/{$customer->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($assert) => $assert
            ->component('Customers/Show')
            ->where('customer.name', 'John Doe')
        );
    }

    /** @test */
    public function it_can_update_customer_via_http(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        $updateData = [
            'name' => 'John Smith',
            'phone' => '+994551234567',
            'email' => 'johnsmith@example.com',
            'address' => '456 Oak St, Baku',
            'customer_type' => 'individual',
            'tax_number' => null,
            'notes' => 'Updated customer',
            'is_active' => true
        ];

        $response = $this->put("/customers/{$customer->id}", $updateData);

        $response->assertRedirect();
        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => 'John Smith',
            'phone' => '+994551234567'
        ]);
    }

    /** @test */
    public function it_can_delete_customer_via_http(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        $response = $this->delete("/customers/{$customer->id}");

        $response->assertRedirect();
        $this->assertSoftDeleted('customers', ['id' => $customer->id]);
    }

    /** @test */
    public function it_can_search_customers_via_http(): void
    {
        $this->actingAs($this->user);

        Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual',
            'phone' => '+994551234567'
        ]);

        Customer::create([
            'account_id' => $this->account->id,
            'name' => 'Jane Smith',
            'customer_type' => 'corporate'
        ]);

        $response = $this->get('/customers/search?q=John');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['name' => 'John Doe']);
    }

    /** @test */
    public function it_can_create_vehicle_via_http(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        $vehicleData = [
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'year' => 2020,
            'vin' => 'ABC123456789',
            'engine_type' => 'petrol',
            'color' => 'Black',
            'mileage' => 50000,
            'notes' => 'Test vehicle',
            'is_active' => true
        ];

        $response = $this->post('/vehicles', $vehicleData);

        $response->assertRedirect();
        $this->assertDatabaseHas('vehicles', [
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW'
        ]);
    }

    /** @test */
    public function it_can_create_service_record_via_http(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        $vehicle = Vehicle::create([
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'engine_type' => 'petrol'
        ]);

        $product = Product::create([
            'account_id' => $this->account->id,
            'name' => 'Engine Oil',
            'sku' => 'OIL001',
            'type' => 'product'
        ]);

        $serviceData = [
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'branch_id' => $this->branch->id,
            'employee_id' => $this->user->id,
            'description' => 'Oil change and filter replacement',
            'labor_cost' => 50.00,
            'service_date' => now()->format('Y-m-d'),
            'vehicle_mileage' => 51000,
            'notes' => 'Regular maintenance',
            'service_items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_price' => 25.00,
                    'notes' => 'High quality oil'
                ]
            ]
        ];

        $response = $this->post('/service-records', $serviceData);

        $response->assertRedirect();
        $this->assertDatabaseHas('service_records', [
            'account_id' => $this->account->id,
            'customer_id' => $customer->id,
            'description' => 'Oil change and filter replacement'
        ]);

        $this->assertDatabaseHas('service_items', [
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 25.00
        ]);
    }

    /** @test */
    public function it_enforces_multi_tenant_isolation(): void
    {
        // Create another account
        $otherAccount = Account::create([
            'company_name' => 'Other Company',
            'subscription_plan' => 'başlanğıc',
            'language' => 'az'
        ]);

        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other@test.com',
            'password' => bcrypt('password'),
            'account_id' => $otherAccount->id,
            'role' => 'admin',
            'status' => 'active'
        ]);

        $otherCustomer = Customer::create([
            'account_id' => $otherAccount->id,
            'name' => 'Other Customer',
            'customer_type' => 'individual'
        ]);

        // Acting as first user, try to access other account's customer
        $this->actingAs($this->user);

        $response = $this->get("/customers/{$otherCustomer->id}");
        $response->assertStatus(403);

        $response = $this->put("/customers/{$otherCustomer->id}", [
            'name' => 'Hacked Name',
            'customer_type' => 'individual'
        ]);
        $response->assertStatus(403);

        $response = $this->delete("/customers/{$otherCustomer->id}");
        $response->assertStatus(403);
    }

    /** @test */
    public function it_validates_customer_data(): void
    {
        $this->actingAs($this->user);

        // Test validation - missing required fields
        $response = $this->post('/customers', []);
        $response->assertSessionHasErrors(['name', 'customer_type']);

        // Test validation - invalid customer type
        $response = $this->post('/customers', [
            'name' => 'John Doe',
            'customer_type' => 'invalid_type'
        ]);
        $response->assertSessionHasErrors(['customer_type']);

        // Test validation - invalid email format
        $response = $this->post('/customers', [
            'name' => 'John Doe',
            'customer_type' => 'individual',
            'email' => 'invalid-email'
        ]);
        $response->assertSessionHasErrors(['email']);
    }

    /** @test */
    public function it_validates_vehicle_data(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        // Test validation - missing required fields
        $response = $this->post('/vehicles', []);
        $response->assertSessionHasErrors(['customer_id', 'plate_number', 'brand', 'model', 'engine_type']);

        // Test validation - invalid customer
        $response = $this->post('/vehicles', [
            'customer_id' => 99999,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'engine_type' => 'petrol'
        ]);
        $response->assertSessionHasErrors(['customer_id']);

        // Test validation - duplicate plate number
        Vehicle::create([
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'engine_type' => 'petrol'
        ]);

        $response = $this->post('/vehicles', [
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'engine_type' => 'petrol'
        ]);
        $response->assertSessionHasErrors(['plate_number']);
    }

    /** @test */
    public function it_calculates_service_costs_correctly(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        $serviceRecord = ServiceRecord::create([
            'account_id' => $this->account->id,
            'customer_id' => $customer->id,
            'branch_id' => $this->branch->id,
            'description' => 'Oil change',
            'labor_cost' => 50.00,
            'service_date' => now()->format('Y-m-d')
        ]);

        $product = Product::create([
            'account_id' => $this->account->id,
            'name' => 'Engine Oil',
            'sku' => 'OIL001',
            'type' => 'product'
        ]);

        // Add service items
        $serviceItem1 = ServiceItem::create([
            'service_id' => $serviceRecord->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 25.00
        ]);

        $serviceItem2 = ServiceItem::create([
            'service_id' => $serviceRecord->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 10.00
        ]);

        $serviceRecord->refresh();

        // Verify calculations
        $this->assertEquals(50.00, $serviceItem1->total_price); // 2 * 25.00
        $this->assertEquals(10.00, $serviceItem2->total_price); // 1 * 10.00
        $this->assertEquals(60.00, $serviceRecord->parts_total); // 50.00 + 10.00
        $this->assertEquals(110.00, $serviceRecord->total_cost); // 50.00 labor + 60.00 parts
    }

    /** @test */
    public function it_updates_service_status_correctly(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        $serviceRecord = ServiceRecord::create([
            'account_id' => $this->account->id,
            'customer_id' => $customer->id,
            'branch_id' => $this->branch->id,
            'description' => 'Oil change',
            'labor_cost' => 50.00,
            'service_date' => now()->format('Y-m-d'),
            'status' => 'pending'
        ]);

        // Update status to in_progress
        $response = $this->patch("/service-records/{$serviceRecord->id}/status", [
            'status' => 'in_progress'
        ]);

        $response->assertRedirect();
        $serviceRecord->refresh();
        $this->assertEquals('in_progress', $serviceRecord->status);
        $this->assertNotNull($serviceRecord->started_at);

        // Update status to completed
        $response = $this->patch("/service-records/{$serviceRecord->id}/status", [
            'status' => 'completed'
        ]);

        $response->assertRedirect();
        $serviceRecord->refresh();
        $this->assertEquals('completed', $serviceRecord->status);
        $this->assertNotNull($serviceRecord->completed_at);
    }
}
