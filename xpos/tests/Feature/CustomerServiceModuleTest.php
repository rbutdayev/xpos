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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class CustomerServiceModuleTest extends TestCase
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

        $this->branch = Branch::create([
            'account_id' => $this->account->id,
            'name' => 'Main Branch',
            'address' => 'Test Address',
            'is_main' => true
        ]);
    }

    public function test_customer_creation_and_relationships(): void
    {
        $this->actingAs($this->user);

        // Test customer creation
        $customerData = [
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'phone' => '+994551234567',
            'email' => 'john@example.com',
            'customer_type' => 'individual',
            'is_active' => true
        ];

        $customer = Customer::create($customerData);

        $this->assertDatabaseHas('customers', [
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'phone' => '+994551234567'
        ]);

        // Test customer belongs to account
        $this->assertEquals($this->account->id, $customer->account_id);
        $this->assertInstanceOf(Account::class, $customer->account);

        // Test phone formatting
        $this->assertEquals('+994 55 123 45 67', $customer->formatted_phone);
        
        // Test customer type text
        $this->assertEquals('Fiziki şəxs', $customer->customer_type_text);
    }

    public function test_vehicle_creation_and_relationships(): void
    {
        $this->actingAs($this->user);

        // Create customer first
        $customer = Customer::create([
            'account_id' => $this->account->id,
            'name' => 'John Doe',
            'customer_type' => 'individual'
        ]);

        // Test vehicle creation
        $vehicleData = [
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW',
            'model' => 'X5',
            'year' => 2020,
            'engine_type' => 'petrol',
            'is_active' => true
        ];

        $vehicle = Vehicle::create($vehicleData);

        $this->assertDatabaseHas('vehicles', [
            'customer_id' => $customer->id,
            'plate_number' => '10AB123',
            'brand' => 'BMW'
        ]);

        // Test vehicle belongs to customer
        $this->assertEquals($customer->id, $vehicle->customer_id);
        $this->assertInstanceOf(Customer::class, $vehicle->customer);

        // Test customer has vehicles
        $this->assertTrue($customer->vehicles->contains($vehicle));
        $this->assertEquals(1, $customer->active_vehicles_count);

        // Test plate formatting
        $this->assertEquals('10-AB-123', $vehicle->formatted_plate);
        
        // Test engine type text
        $this->assertEquals('Benzin', $vehicle->engine_type_text);
        
        // Test full name
        $this->assertEquals('BMW X5 2020', $vehicle->full_name);
    }

    public function test_service_record_creation_and_relationships(): void
    {
        $this->actingAs($this->user);

        // Create customer and vehicle
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

        // Test service record creation
        $serviceRecordData = [
            'account_id' => $this->account->id,
            'customer_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'branch_id' => $this->branch->id,
            'employee_id' => $this->user->id,
            'description' => 'Oil change and filter replacement',
            'labor_cost' => 50.00,
            'service_date' => now()->format('Y-m-d'),
            'status' => 'pending'
        ];

        $serviceRecord = ServiceRecord::create($serviceRecordData);

        $this->assertDatabaseHas('service_records', [
            'account_id' => $this->account->id,
            'customer_id' => $customer->id,
            'description' => 'Oil change and filter replacement'
        ]);

        // Test relationships
        $this->assertEquals($customer->id, $serviceRecord->customer_id);
        $this->assertEquals($vehicle->id, $serviceRecord->vehicle_id);
        $this->assertInstanceOf(Customer::class, $serviceRecord->customer);
        $this->assertInstanceOf(Vehicle::class, $serviceRecord->vehicle);

        // Test service number generation
        $this->assertNotEmpty($serviceRecord->service_number);
        $this->assertStringStartsWith('SRV', $serviceRecord->service_number);

        // Test status text
        $this->assertEquals('Gözləyir', $serviceRecord->status_text);
        
        // Test total cost calculation
        $this->assertEquals(50.00, $serviceRecord->total_cost);
    }

    public function test_service_item_creation_and_cost_calculation(): void
    {
        $this->actingAs($this->user);

        // Create required models
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
            'labor_cost' => 30.00,
            'service_date' => now()->format('Y-m-d')
        ]);

        $product = Product::create([
            'account_id' => $this->account->id,
            'name' => 'Engine Oil',
            'sku' => 'OIL001',
            'type' => 'product'
        ]);

        // Test service item creation
        $serviceItemData = [
            'service_id' => $serviceRecord->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 25.00
        ];

        $serviceItem = ServiceItem::create($serviceItemData);

        $this->assertDatabaseHas('service_items', [
            'service_id' => $serviceRecord->id,
            'product_id' => $product->id,
            'quantity' => 2
        ]);

        // Test automatic total price calculation
        $this->assertEquals(50.00, $serviceItem->total_price); // 2 * 25.00

        // Test service record parts total update
        $serviceRecord->refresh();
        $this->assertEquals(50.00, $serviceRecord->parts_total);
        $this->assertEquals(80.00, $serviceRecord->total_cost); // 30.00 labor + 50.00 parts

        // Test relationships
        $this->assertInstanceOf(ServiceRecord::class, $serviceItem->serviceRecord);
        $this->assertInstanceOf(Product::class, $serviceItem->product);
    }

    public function test_multi_tenant_isolation(): void
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

        // Create customer in other account
        $otherCustomer = Customer::create([
            'account_id' => $otherAccount->id,
            'name' => 'Other Customer',
            'customer_type' => 'individual'
        ]);

        // Acting as first user
        $this->actingAs($this->user);

        // Should not be able to access other account's customers
        $customers = Customer::all();
        $this->assertFalse($customers->contains($otherCustomer));

        // Using the BelongsToAccount trait should automatically filter
        $accountCustomers = Customer::where('account_id', $this->account->id)->get();
        $this->assertFalse($accountCustomers->contains($otherCustomer));
    }

    public function test_customer_soft_delete_with_services(): void
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
            'description' => 'Test service',
            'labor_cost' => 100.00,
            'service_date' => now()->format('Y-m-d')
        ]);

        // Customer should not be deletable when they have service records
        $this->assertTrue($customer->serviceRecords()->exists());
        
        // Test soft delete
        $customer->delete();
        $this->assertSoftDeleted('customers', ['id' => $customer->id]);
        
        // Service records should still exist
        $this->assertDatabaseHas('service_records', ['id' => $serviceRecord->id]);
    }
}
