<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Branch;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Account $account;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->account = Account::factory()->create();
        $this->user = User::factory()->create([
            'account_id' => $this->account->id,
            'role' => 'account_owner'
        ]);
    }

    public function test_warehouse_index_page_displays()
    {
        $warehouse = Warehouse::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Test Warehouse',
            'type' => 'main'
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('warehouses.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Warehouse/Index')
                ->has('warehouses', 1)
                ->where('warehouses.0.name', 'Test Warehouse')
            );
    }

    public function test_warehouse_can_be_created()
    {
        $branch = Branch::factory()->create([
            'account_id' => $this->account->id
        ]);

        $warehouseData = [
            'name' => 'New Warehouse',
            'type' => 'auxiliary',
            'location' => 'Test Location',
            'description' => 'Test Description',
            'allow_negative_stock' => false,
            'branch_permissions' => [
                [
                    'branch_id' => $branch->id,
                    'can_transfer' => true,
                    'can_view_stock' => true,
                    'can_modify_stock' => false,
                    'can_receive_stock' => true,
                    'can_issue_stock' => false
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->post(route('warehouses.store'), $warehouseData);

        $response->assertRedirect(route('warehouses.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('warehouses', [
            'account_id' => $this->account->id,
            'name' => 'New Warehouse',
            'type' => 'auxiliary',
            'location' => 'Test Location'
        ]);

        $this->assertDatabaseHas('warehouse_branch_access', [
            'branch_id' => $branch->id,
            'can_transfer' => true,
            'can_view_stock' => true,
            'can_modify_stock' => false
        ]);
    }

    public function test_warehouse_show_page_displays()
    {
        $warehouse = Warehouse::factory()->create([
            'account_id' => $this->account->id
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('warehouses.show', $warehouse));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Warehouse/Show')
                ->where('warehouse.id', $warehouse->id)
            );
    }

    public function test_warehouse_can_be_updated()
    {
        $warehouse = Warehouse::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Old Name'
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'type' => 'mobile',
            'location' => 'Updated Location',
            'description' => 'Updated Description',
            'allow_negative_stock' => true,
            'is_active' => true
        ];

        $response = $this->actingAs($this->user)
            ->patch(route('warehouses.update', $warehouse), $updateData);

        $response->assertRedirect(route('warehouses.show', $warehouse))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('warehouses', [
            'id' => $warehouse->id,
            'name' => 'Updated Name',
            'type' => 'mobile',
            'location' => 'Updated Location'
        ]);
    }

    public function test_warehouse_can_be_deleted()
    {
        $warehouse = Warehouse::factory()->create([
            'account_id' => $this->account->id
        ]);

        $response = $this->actingAs($this->user)
            ->delete(route('warehouses.destroy', $warehouse));

        $response->assertRedirect(route('warehouses.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('warehouses', [
            'id' => $warehouse->id
        ]);
    }

    public function test_warehouse_create_page_displays()
    {
        $branch = Branch::factory()->create([
            'account_id' => $this->account->id
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('warehouses.create'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Warehouse/Create')
                ->has('branches', 1)
            );
    }

    public function test_warehouse_edit_page_displays()
    {
        $warehouse = Warehouse::factory()->create([
            'account_id' => $this->account->id
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('warehouses.edit', $warehouse));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Warehouse/Edit')
                ->where('warehouse.id', $warehouse->id)
                ->has('branches')
            );
    }

    public function test_unauthorized_user_cannot_access_other_account_warehouse()
    {
        // Create another account and warehouse
        $otherAccount = Account::factory()->create();
        $otherWarehouse = Warehouse::factory()->create([
            'account_id' => $otherAccount->id
        ]);

        // The global scope will cause 404 since warehouse won't be found for this account
        // This is the correct multi-tenant behavior
        $response = $this->actingAs($this->user)
            ->get(route('warehouses.show', $otherWarehouse));

        $response->assertStatus(404);
    }

    public function test_warehouse_validates_required_fields()
    {
        $response = $this->actingAs($this->user)
            ->post(route('warehouses.store'), []);

        $response->assertSessionHasErrors(['name', 'type']);
    }

    public function test_warehouse_validates_type_field()
    {
        $response = $this->actingAs($this->user)
            ->post(route('warehouses.store'), [
                'name' => 'Test',
                'type' => 'invalid_type'
            ]);

        $response->assertSessionHasErrors(['type']);
    }
}