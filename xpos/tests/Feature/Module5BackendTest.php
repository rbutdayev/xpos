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

class Module5BackendTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $account;
    protected $user;
    protected $branch;

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

        Company::create([
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

    public function test_customer_crud_operations_backend(): void
    {
        $this->actingAs($this->user);

        // CREATE
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
        
        $customer = Customer::where('name', 'John Doe')->first();
        $this->assertNotNull($customer);
        $this->assertEquals($this->account->id, $customer->account_id);

        // READ
        $response = $this->get('/customers/search?q=John');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('John Doe', $data[0]['name']);

        // UPDATE
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
        
        $customer->refresh();
        $this->assertEquals('John Smith', $customer->name);

        // DELETE
        $response = $this->delete("/customers/{$customer->id}");
        $response->assertRedirect();
        $this->assertSoftDeleted('customers', ['id' => $customer->id]);
    }

    public function test_vehicle_crud_operations_backend(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        // CREATE
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
        
        $vehicle = Vehicle::where('plate_number', '10AB123')->first();
        $this->assertNotNull($vehicle);
        $this->assertEquals($customer->id, $vehicle->customer_id);

        // READ
        $response = $this->get('/vehicles/search?q=BMW');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('BMW', $data[0]['brand']);

        // UPDATE
        $updateData = array_merge($vehicleData, [
            'model' => 'X7',
            'mileage' => 55000
        ]);

        $response = $this->put("/vehicles/{$vehicle->id}", $updateData);
        $response->assertRedirect();
        
        $vehicle->refresh();
        $this->assertEquals('X7', $vehicle->model);
        $this->assertEquals(55000, $vehicle->mileage);

        // DELETE
        $response = $this->delete("/vehicles/{$vehicle->id}");
        $response->assertRedirect();
        $this->assertDatabaseMissing('vehicles', ['id' => $vehicle->id]);
    }

    public function test_service_record_crud_operations_backend(): void
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

        // CREATE
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
        
        $serviceRecord = ServiceRecord::where('description', 'Oil change and filter replacement')->first();
        $this->assertNotNull($serviceRecord);
        $this->assertEquals($this->account->id, $serviceRecord->account_id);
        $this->assertNotEmpty($serviceRecord->service_number);
        
        // Check service item was created
        $serviceItem = ServiceItem::where('service_id', $serviceRecord->id)->first();
        $this->assertNotNull($serviceItem);
        $this->assertEquals(25.00, $serviceItem->total_price);

        // UPDATE STATUS
        $response = $this->patch("/service-records/{$serviceRecord->id}/status", [
            'status' => 'in_progress'
        ]);
        $response->assertRedirect();
        
        $serviceRecord->refresh();
        $this->assertEquals('in_progress', $serviceRecord->status);
        $this->assertNotNull($serviceRecord->started_at);

        // UPDATE STATUS TO COMPLETED
        $response = $this->patch("/service-records/{$serviceRecord->id}/status", [
            'status' => 'completed'
        ]);
        $response->assertRedirect();
        
        $serviceRecord->refresh();
        $this->assertEquals('completed', $serviceRecord->status);
        $this->assertNotNull($serviceRecord->completed_at);

        // DELETE
        $response = $this->delete("/service-records/{$serviceRecord->id}");
        $response->assertRedirect();
        $this->assertDatabaseMissing('service_records', ['id' => $serviceRecord->id]);
        $this->assertDatabaseMissing('service_items', ['service_id' => $serviceRecord->id]);
    }

    public function test_multi_tenant_isolation_backend(): void
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

        // Acting as first user, verify isolation
        $this->actingAs($this->user);

        // Should not find other account's customers in search
        $response = $this->get('/customers/search?q=Other');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(0, $data);

        // Direct model access should be isolated via BelongsToAccount trait
        $customers = Customer::all();
        $this->assertFalse($customers->contains($otherCustomer));
    }

    public function test_data_validation_backend(): void
    {
        $this->actingAs($this->user);

        // Test customer validation
        $response = $this->post('/customers', []);
        $response->assertSessionHasErrors(['name', 'customer_type']);

        $response = $this->post('/customers', [
            'name' => 'John Doe',
            'customer_type' => 'invalid_type'
        ]);
        $response->assertSessionHasErrors(['customer_type']);

        // Test vehicle validation
        $response = $this->post('/vehicles', []);
        $response->assertSessionHasErrors(['customer_id', 'plate_number', 'brand', 'model', 'engine_type']);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        $response = $this->post('/vehicles', [
            'customer_id' => 99999,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'engine_type' => 'petrol'
        ]);
        $response->assertSessionHasErrors(['customer_id']);

        // Test service record validation
        $response = $this->post('/service-records', []);
        $response->assertSessionHasErrors(['customer_id', 'branch_id', 'description', 'labor_cost', 'service_date']);
    }

    public function test_business_logic_backend(): void
    {
        $this->actingAs($this->user);

        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual',
            'phone' => '+994551234567'
        ]);

        $vehicle = Vehicle::create([
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'year' => 2020,
            'engine_type' => 'petrol'
        ]);

        $serviceRecord = ServiceRecord::create([
            'account_id' => $this->account->id,
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'branch_id' => $this->branch->id,
            'description' => 'Oil change',
            'labor_cost' => 50.00,
            'service_date' => now()->format('Y-m-d'),
            'status' => 'pending'
        ]);

        $product = Product::create([
            'account_id' => $this->account->id,
            'name' => 'Engine Oil',
            'sku' => 'OIL001',
            'type' => 'product'
        ]);

        // Test business logic functions
        $this->assertEquals('+994 55 123 45 67', $customer->formatted_phone);
        $this->assertEquals('Fiziki şəxs', $customer->customer_type_text);
        $this->assertEquals('10-AB-123', $vehicle->formatted_plate);
        $this->assertEquals('BMW X5 2020', $vehicle->full_name);
        $this->assertEquals('Benzin', $vehicle->engine_type_text);
        $this->assertStringStartsWith('SRV', $serviceRecord->service_number);
        $this->assertEquals('Gözləyir', $serviceRecord->status_text);

        // Test cost calculations
        $serviceItem = ServiceItem::create([
            'service_id' => $serviceRecord->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 30.00
        ]);

        $serviceRecord->refresh();
        $this->assertEquals(60.00, $serviceItem->total_price);
        $this->assertEquals(60.00, $serviceRecord->parts_total);
        $this->assertEquals(110.00, $serviceRecord->total_cost); // 50 labor + 60 parts
    }

    public function test_relationships_backend(): void
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

        $serviceRecord = ServiceRecord::create([
            'account_id' => $this->account->id,
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'branch_id' => $this->branch->id,
            'employee_id' => $this->user->id,
            'description' => 'Test service',
            'labor_cost' => 100.00,
            'service_date' => now()->format('Y-m-d')
        ]);

        // Test relationships
        $this->assertInstanceOf(Account::class, $customer->account);
        $this->assertTrue($customer->vehicles->contains($vehicle));
        $this->assertTrue($customer->serviceRecords->contains($serviceRecord));
        $this->assertInstanceOf(Customer::class, $vehicle->customer);
        $this->assertTrue($vehicle->serviceRecords->contains($serviceRecord));
        $this->assertInstanceOf(Customer::class, $serviceRecord->customer);
        $this->assertInstanceOf(Vehicle::class, $serviceRecord->vehicle);
        $this->assertInstanceOf(Branch::class, $serviceRecord->branch);
        $this->assertInstanceOf(User::class, $serviceRecord->employee);

        // Test aggregate attributes
        $this->assertEquals(1, $customer->active_vehicles_count);
        $this->assertEquals(1, $customer->total_service_records);
        $this->assertEquals(1, $vehicle->total_service_records);
    }
}
