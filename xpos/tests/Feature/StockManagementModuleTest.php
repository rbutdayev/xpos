<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Employee;
use App\Models\Supplier;
use App\Models\StockMovement;
use App\Models\WarehouseTransfer;
use App\Models\ProductReturn;
use App\Models\MinMaxAlert;
use App\Models\ProductStock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockManagementModuleTest extends TestCase
{
    use RefreshDatabase;

    protected Account $account;
    protected Account $otherAccount;
    protected User $user;
    protected User $otherUser;
    protected Product $product;
    protected Warehouse $warehouse1;
    protected Warehouse $warehouse2;
    protected Employee $employee;
    protected Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test accounts
        $this->account = Account::factory()->create();
        $this->otherAccount = Account::factory()->create();

        // Create test users
        $this->user = User::factory()->create([
            'account_id' => $this->account->id,
            'role' => 'admin'
        ]);
        
        $this->otherUser = User::factory()->create([
            'account_id' => $this->otherAccount->id,
            'role' => 'admin'
        ]);

        // Create test resources
        $this->product = Product::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Test Product'
        ]);

        $this->warehouse1 = Warehouse::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Main Warehouse'
        ]);

        $this->warehouse2 = Warehouse::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Secondary Warehouse'
        ]);

        $this->employee = Employee::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Test Employee'
        ]);

        $this->supplier = Supplier::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Test Supplier'
        ]);
    }

    /** @test */
    public function test_user_can_view_stock_movements_index()
    {
        $this->actingAs($this->user);

        $response = $this->get('/stock-movements');

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('StockMovements/Index');
        });
    }

    /** @test */
    public function test_user_can_create_stock_movement()
    {
        $this->actingAs($this->user);

        $movementData = [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'daxil_olma',
            'quantity' => 100,
            'unit_cost' => 10.50,
            'employee_id' => $this->employee->employee_id,
            'notes' => 'Initial stock entry'
        ];

        $response = $this->post('/stock-movements', $movementData);

        $response->assertRedirect('/stock-movements');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('stock_movements', [
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'daxil_olma',
            'quantity' => 100,
            'unit_cost' => 10.50
        ]);
    }

    /** @test */
    public function test_stock_movement_updates_product_stock()
    {
        $this->actingAs($this->user);

        $movementData = [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'daxil_olma',
            'quantity' => 100,
            'unit_cost' => 10.50,
            'employee_id' => $this->employee->employee_id,
            'notes' => 'Initial stock entry'
        ];

        $this->post('/stock-movements', $movementData);

        $stock = ProductStock::where([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
        ])->first();

        $this->assertNotNull($stock);
        $this->assertEquals(100, $stock->quantity);

        // Test outbound movement
        $outboundData = [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'xaric_olma',
            'quantity' => 30,
            'unit_cost' => 10.50,
            'employee_id' => $this->employee->employee_id,
            'notes' => 'Sale'
        ];

        $this->post('/stock-movements', $outboundData);

        $stock->refresh();
        $this->assertEquals(70, $stock->quantity);
    }

    /** @test */
    public function test_user_cannot_access_other_account_stock_movements()
    {
        // Create movement for first account
        $movement = StockMovement::factory()->create([
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
        ]);

        // Try to access as other account user
        $this->actingAs($this->otherUser);

        $response = $this->get("/stock-movements/{$movement->movement_id}");
        $response->assertStatus(403);
    }

    /** @test */
    public function test_user_can_create_warehouse_transfer()
    {
        $this->actingAs($this->user);

        // Create initial stock
        ProductStock::create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'quantity' => 100,
            'min_level' => 10
        ]);

        $transferData = [
            'from_warehouse_id' => $this->warehouse1->id,
            'to_warehouse_id' => $this->warehouse2->id,
            'product_id' => $this->product->id,
            'quantity' => 50,
            'requested_by' => $this->employee->employee_id,
            'notes' => 'Stock redistribution'
        ];

        $response = $this->post('/warehouse-transfers', $transferData);

        $response->assertRedirect('/warehouse-transfers');
        $this->assertDatabaseHas('warehouse_transfers', [
            'account_id' => $this->account->id,
            'from_warehouse_id' => $this->warehouse1->id,
            'to_warehouse_id' => $this->warehouse2->id,
            'product_id' => $this->product->id,
            'quantity' => 50,
            'status' => 'gozlemede'
        ]);
    }

    /** @test */
    public function test_warehouse_transfer_workflow()
    {
        $this->actingAs($this->user);

        $transfer = WarehouseTransfer::factory()->create([
            'account_id' => $this->account->id,
            'from_warehouse_id' => $this->warehouse1->id,
            'to_warehouse_id' => $this->warehouse2->id,
            'product_id' => $this->product->id,
            'quantity' => 50,
            'status' => 'gozlemede',
            'requested_by' => $this->employee->employee_id
        ]);

        // Approve transfer
        $response = $this->patch("/warehouse-transfers/{$transfer->transfer_id}/approve", [
            'approved_by' => $this->employee->employee_id
        ]);

        $response->assertRedirect();
        $transfer->refresh();
        $this->assertEquals('tesdiq_edilib', $transfer->status);

        // Complete transfer
        $response = $this->patch("/warehouse-transfers/{$transfer->transfer_id}/complete");
        
        $response->assertRedirect();
        $transfer->refresh();
        $this->assertEquals('tamamlanib', $transfer->status);
        $this->assertNotNull($transfer->completed_at);
    }

    /** @test */
    public function test_user_can_create_product_return()
    {
        $this->actingAs($this->user);

        $returnData = [
            'supplier_id' => $this->supplier->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'quantity' => 10,
            'unit_cost' => 15.00,
            'return_date' => now()->format('Y-m-d'),
            'reason' => 'Defective items',
            'requested_by' => $this->employee->employee_id
        ];

        $response = $this->post('/product-returns', $returnData);

        $response->assertRedirect('/product-returns');
        $this->assertDatabaseHas('product_returns', [
            'account_id' => $this->account->id,
            'supplier_id' => $this->supplier->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'status' => 'gozlemede'
        ]);
    }

    /** @test */
    public function test_product_return_workflow()
    {
        $this->actingAs($this->user);

        $return = ProductReturn::factory()->create([
            'account_id' => $this->account->id,
            'supplier_id' => $this->supplier->id,
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'quantity' => 10,
            'unit_cost' => 15.00,
            'total_cost' => 150.00,
            'status' => 'gozlemede',
            'requested_by' => $this->employee->employee_id
        ]);

        // Approve return
        $response = $this->patch("/product-returns/{$return->return_id}/approve", [
            'approved_by' => $this->employee->employee_id
        ]);

        $response->assertRedirect();
        $return->refresh();
        $this->assertEquals('tesdiq_edilib', $return->status);

        // Send to supplier
        $response = $this->patch("/product-returns/{$return->return_id}/send");
        
        $response->assertRedirect();
        $return->refresh();
        $this->assertEquals('gonderildi', $return->status);

        // Complete return
        $response = $this->patch("/product-returns/{$return->return_id}/complete", [
            'refund_amount' => 140.00,
            'supplier_response' => 'Refund processed'
        ]);
        
        $response->assertRedirect();
        $return->refresh();
        $this->assertEquals('tamamlanib', $return->status);
        $this->assertEquals(140.00, $return->refund_amount);
    }

    /** @test */
    public function test_min_max_alert_creation()
    {
        $this->actingAs($this->user);

        // Create stock below minimum level
        $stock = ProductStock::create([
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse1->id,
            'quantity' => 5,
            'min_level' => 10
        ]);

        $alertData = [
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'current_stock' => 5,
            'min_level' => 10,
            'alert_type' => 'min_level',
            'status' => 'aktiv'
        ];

        $alert = MinMaxAlert::create($alertData);

        $this->assertDatabaseHas('min_max_alerts', [
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'alert_type' => 'min_level',
            'status' => 'aktiv'
        ]);
    }

    /** @test */
    public function test_alert_can_be_resolved()
    {
        $this->actingAs($this->user);

        $alert = MinMaxAlert::factory()->create([
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'status' => 'aktiv'
        ]);

        $response = $this->patch("/alerts/{$alert->alert_id}/resolve", [
            'resolution_notes' => 'Stock replenished'
        ]);

        $response->assertRedirect();
        $alert->refresh();
        $this->assertEquals('helli_edildi', $alert->status);
        $this->assertNotNull($alert->resolved_at);
    }

    /** @test */
    public function test_search_functionality_works()
    {
        $this->actingAs($this->user);

        // Create test movements
        $movement1 = StockMovement::factory()->create([
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'daxil_olma'
        ]);

        $response = $this->get('/stock-movements?search=' . $this->product->name);
        $response->assertOk();

        $response = $this->get('/stock-movements?movement_type=daxil_olma');
        $response->assertOk();

        $response = $this->get('/stock-movements?warehouse_id=' . $this->warehouse1->id);
        $response->assertOk();
    }

    /** @test */
    public function test_multi_tenant_isolation()
    {
        // Create movements for both accounts
        $movement1 = StockMovement::factory()->create([
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
        ]);

        $otherProduct = Product::factory()->create([
            'account_id' => $this->otherAccount->id
        ]);
        $otherWarehouse = Warehouse::factory()->create([
            'account_id' => $this->otherAccount->id
        ]);
        
        $movement2 = StockMovement::factory()->create([
            'account_id' => $this->otherAccount->id,
            'warehouse_id' => $otherWarehouse->id,
            'product_id' => $otherProduct->id,
        ]);

        // Test first user can only see their movements
        $this->actingAs($this->user);
        $response = $this->get('/stock-movements');
        $response->assertOk();

        // Test second user can only see their movements
        $this->actingAs($this->otherUser);
        $response = $this->get('/stock-movements');
        $response->assertOk();

        // Verify data isolation
        $userMovements = StockMovement::byAccount($this->account->id)->get();
        $this->assertCount(1, $userMovements);
        $this->assertEquals($movement1->movement_id, $userMovements->first()->movement_id);

        $otherUserMovements = StockMovement::byAccount($this->otherAccount->id)->get();
        $this->assertCount(1, $otherUserMovements);
        $this->assertEquals($movement2->movement_id, $otherUserMovements->first()->movement_id);
    }

    /** @test */
    public function test_authorization_policies()
    {
        $movement = StockMovement::factory()->create([
            'account_id' => $this->account->id,
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
        ]);

        // Test user can access their own account's movements
        $this->actingAs($this->user);
        $response = $this->get("/stock-movements/{$movement->movement_id}");
        $response->assertOk();

        // Test user cannot access other account's movements
        $this->actingAs($this->otherUser);
        $response = $this->get("/stock-movements/{$movement->movement_id}");
        $response->assertStatus(403);
    }

    /** @test */
    public function test_validation_rules()
    {
        $this->actingAs($this->user);

        // Test required fields
        $response = $this->post('/stock-movements', []);
        $response->assertSessionHasErrors(['warehouse_id', 'product_id', 'movement_type', 'quantity']);

        // Test invalid movement type
        $response = $this->post('/stock-movements', [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'invalid_type',
            'quantity' => 10
        ]);
        $response->assertSessionHasErrors(['movement_type']);

        // Test negative quantity
        $response = $this->post('/stock-movements', [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'daxil_olma',
            'quantity' => -5
        ]);
        $response->assertSessionHasErrors(['quantity']);
    }
}