<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductTest extends TestCase
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
        
        $this->warehouse = Warehouse::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $this->category = Category::factory()->create([
            'account_id' => $this->account->id
        ]);
    }

    public function test_products_index_page_displays(): void
    {
        $this->actingAs($this->user);
        
        Product::factory()->count(3)->create([
            'account_id' => $this->account->id
        ]);
        
        $response = $this->get(route('products.index'));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Index')
            ->has('products')
        );
    }

    public function test_product_create_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $response = $this->get(route('products.create'));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Create')
            ->has('categories')
            ->has('warehouses')
        );
    }

    public function test_product_can_be_created(): void
    {
        $this->actingAs($this->user);
        
        $productData = [
            'name' => 'Test məhsulu',
            'sku' => 'TEST-001',
            'category_id' => $this->category->id,
            'type' => 'product',
            'unit' => 'pcs',
            'allow_negative_stock' => false,
            'purchase_price' => 100.00,
            'sale_price' => 150.00,
            'initial_stock' => [
                [
                    'warehouse_id' => $this->warehouse->id,
                    'quantity' => 50,
                    'min_level' => 10
                ]
            ]
        ];
        
        $response = $this->post(route('products.store'), $productData);
        
        $response->assertRedirect();
        
        $this->assertDatabaseHas('products', [
            'account_id' => $this->account->id,
            'name' => 'Test məhsulu',
            'sku' => 'TEST-001',
            'category_id' => $this->category->id,
        ]);
        
        $this->assertDatabaseHas('product_stock', [
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 50,
            'min_level' => 10,
        ]);
    }

    public function test_product_edit_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $product = Product::factory()->create([
            'account_id' => $this->account->id,
            'category_id' => $this->category->id
        ]);
        
        $response = $this->get(route('products.edit', $product));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Edit')
            ->has('product')
            ->has('categories')
            ->has('warehouses')
        );
    }

    public function test_product_can_be_updated(): void
    {
        $this->actingAs($this->user);
        
        $product = Product::factory()->create([
            'account_id' => $this->account->id,
            'category_id' => $this->category->id
        ]);
        
        $updateData = [
            'name' => 'Yenilənmiş məhsul',
            'sku' => $product->sku,
            'category_id' => $this->category->id,
            'type' => 'product',
            'unit' => 'pcs',
            'purchase_price' => 100.00,
            'sale_price' => 150.00,
            'allow_negative_stock' => true,
        ];
        
        $response = $this->put(route('products.update', $product), $updateData);
        
        $response->assertRedirect();
        
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Yenilənmiş məhsul',
            'allow_negative_stock' => true,
        ]);
    }

    public function test_product_show_page_displays(): void
    {
        $this->actingAs($this->user);
        
        $product = Product::factory()->create([
            'account_id' => $this->account->id,
            'category_id' => $this->category->id
        ]);
        
        $response = $this->get(route('products.show', $product));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Show')
            ->has('product')
        );
    }

    public function test_product_search_works(): void
    {
        $this->actingAs($this->user);
        
        Product::factory()->create([
            'account_id' => $this->account->id,
            'name' => 'Test məhsulu',
            'sku' => 'TEST-001'
        ]);
        
        $response = $this->get(route('products.search') . '?q=Test');
        
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Test məhsulu']);
    }

    public function test_barcode_can_be_generated(): void
    {
        $this->actingAs($this->user);
        
        $response = $this->post(route('products.generate-barcode'), [
            'type' => 'Code-128'
        ]);
        
        $response->assertStatus(200);
        $response->assertJsonStructure(['barcode']);
        $response->assertJson(fn ($json) => 
            $json->has('barcode') 
                 ->where('barcode', fn ($barcode) => !empty($barcode))
        );
    }

    public function test_unauthorized_user_cannot_access_product(): void
    {
        $otherAccount = Account::factory()->create();
        $otherUser = User::factory()->create([
            'account_id' => $otherAccount->id
        ]);
        
        $product = Product::factory()->create([
            'account_id' => $this->account->id
        ]);
        
        $this->actingAs($otherUser);
        
        $response = $this->get(route('products.show', $product));
        
        $response->assertStatus(404);
    }
}