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
        // Create rentals table
        Schema::create('rentals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->string('rental_number', 50)->unique();
            $table->foreignId('customer_id')->constrained()->onDelete('restrict');
            $table->foreignId('branch_id')->constrained()->onDelete('restrict');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');

            // Dates
            $table->date('rental_start_date');
            $table->date('rental_end_date');
            $table->date('actual_return_date')->nullable();

            // Financial
            $table->decimal('rental_price', 10, 2)->default(0);
            $table->decimal('deposit_amount', 10, 2)->default(0);
            $table->decimal('late_fee', 10, 2)->default(0);
            $table->decimal('damage_fee', 10, 2)->default(0);
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('credit_amount', 10, 2)->default(0);

            // Payment & Status
            $table->enum('payment_status', ['paid', 'credit', 'partial'])->default('paid');
            $table->enum('status', ['reserved', 'active', 'returned', 'overdue', 'cancelled'])->default('reserved');

            // Collateral/Security
            $table->enum('collateral_type', ['deposit_cash', 'passport', 'id_card', 'drivers_license', 'other_document']);
            $table->decimal('collateral_amount', 10, 2)->nullable();
            $table->string('collateral_document_type', 100)->nullable();
            $table->string('collateral_document_number', 100)->nullable();
            $table->string('collateral_photo_path', 255)->nullable();
            $table->text('collateral_notes')->nullable();
            $table->boolean('collateral_returned')->default(false);
            $table->timestamp('collateral_returned_at')->nullable();

            // Condition Tracking
            $table->json('condition_on_rental')->nullable();
            $table->json('condition_on_return')->nullable();
            $table->text('damage_notes')->nullable();

            // Notifications
            $table->boolean('sms_sent')->default(false);
            $table->timestamp('sms_sent_at')->nullable();
            $table->boolean('telegram_sent')->default(false);
            $table->timestamp('telegram_sent_at')->nullable();
            $table->boolean('reminder_sent')->default(false);
            $table->timestamp('reminder_sent_at')->nullable();
            $table->boolean('overdue_alert_sent')->default(false);
            $table->timestamp('overdue_alert_sent_at')->nullable();

            // Additional Info
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['account_id', 'rental_number']);
            $table->index(['account_id', 'customer_id']);
            $table->index(['account_id', 'branch_id']);
            $table->index(['account_id', 'status']);
            $table->index(['account_id', 'rental_start_date']);
            $table->index(['account_id', 'rental_end_date']);
            $table->index(['account_id', 'payment_status']);
        });

        // Create rental_inventory table
        Schema::create('rental_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->foreignId('branch_id')->constrained()->onDelete('restrict');

            // Inventory Item Details
            $table->string('inventory_number')->unique();
            $table->string('serial_number')->nullable();
            $table->enum('rental_category', [
                'clothing',
                'electronics',
                'home_appliances',
                'cosmetics',
                'event_equipment',
                'furniture',
                'jewelry',
                'toys',
                'sports'
            ])->nullable();

            // Status & Availability
            $table->enum('status', ['available', 'rented', 'maintenance', 'damaged', 'retired'])->default('available');
            $table->boolean('is_active')->default(true);

            // Current Rental
            $table->foreignId('current_rental_id')->nullable()->constrained('rentals')->onDelete('set null');
            $table->date('available_from')->nullable();

            // Condition & Maintenance
            $table->text('condition_notes')->nullable();
            $table->date('last_maintenance_date')->nullable();
            $table->date('next_maintenance_date')->nullable();
            $table->integer('total_rentals')->default(0);

            // Pricing
            $table->decimal('purchase_price', 10, 2)->nullable();
            $table->decimal('daily_rate', 10, 2)->nullable();
            $table->decimal('weekly_rate', 10, 2)->nullable();
            $table->decimal('monthly_rate', 10, 2)->nullable();
            $table->decimal('replacement_cost', 10, 2)->nullable();

            // Photos & Documents
            $table->json('photos')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['account_id', 'product_id']);
            $table->index(['account_id', 'branch_id']);
            $table->index(['account_id', 'status']);
            $table->index(['account_id', 'rental_category']);
            $table->index(['account_id', 'is_active']);
            $table->index(['account_id', 'inventory_number']);
        });

        // Create rental_items table
        Schema::create('rental_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->foreignId('rental_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->foreignId('rental_inventory_id')->nullable()->constrained('rental_inventory')->onDelete('set null');

            // Item Details
            $table->string('product_name');
            $table->string('sku')->nullable();
            $table->integer('quantity')->default(1);

            // Pricing
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->decimal('deposit_per_item', 10, 2)->default(0);

            // Condition
            $table->json('condition_checklist')->nullable();
            $table->json('condition_on_return')->nullable();
            $table->text('damage_notes')->nullable();
            $table->decimal('damage_fee', 10, 2)->default(0);

            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['account_id', 'rental_id']);
            $table->index(['account_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rental_items');
        Schema::dropIfExists('rental_inventory');
        Schema::dropIfExists('rentals');
    }
};
