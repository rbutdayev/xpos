<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // MULTI-TENANCY & AUTHENTICATION
        // =====================================================================

        // accounts table - root multi-tenant table
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->enum('subscription_plan', ['başlanğıc', 'professional', 'enterprise'])->default('başlanğıc');
            $table->string('language', 5)->default('az');
            $table->text('address')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->json('settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // subscriptions table
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->enum('plan_type', ['başlanğıc', 'professional', 'enterprise']);
            $table->decimal('price', 8, 2);
            $table->date('starts_at');
            $table->date('expires_at');
            $table->enum('status', ['active', 'expired', 'cancelled', 'suspended'])->default('active');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->json('features')->nullable();
            $table->timestamp('last_payment_at')->nullable();
            $table->timestamp('next_payment_at')->nullable();
            $table->timestamps();
        });

        // password reset tokens
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // sessions
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // =====================================================================
        // ORGANIZATIONAL STRUCTURE
        // =====================================================================

        // companies table
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('default_language', 5)->default('az');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();
            $table->json('business_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // branches table
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_main')->default(false);
            $table->json('working_hours')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // warehouses table
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['main', 'auxiliary', 'mobile'])->default('main');
            $table->text('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        // warehouse_branch_access table
        Schema::create('warehouse_branch_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->boolean('can_transfer')->default(true);
            $table->boolean('can_view_stock')->default(true);
            $table->boolean('can_modify_stock')->default(false);
            $table->boolean('can_receive_stock')->default(false);
            $table->boolean('can_issue_stock')->default(false);
            $table->timestamps();

            $table->unique(['warehouse_id', 'branch_id']);
        });

        // users table (includes employee data)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->nullable()->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', [
                'account_owner', 'admin', 'branch_manager', 'warehouse_manager',
                'sales_staff', 'cashier', 'accountant', 'tailor', 'support_user', 'super_admin'
            ])->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('phone')->nullable();
            $table->string('position')->nullable();
            $table->date('hire_date')->nullable();
            $table->decimal('hourly_rate', 8, 2)->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->json('permissions')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index('account_id');
        });

        // =====================================================================
        // PRODUCT & INVENTORY
        // =====================================================================

        // categories table
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->foreignId('parent_id')->nullable()->constrained('categories')->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_service')->default(false);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['account_id', 'parent_id']);
            $table->index(['account_id', 'is_service']);
        });

        // products table (master product data)
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->enum('barcode_type', ['EAN-13', 'UPC-A', 'Code-128', 'QR-Code'])->nullable();
            $table->boolean('has_custom_barcode')->default(false);
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->enum('type', ['product', 'service'])->default('product');
            $table->text('description')->nullable();
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->decimal('sale_price', 10, 2)->default(0);
            $table->string('unit')->default('pcs');
            // Packaging fields (to be cleaned up later)
            $table->string('packaging_size')->nullable();
            $table->string('base_unit')->nullable();
            $table->decimal('packaging_quantity', 10, 3)->nullable();
            $table->decimal('unit_price', 10, 4)->nullable();
            // Standard fields
            $table->boolean('allow_negative_stock')->default(false);
            $table->decimal('weight', 8, 3)->nullable();
            $table->string('dimensions')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->json('attributes')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['account_id', 'barcode']);
            $table->index(['account_id', 'type']);
            $table->index(['account_id', 'category_id']);
            $table->index(['account_id', 'barcode']);
            $table->index(['account_id', 'sku']);
        });

        // product_variants table - NEW FOR XPOS
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete(); 
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->string('size')->nullable();
            $table->string('color')->nullable();
            $table->string('color_code')->nullable()->comment('Hex color code for display');
            $table->json('attributes')->nullable()->comment('Other variant attributes (style, material, etc)');
            $table->decimal('price_adjustment', 10, 2)->default(0)->comment('Price difference from base product');
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();  
            $table->timestamps();

 
            $table->unique(['account_id', 'product_id', 'size', 'color'], 'unique_variant_per_account');
            $table->unique(['account_id', 'barcode'], 'unique_barcode_per_account');
            $table->unique(['account_id', 'sku'], 'unique_sku_per_account');

 
            $table->index(['account_id', 'product_id'], 'idx_variants_account_product');
            $table->index(['account_id', 'is_active'], 'idx_variants_account_active');
            $table->index(['product_id', 'is_active']);
        });

        // product_prices table
        Schema::create('product_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnDelete();
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->decimal('sale_price', 10, 2)->default(0);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('min_sale_price', 10, 2)->nullable();
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['product_id', 'branch_id']);
            $table->index(['product_id', 'effective_from', 'effective_until']);
        });

        // product_stock table - WITH VARIANT SUPPORT
        Schema::create('product_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3)->default(0);
            $table->decimal('reserved_quantity', 10, 3)->default(0);
            $table->decimal('min_level', 10, 3)->default(0);
            $table->decimal('max_level', 10, 3)->nullable();
            $table->decimal('reorder_point', 10, 3)->nullable();
            $table->decimal('reorder_quantity', 10, 3)->nullable();
            $table->string('location')->nullable();
            $table->date('last_counted_at')->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'product_id', 'warehouse_id', 'variant_id'], 'product_stock_unique');
            $table->index(['warehouse_id', 'quantity']);
        });

        // stock_history table - WITH VARIANT SUPPORT
        Schema::create('stock_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->decimal('quantity_before', 10, 3);
            $table->decimal('quantity_change', 10, 3);
            $table->decimal('quantity_after', 10, 3);
            $table->enum('type', ['daxil_olma', 'xaric_olma', 'transfer_in', 'transfer_out', 'adjustment', 'inventory']);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['product_id', 'warehouse_id', 'occurred_at']);
            $table->index(['reference_type', 'reference_id']);
        });

        // stock_movements table - WITH VARIANT SUPPORT
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id('movement_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->enum('movement_type', [
                'daxil_olma', 'xaric_olma', 'transfer', 'qaytarma',
                'itki_zerer', 'duzelis_artim', 'duzelis_azaltma'
            ]);
            $table->decimal('quantity', 10, 3);
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('employee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'warehouse_id', 'product_id']);
            $table->index(['account_id', 'movement_type']);
            $table->index(['account_id', 'created_at']);
        });

        // warehouse_transfers table - WITH VARIANT SUPPORT
        Schema::create('warehouse_transfers', function (Blueprint $table) {
            $table->id('transfer_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('from_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('to_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->enum('status', ['gozlemede', 'tesdiq_edilib', 'leyv_edilib', 'tamamlanib', 'imtina_edilib'])->default('gozlemede');
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('requested_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'status']);
            $table->index(['account_id', 'from_warehouse_id']);
            $table->index(['account_id', 'to_warehouse_id']);
            $table->index(['account_id', 'requested_at']);
        });

        // product_documents table
        Schema::create('product_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_type');
            $table->string('file_extension');
            $table->string('original_name');
            $table->bigInteger('file_size');
            $table->string('mime_type');
            $table->enum('document_type', [
                'qaimə', 'warranty', 'certificate', 'manual', 'photo', 'invoice', 'receipt', 'other'
            ])->default('other');
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['product_id', 'document_type']);
        });

        // barcode_sequences table
        Schema::create('barcode_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('prefix', 10);
            $table->bigInteger('current_number')->default(1);
            $table->string('format')->default('{prefix}{number:06}');
            $table->enum('barcode_type', ['EAN-13', 'UPC-A', 'Code-128'])->default('Code-128');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['account_id', 'prefix']);
        });

        // min_max_alerts table
        Schema::create('min_max_alerts', function (Blueprint $table) {
            $table->id('alert_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->integer('current_stock');
            $table->integer('min_level');
            $table->integer('max_level')->nullable();
            $table->enum('alert_type', ['min_level', 'max_level', 'zero_stock', 'min_max', 'negative_stock']);
            $table->enum('status', ['active', 'acknowledged', 'resolved'])->default('active');
            $table->timestamp('alert_date')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'warehouse_id', 'product_id']);
            $table->index(['account_id', 'alert_type', 'status']);
            $table->index(['account_id', 'alert_date']);
            $table->unique(['warehouse_id', 'product_id', 'alert_type', 'status'], 'unique_active_alert');
        });

        // =====================================================================
        // SUPPLIER MANAGEMENT (moved before product_returns to fix FK dependency)
        // =====================================================================

        // suppliers table
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('bank_name')->nullable();
            $table->integer('payment_terms_days')->default(0);
            $table->string('payment_terms_text')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['account_id', 'is_active']);
            $table->index(['account_id', 'name']);
        });

        // product_returns table - WITH VARIANT SUPPORT (moved here after suppliers)
        Schema::create('product_returns', function (Blueprint $table) {
            $table->id('return_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_cost', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->text('reason');
            $table->enum('status', ['gozlemede', 'tesdiq_edilib', 'gonderildi', 'tamamlanib', 'imtina_edilib'])->default('gozlemede');
            $table->date('return_date');
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('supplier_response')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->date('refund_date')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'supplier_id']);
            $table->index(['account_id', 'status']);
            $table->index(['account_id', 'return_date']);
        });

        // supplier_products table
        Schema::create('supplier_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->decimal('supplier_price', 10, 2);
            $table->string('supplier_sku')->nullable();
            $table->integer('lead_time_days')->default(0);
            $table->integer('minimum_order_quantity')->default(1);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_preferred')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['supplier_id', 'product_id']);
            $table->index(['product_id', 'is_active']);
            $table->index(['supplier_id', 'is_active']);
        });

        // supplier_credits table
        Schema::create('supplier_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->enum('type', ['credit', 'payment']);
            $table->decimal('amount', 15, 2);
            $table->decimal('remaining_amount', 15, 2)->default(0);
            $table->string('description')->nullable();
            $table->string('reference_number')->unique()->nullable();
            $table->date('credit_date');
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'partial', 'paid'])->default('pending');
            $table->foreignId('user_id')->constrained('users');
            $table->json('payment_history')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['supplier_id', 'status']);
            $table->index(['account_id', 'credit_date']);
            $table->index('reference_number');
        });

        // goods_receipts table - WITH VARIANT SUPPORT
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('employee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('supplier_credit_id')->nullable()->constrained('supplier_credits')->nullOnDelete();
            $table->string('receipt_number');
            $table->decimal('quantity', 10, 3);
            $table->string('unit', 50);
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->decimal('total_cost', 12, 2)->nullable();
            $table->enum('payment_status', ['paid', 'unpaid', 'partial'])->default('unpaid');
            $table->enum('payment_method', ['instant', 'credit'])->default('credit');
            $table->date('due_date')->nullable();
            $table->string('document_path')->nullable();
            $table->text('notes')->nullable();
            $table->json('additional_data')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'warehouse_id']);
            $table->index(['account_id', 'product_id']);
            $table->index(['account_id', 'supplier_id']);
            $table->index('receipt_number');
            $table->index('created_at');
        });

        // supplier_payments table
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->decimal('amount', 15, 2);
            $table->text('description');
            $table->date('payment_date');
            $table->string('payment_method')->default('nağd');
            $table->string('reference_number')->nullable();
            $table->string('invoice_number')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'payment_date']);
            $table->index(['account_id', 'supplier_id']);
        });

        // =====================================================================
        // CUSTOMER MANAGEMENT
        // =====================================================================

        // customers table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->date('birthday')->nullable();
            $table->enum('customer_type', ['individual', 'corporate'])->default('individual');
            $table->string('tax_number')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['account_id', 'is_active']);
            $table->index(['account_id', 'name']);
            $table->index(['account_id', 'phone']);
        });

        // customer_items table (replaces vehicles - for tailor services)
        Schema::create('customer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('item_type')->default('clothing')->comment('clothing, fabric, leather_goods, etc');
            $table->string('description');
            $table->string('size')->nullable()->comment('Size of clothing item (e.g., M, L, XL, 42)');  
            $table->string('color')->nullable();
            $table->string('fabric_type')->nullable();
            $table->json('measurements')->nullable()->comment('Customer measurements for tailoring');
            $table->text('notes')->nullable();
            $table->string('reference_number')->nullable();
            $table->date('received_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['account_id', 'customer_id']);
            $table->index(['account_id', 'is_active']);
        });

        // customer_credits table
        Schema::create('customer_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->enum('type', ['credit', 'payment'])->comment('credit = borc vermək, payment = borc ödəmək');
            $table->decimal('amount', 15, 2);
            $table->decimal('remaining_amount', 15, 2)->default(0);
            $table->string('description')->nullable();
            $table->string('reference_number')->unique()->nullable();
            $table->date('credit_date');
            $table->date('due_date')->nullable()->comment('Ödəniş tarixi');
            $table->enum('status', ['pending', 'partial', 'paid'])->default('pending');
            $table->foreignId('user_id')->constrained('users')->comment('Kimin tərəfindən yaradılıb');
            $table->json('payment_history')->nullable()->comment('Ödəmə tarixçəsi');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'status']);
            $table->index(['account_id', 'credit_date']);
            $table->index('reference_number');
        });

        // =====================================================================
        // SALES & POS
        // =====================================================================

        // sales table
        Schema::create('sales', function (Blueprint $table) {
            $table->id('sale_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('sale_number')->unique();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->enum('status', ['pending', 'completed', 'cancelled', 'refunded'])->default('pending');
            $table->boolean('has_negative_stock')->default(false);
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->boolean('is_credit_sale')->default(false);
            $table->enum('payment_status', ['paid', 'credit', 'partial'])->default('paid');
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('credit_amount', 15, 2)->default(0);
            $table->date('credit_due_date')->nullable();
            $table->foreignId('customer_credit_id')->nullable()->constrained('customer_credits')->nullOnDelete();
            $table->timestamp('sale_date');
            $table->timestamps();

            $table->index(['account_id', 'status']);
            $table->index(['account_id', 'sale_date']);
            $table->index('sale_number');
        });

        // sale_items table - WITH VARIANT SUPPORT
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->foreignId('sale_id')->constrained('sales', 'sale_id')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->decimal('stock_level_at_sale', 10, 3)->nullable();
            $table->timestamps();

            $table->index('sale_id');
            $table->index('product_id');
        });

        // payments table
        Schema::create('payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->foreignId('sale_id')->constrained('sales', 'sale_id')->cascadeOnDelete();
            $table->enum('method', ['nağd', 'kart', 'köçürmə', 'naxşiyyə']);
            $table->decimal('amount', 12, 2);
            $table->string('transaction_id')->nullable();
            $table->string('card_type')->nullable();
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('sale_id');
            $table->index('method');
            $table->index('transaction_id');
        });

        // =====================================================================
        // TAILOR SERVICE RECORDS (transformed from auto service)
        // =====================================================================

        // tailor_services table (renamed from service_records)
        Schema::create('tailor_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('customer_item_id')->nullable()->constrained('customer_items')->nullOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('employee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('service_number'); 
            $table->text('description');
            $table->enum('service_type', ['alteration', 'repair', 'custom'])->nullable()->comment('Type of tailor service');  
            $table->text('customer_item_condition')->nullable()->comment('Condition of item when received'); 
            $table->decimal('labor_total', 10, 2)->default(0)->comment('Total labor cost');  
            $table->decimal('materials_total', 10, 2)->default(0)->comment('Total cost of materials used');  
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->enum('payment_status', ['paid', 'credit', 'partial'])->default('paid');
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('credit_amount', 15, 2)->default(0);
            $table->date('credit_due_date')->nullable();
            $table->foreignId('customer_credit_id')->nullable()->constrained('customer_credits')->nullOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->date('service_date');
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('delivery_date')->nullable()->comment('Promised delivery date');  
            $table->text('notes')->nullable();
            $table->softDeletes(); 
            $table->timestamps();

         
            $table->unique(['account_id', 'service_number'], 'unique_service_number_per_account');

            $table->index(['account_id', 'status']);
            $table->index(['account_id', 'customer_id']);
            $table->index(['account_id', 'service_date']);
            $table->index('service_number');
        });

        // tailor_service_items table (renamed from service_items) - WITH VARIANT SUPPORT
        Schema::create('tailor_service_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tailor_service_id')->constrained('tailor_services')->cascadeOnDelete();
            $table->enum('item_type', ['product', 'service'])->default('product');
            $table->foreignId('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('service_id_ref')->nullable()->constrained('products')->cascadeOnDelete();
            $table->string('item_name')->nullable();
            $table->decimal('quantity', 8, 2);
            $table->decimal('base_quantity', 10, 3)->nullable()->comment('Base quantity for inventory deduction');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('tailor_service_id');
            $table->index('product_id');
        });

        // work_assignments table (for service work tracking)
        Schema::create('work_assignments', function (Blueprint $table) {
            $table->id('assignment_id');
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tailor_service_id')->constrained('tailor_services')->cascadeOnDelete();
            $table->decimal('hours_worked', 5, 2)->default(0);
            $table->decimal('labor_cost', 10, 2)->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'tailor_service_id']);
            $table->index('tailor_service_id');
        });

        // negative_stock_alerts table
        Schema::create('negative_stock_alerts', function (Blueprint $table) {
            $table->id('alert_id');
            $table->foreignId('sale_id')->nullable()->constrained('sales', 'sale_id')->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('tailor_services')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->integer('quantity_sold');
            $table->integer('stock_level');
            $table->string('message');
            $table->enum('status', ['active', 'acknowledged', 'resolved'])->default('active');
            $table->timestamp('alert_date');
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();

            $table->index('sale_id');
            $table->index('service_id');
            $table->index('product_id');
            $table->index('status');
        });

        // =====================================================================
        // EXPENSE & FINANCE
        // =====================================================================

        // expense_categories table
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id('category_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['maaş', 'xərclər', 'ödənişlər', 'kommunal', 'nəqliyyat', 'digər'])->default('xərclər');
            $table->foreignId('parent_id')->nullable()->constrained('expense_categories', 'category_id')->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['account_id', 'type']);
            $table->index(['account_id', 'parent_id']);
        });

        // expenses table
        Schema::create('expenses', function (Blueprint $table) {
            $table->id('expense_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('expense_categories', 'category_id');
            $table->decimal('amount', 15, 2);
            $table->text('description');
            $table->date('expense_date');
            $table->string('reference_number')->nullable();
            $table->string('payment_method')->default('nağd');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('supplier_payment_id')->nullable()->constrained('supplier_payments', 'payment_id')->nullOnDelete();
            $table->foreignId('supplier_credit_id')->nullable()->constrained('supplier_credits')->nullOnDelete();
            $table->decimal('credit_payment_amount', 15, 2)->nullable();
            $table->foreignId('goods_receipt_id')->nullable()->constrained('goods_receipts')->nullOnDelete();
            $table->string('receipt_file_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'expense_date']);
            $table->index(['account_id', 'category_id']);
            $table->index(['branch_id', 'expense_date']);
        });

        // employee_salaries table
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id('salary_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('users');
            $table->decimal('amount', 15, 2);
            $table->integer('month');
            $table->integer('year');
            $table->enum('status', ['hazırlanıb', 'ödənilib', 'gecikib'])->default('hazırlanıb');
            $table->date('payment_date')->nullable();
            $table->decimal('bonus_amount', 15, 2)->default(0);
            $table->decimal('deduction_amount', 15, 2)->default(0);
            $table->text('bonus_reason')->nullable();
            $table->text('deduction_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'employee_id', 'month', 'year']);
            $table->index(['account_id', 'year', 'month']);
        });

        // =====================================================================
        // REPORTING & ANALYTICS
        // =====================================================================

        // daily_summaries table
        Schema::create('daily_summaries', function (Blueprint $table) {
            $table->id('summary_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->decimal('total_revenue', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->decimal('gross_profit', 15, 2)->default(0);
            $table->integer('sales_count')->default(0);
            $table->integer('customers_served')->default(0);
            $table->integer('services_completed')->default(0);
            $table->decimal('service_revenue', 15, 2)->default(0);
            $table->integer('products_sold')->default(0);
            $table->decimal('cash_sales', 15, 2)->default(0);
            $table->decimal('card_sales', 15, 2)->default(0);
            $table->decimal('credit_sales', 15, 2)->default(0);
            $table->decimal('average_sale_value', 10, 2)->default(0);
            $table->timestamps();

            $table->unique(['account_id', 'branch_id', 'date']);
            $table->index(['account_id', 'date']);
            $table->index(['branch_id', 'date']);
        });

        // warehouse_daily_snapshots table
        Schema::create('warehouse_daily_snapshots', function (Blueprint $table) {
            $table->id('snapshot_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->date('date');
            $table->json('products_data');
            $table->integer('total_products')->default(0);
            $table->decimal('total_value', 15, 2)->default(0);
            $table->integer('low_stock_items')->default(0);
            $table->integer('out_of_stock_items')->default(0);
            $table->integer('negative_stock_items')->default(0);
            $table->timestamps();

            $table->unique(['account_id', 'warehouse_id', 'date']);
            $table->index(['account_id', 'date']);
            $table->index(['warehouse_id', 'date']);
        });

        // generated_reports table
        Schema::create('generated_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['sales', 'inventory', 'financial', 'customer', 'service']);
            $table->date('date_from');
            $table->date('date_to');
            $table->json('data')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'type']);
            $table->index('created_at');
        });

        // =====================================================================
        // CONFIGURATION & SETTINGS
        // =====================================================================

        // printer_configs table
        Schema::create('printer_configs', function (Blueprint $table) {
            $table->id('config_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('name');
            $table->enum('printer_type', ['thermal', 'impact', 'laser', 'inkjet'])->default('thermal');
            $table->enum('paper_size', ['58mm', '80mm', 'A4', 'letter'])->default('80mm');
            $table->string('connection_type')->default('usb');
            $table->string('ip_address')->nullable();
            $table->integer('port')->nullable();
            $table->json('settings')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['account_id', 'branch_id']);
            $table->index(['account_id', 'is_default']);
        });

        // receipt_templates table
        Schema::create('receipt_templates', function (Blueprint $table) {
            $table->id('template_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['sale', 'service', 'return', 'payment'])->default('sale');
            $table->text('template_content');
            $table->json('variables')->nullable();
            $table->enum('paper_size', ['58mm', '80mm', 'A4', 'letter'])->default('80mm');
            $table->integer('width_chars')->default(32);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'type']);
            $table->index(['account_id', 'is_default']);
        });

        // dashboard_widgets table
        Schema::create('dashboard_widgets', function (Blueprint $table) {
            $table->id('widget_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->integer('width')->default(4);
            $table->integer('height')->default(3);
            $table->json('config')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->integer('refresh_interval')->default(300);
            $table->timestamps();

            $table->index(['account_id', 'user_id']);
            $table->index(['account_id', 'type']);
        });

        // storage_settings table
        Schema::create('storage_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->boolean('encrypted')->default(true);
            $table->timestamps();
        });

        // =====================================================================
        // AUDIT & SECURITY
        // =====================================================================

        // audit_logs table
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('model_type');
            $table->string('model_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->text('description')->nullable();
            $table->string('session_id')->nullable();
            $table->string('device_type')->nullable();
            $table->json('geolocation')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'created_at']);
            $table->index(['account_id', 'user_id']);
            $table->index(['account_id', 'model_type', 'model_id']);
            $table->index('session_id');
        });

        // security_events table
        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->text('description');
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('accounts')->cascadeOnDelete();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('geolocation')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'severity']);
            $table->index('ip_address');
            $table->index('created_at');
        });

        // login_attempts table
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('ip_address');
            $table->boolean('success')->default(false);
            $table->text('user_agent')->nullable();
            $table->timestamp('attempted_at');
            $table->timestamps();

            $table->index(['ip_address', 'success']);
            $table->index(['email', 'attempted_at']);
            $table->index('attempted_at');
        });

        // blocked_ips table
        Schema::create('blocked_ips', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address')->unique();
            $table->text('reason');
            $table->boolean('is_permanent')->default(false);
            $table->timestamp('blocked_at');
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('blocked_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('ip_address');
            $table->index('expires_at');
            $table->index('blocked_at');
        });

        // =====================================================================
        // LARAVEL FRAMEWORK
        // =====================================================================

        // cache table
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        // cache_locks table
        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // jobs table
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        // job_batches table
        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        // failed_jobs table
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop all tables in reverse order of creation to respect foreign keys
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('blocked_ips');
        Schema::dropIfExists('login_attempts');
        Schema::dropIfExists('security_events');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('storage_settings');
        Schema::dropIfExists('dashboard_widgets');
        Schema::dropIfExists('receipt_templates');
        Schema::dropIfExists('printer_configs');
        Schema::dropIfExists('generated_reports');
        Schema::dropIfExists('warehouse_daily_snapshots');
        Schema::dropIfExists('daily_summaries');
        Schema::dropIfExists('employee_salaries');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('expense_categories');
        Schema::dropIfExists('negative_stock_alerts');
        Schema::dropIfExists('work_assignments');
        Schema::dropIfExists('tailor_service_items');
        Schema::dropIfExists('tailor_services');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('customer_credits');
        Schema::dropIfExists('customer_items');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('supplier_payments');
        Schema::dropIfExists('goods_receipts');
        Schema::dropIfExists('supplier_credits');
        Schema::dropIfExists('supplier_products');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('min_max_alerts');
        Schema::dropIfExists('barcode_sequences');
        Schema::dropIfExists('product_documents');
        Schema::dropIfExists('product_returns');
        Schema::dropIfExists('warehouse_transfers');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stock_history');
        Schema::dropIfExists('product_stock');
        Schema::dropIfExists('product_prices');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('warehouse_branch_access');
        Schema::dropIfExists('warehouses');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('accounts');
    }
};
