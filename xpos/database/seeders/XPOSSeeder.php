<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\User;
use App\Models\Branch;
use App\Models\Warehouse;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductStock;
use App\Models\Customer;
use App\Models\CustomerItem;
use App\Models\TailorService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class XPOSSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates comprehensive test data for XPOS system including:
     * - 2 test accounts (Account A, Account B)
     * - Admin users for each account
     * - 2 branches per account
     * - 2 warehouses per account
     * - 5 product categories (T-Shirts, Jeans, Dresses, Jackets, Suits)
     * - 10 products per account
     * - 5-10 variants per product (Size × Color matrix)
     * - 5 customers per account
     * - 3 customer items per customer
     * - 2-3 tailor services per account
     * - Initial stock for all variants
     */
    public function run(): void
    {
        echo "🚀 Starting XPOS Seeder...\n\n";

        // Create Account A
        echo "📦 Creating Account A...\n";
        $accountA = $this->createAccount('Boutique Shop A', 'boutique-a@example.com', '+994501111111');
        $userA = $this->createAdminUser($accountA, 'Admin A', 'admin-a@example.com');
        [$branchA1, $branchA2] = $this->createBranches($accountA);
        [$warehouseA1, $warehouseA2] = $this->createWarehouses($accountA);
        $categoriesA = $this->createCategories($accountA);
        $productsA = $this->createProducts($accountA, $categoriesA);
        $this->createVariantsAndStock($accountA, $productsA, $warehouseA1, $warehouseA2);
        $customersA = $this->createCustomers($accountA);
        $this->createCustomerItems($accountA, $customersA);
        $this->createTailorServices($accountA, $customersA, $branchA1, $userA);

        echo "✅ Account A complete!\n\n";

        // Create Account B
        echo "📦 Creating Account B...\n";
        $accountB = $this->createAccount('Fashion Store B', 'fashion-b@example.com', '+994502222222');
        $userB = $this->createAdminUser($accountB, 'Admin B', 'admin-b@example.com');
        [$branchB1, $branchB2] = $this->createBranches($accountB);
        [$warehouseB1, $warehouseB2] = $this->createWarehouses($accountB);
        $categoriesB = $this->createCategories($accountB);
        $productsB = $this->createProducts($accountB, $categoriesB);
        $this->createVariantsAndStock($accountB, $productsB, $warehouseB1, $warehouseB2);
        $customersB = $this->createCustomers($accountB);
        $this->createCustomerItems($accountB, $customersB);
        $this->createTailorServices($accountB, $customersB, $branchB1, $userB);

        echo "✅ Account B complete!\n\n";

        echo "🎉 XPOS Seeder completed successfully!\n";
        echo "📊 Summary:\n";
        echo "   - 2 Accounts\n";
        echo "   - 2 Admin users\n";
        echo "   - 4 Branches (2 per account)\n";
        echo "   - 4 Warehouses (2 per account)\n";
        echo "   - 10 Categories (5 per account)\n";
        echo "   - 20 Products (10 per account)\n";
        echo "   - ~120 Product Variants (6 per product × 20 products)\n";
        echo "   - ~240 Stock records (per variant per warehouse)\n";
        echo "   - 10 Customers (5 per account)\n";
        echo "   - 30 Customer Items (3 per customer)\n";
        echo "   - 6 Tailor Services (3 per account)\n";
    }

    /**
     * Create an account
     */
    private function createAccount(string $name, string $email, string $phone): Account
    {
        return Account::create([
            'company_name' => $name,
            'email' => $email,
            'phone' => $phone,
            'address' => 'Baku, Azerbaijan',
            'subscription_plan' => 'professional',
            'language' => 'az',
            'is_active' => true,
            'settings' => [
                'currency' => 'AZN',
                'timezone' => 'Asia/Baku',
                'date_format' => 'd/m/Y',
            ],
        ]);
    }

    /**
     * Create admin user for account
     */
    private function createAdminUser(Account $account, string $name, string $email): User
    {
        return User::create([
            'account_id' => $account->id,
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'phone' => $account->phone,
            'position' => 'Administrator',
            'hire_date' => now()->subMonths(6),
            'branch_id' => null, // Will be set after branches are created
            'permissions' => [
                'manage_users' => true,
                'manage_products' => true,
                'manage_sales' => true,
                'manage_inventory' => true,
                'manage_reports' => true,
                'manage_settings' => true,
            ],
        ]);
    }

    /**
     * Create branches for account
     */
    private function createBranches(Account $account): array
    {
        $branch1 = Branch::create([
            'account_id' => $account->id,
            'name' => "{$account->company_name} - Main Branch",
            'address' => '28 May Street, Baku',
            'phone' => $account->phone,
            'email' => $account->email,
            'is_main' => true,
            'is_active' => true,
            'working_hours' => [
                'monday' => ['open' => '09:00', 'close' => '19:00'],
                'tuesday' => ['open' => '09:00', 'close' => '19:00'],
                'wednesday' => ['open' => '09:00', 'close' => '19:00'],
                'thursday' => ['open' => '09:00', 'close' => '19:00'],
                'friday' => ['open' => '09:00', 'close' => '19:00'],
                'saturday' => ['open' => '10:00', 'close' => '18:00'],
                'sunday' => ['open' => '11:00', 'close' => '17:00'],
            ],
        ]);

        $branch2 = Branch::create([
            'account_id' => $account->id,
            'name' => "{$account->company_name} - Branch 2",
            'address' => 'Nizami Street, Baku',
            'phone' => str_replace('111', '112', $account->phone),
            'email' => str_replace('@', '-branch2@', $account->email),
            'is_main' => false,
            'is_active' => true,
            'working_hours' => [
                'monday' => ['open' => '10:00', 'close' => '20:00'],
                'tuesday' => ['open' => '10:00', 'close' => '20:00'],
                'wednesday' => ['open' => '10:00', 'close' => '20:00'],
                'thursday' => ['open' => '10:00', 'close' => '20:00'],
                'friday' => ['open' => '10:00', 'close' => '20:00'],
                'saturday' => ['open' => '10:00', 'close' => '18:00'],
                'sunday' => ['open' => '11:00', 'close' => '17:00'],
            ],
        ]);

        return [$branch1, $branch2];
    }

    /**
     * Create warehouses for account
     */
    private function createWarehouses(Account $account): array
    {
        $warehouse1 = Warehouse::create([
            'account_id' => $account->id,
            'name' => "{$account->company_name} - Main Warehouse",
            'type' => 'main',
            'location' => 'Baku Industrial Zone',
            'is_active' => true,
            'description' => 'Main warehouse for inventory storage',
            'settings' => [
                'capacity' => 10000,
                'temperature_controlled' => false,
            ],
        ]);

        $warehouse2 = Warehouse::create([
            'account_id' => $account->id,
            'name' => "{$account->company_name} - Auxiliary Warehouse",
            'type' => 'auxiliary',
            'location' => 'Sumgait District',
            'is_active' => true,
            'description' => 'Auxiliary warehouse for overflow storage',
            'settings' => [
                'capacity' => 5000,
                'temperature_controlled' => false,
            ],
        ]);

        return [$warehouse1, $warehouse2];
    }

    /**
     * Create product categories
     */
    private function createCategories(Account $account): array
    {
        $categories = [
            'T-Shirts' => 'Casual and formal t-shirts',
            'Jeans' => 'Denim jeans in various styles',
            'Dresses' => 'Women\'s dresses for all occasions',
            'Jackets' => 'Jackets and outerwear',
            'Suits' => 'Formal suits and business wear',
        ];

        $result = [];
        $sortOrder = 1;

        foreach ($categories as $name => $description) {
            $result[] = Category::create([
                'account_id' => $account->id,
                'name' => $name,
                'description' => $description,
                'parent_id' => null,
                'is_service' => false,
                'is_active' => true,
                'sort_order' => $sortOrder++,
            ]);
        }

        return $result;
    }

    /**
     * Create products
     */
    private function createProducts(Account $account, array $categories): array
    {
        $products = [
            ['name' => 'Cotton T-Shirt', 'category' => 0, 'price' => 25.00, 'type' => 'product'],
            ['name' => 'Premium Polo Shirt', 'category' => 0, 'price' => 45.00, 'type' => 'product'],
            ['name' => 'Slim Fit Jeans', 'category' => 1, 'price' => 85.00, 'type' => 'product'],
            ['name' => 'Classic Straight Jeans', 'category' => 1, 'price' => 75.00, 'type' => 'product'],
            ['name' => 'Summer Floral Dress', 'category' => 2, 'price' => 120.00, 'type' => 'product'],
            ['name' => 'Evening Cocktail Dress', 'category' => 2, 'price' => 180.00, 'type' => 'product'],
            ['name' => 'Leather Jacket', 'category' => 3, 'price' => 250.00, 'type' => 'product'],
            ['name' => 'Denim Jacket', 'category' => 3, 'price' => 95.00, 'type' => 'product'],
            ['name' => 'Business Suit', 'category' => 4, 'price' => 350.00, 'type' => 'product'],
            ['name' => 'Casual Blazer', 'category' => 4, 'price' => 180.00, 'type' => 'product'],
        ];

        $result = [];

        foreach ($products as $productData) {
            $result[] = Product::create([
                'account_id' => $account->id,
                'name' => $productData['name'],
                'category_id' => $categories[$productData['category']]->id,
                'type' => $productData['type'],
                'purchase_price' => $productData['price'] * 0.6, // 40% margin
                'sale_price' => $productData['price'],
                'sku' => strtoupper(substr($productData['name'], 0, 3)) . '-' . rand(1000, 9999),
                'barcode' => $account->id . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT),
                'barcode_type' => 'Code-128',
                'has_custom_barcode' => false,
                'description' => 'High quality ' . strtolower($productData['name']),
                'unit' => 'pcs',
                'is_active' => true,
                'allow_negative_stock' => false,
            ]);
        }

        return $result;
    }

    /**
     * Create product variants and stock
     */
    private function createVariantsAndStock(Account $account, array $products, Warehouse $warehouse1, Warehouse $warehouse2): void
    {
        $sizes = ['S', 'M', 'L', 'XL'];
        $colors = [
            'Red' => '#FF0000',
            'Blue' => '#0000FF',
            'Black' => '#000000',
            'White' => '#FFFFFF',
            'Green' => '#008000',
            'Navy' => '#000080',
        ];

        $variantCount = 0;
        $stockCount = 0;

        foreach ($products as $product) {
            // Create 4 sizes × 3 random colors = 12 variants per product (reduced for performance)
            $selectedColorNames = array_rand($colors, 3);
            if (!is_array($selectedColorNames)) {
                $selectedColorNames = [$selectedColorNames];
            }

            foreach ($sizes as $size) {
                foreach ($selectedColorNames as $colorName) {
                    $colorCode = $colors[$colorName];

                    // Create variant
                    $variant = ProductVariant::create([
                        'account_id' => $account->id,
                        'product_id' => $product->id,
                        'size' => $size,
                        'color' => $colorName,
                        'color_code' => $colorCode,
                        'sku' => $product->sku . '-' . $size . '-' . strtoupper(substr($colorName, 0, 3)),
                        'barcode' => $account->id . str_pad($variantCount + rand(10000, 99999), 9, '0', STR_PAD_LEFT),
                        'price_adjustment' => 0.00,
                        'is_active' => true,
                    ]);

                    $variantCount++;

                    // Create stock in warehouse 1 (higher quantity)
                    ProductStock::create([
                        'account_id' => $account->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'warehouse_id' => $warehouse1->id,
                        'quantity' => rand(10, 50),
                        'reserved_quantity' => 0,
                        'min_level' => 5,
                        'max_level' => 100,
                        'reorder_point' => 10,
                        'reorder_quantity' => 20,
                    ]);

                    $stockCount++;

                    // Create stock in warehouse 2 (lower quantity)
                    ProductStock::create([
                        'account_id' => $account->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'warehouse_id' => $warehouse2->id,
                        'quantity' => rand(5, 25),
                        'reserved_quantity' => 0,
                        'min_level' => 3,
                        'max_level' => 50,
                        'reorder_point' => 5,
                        'reorder_quantity' => 15,
                    ]);

                    $stockCount++;
                }
            }
        }

        echo "   ✓ Created {$variantCount} variants and {$stockCount} stock records\n";
    }

    /**
     * Create customers
     */
    private function createCustomers(Account $account): array
    {
        $customers = [
            ['name' => 'Ali Mammadov', 'type' => 'individual', 'phone' => '+994503334444'],
            ['name' => 'Leyla Hasanova', 'type' => 'individual', 'phone' => '+994503334445'],
            ['name' => 'Rashad Aliyev', 'type' => 'individual', 'phone' => '+994503334446'],
            ['name' => 'Aysel Huseynova', 'type' => 'individual', 'phone' => '+994503334447'],
            ['name' => 'Fashion LLC', 'type' => 'corporate', 'phone' => '+994503334448'],
        ];

        $result = [];

        foreach ($customers as $customerData) {
            $result[] = Customer::create([
                'account_id' => $account->id,
                'name' => $customerData['name'],
                'customer_type' => $customerData['type'],
                'phone' => $customerData['phone'],
                'email' => strtolower(str_replace(' ', '.', $customerData['name'])) . '@example.com',
                'address' => 'Baku, Azerbaijan',
                'is_active' => true,
                'notes' => 'Test customer',
            ]);
        }

        return $result;
    }

    /**
     * Create customer items
     */
    private function createCustomerItems(Account $account, array $customers): void
    {
        $itemTypes = ['Jacket', 'Dress', 'Suit', 'Coat', 'Shirt', 'Pants'];
        $fabrics = ['Cotton', 'Wool', 'Leather', 'Polyester', 'Silk', 'Denim'];
        $colors = ['Black', 'Navy', 'Gray', 'Brown', 'Blue', 'White'];
        $sizes = ['S', 'M', 'L', 'XL', '38', '40', '42', '44'];

        $itemCount = 0;

        foreach ($customers as $customer) {
            // Create 3 items per customer
            for ($i = 0; $i < 3; $i++) {
                CustomerItem::create([
                    'account_id' => $account->id,
                    'customer_id' => $customer->id,
                    'item_type' => $itemTypes[array_rand($itemTypes)],
                    'fabric_type' => $fabrics[array_rand($fabrics)],
                    'color' => $colors[array_rand($colors)],
                    'size' => $sizes[array_rand($sizes)],
                    'received_date' => now()->subDays(rand(30, 365)),
                    'description' => 'Customer owned garment for tailoring',
                    'notes' => 'Test item - Handle with care',
                    'is_active' => true,
                ]);

                $itemCount++;
            }
        }

        echo "   ✓ Created {$itemCount} customer items\n";
    }

    /**
     * Create tailor services
     */
    private function createTailorServices(Account $account, array $customers, Branch $branch, User $user): void
    {
        $serviceTypes = ['alteration', 'repair', 'custom'];
        $statuses = ['pending', 'in_progress', 'completed'];

        $serviceCount = 0;

        // Create 3 services for the account
        for ($i = 0; $i < 3; $i++) {
            $customer = $customers[array_rand($customers)];
            $customerItems = CustomerItem::where('customer_id', $customer->id)->get();

            if ($customerItems->count() > 0) {
                $customerItem = $customerItems->random();
                $serviceType = $serviceTypes[array_rand($serviceTypes)];
                $status = $statuses[array_rand($statuses)];

                $laborTotal = rand(30, 150);
                $materialsTotal = rand(20, 100);
                $totalCost = $laborTotal + $materialsTotal;

                TailorService::create([
                    'account_id' => $account->id,
                    'customer_id' => $customer->id,
                    'customer_item_id' => $customerItem->id,
                    'branch_id' => $branch->id,
                    'employee_id' => $user->id,
                    'service_type' => $serviceType,
                    'description' => ucfirst($serviceType) . ' service for ' . $customerItem->item_type,
                    'customer_item_condition' => 'Good condition, minor wear',
                    'labor_total' => $laborTotal,
                    'materials_total' => $materialsTotal,
                    'total_cost' => $totalCost,
                    'service_date' => now()->subDays(rand(1, 30)),
                    'delivery_date' => now()->addDays(rand(3, 14)),
                    'status' => $status,
                    'payment_status' => 'paid',
                    'paid_amount' => $totalCost,
                    'credit_amount' => 0,
                    'started_at' => $status !== 'pending' ? now()->subDays(rand(1, 5)) : null,
                    'completed_at' => $status === 'completed' ? now()->subDays(rand(0, 3)) : null,
                    'notes' => 'Test service record',
                ]);

                $serviceCount++;
            }
        }

        echo "   ✓ Created {$serviceCount} tailor services\n";
    }
}
