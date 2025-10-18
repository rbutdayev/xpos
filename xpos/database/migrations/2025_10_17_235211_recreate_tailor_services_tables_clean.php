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
        // Disable foreign key checks
        Schema::disableForeignKeyConstraints();

        // Drop existing tables
        Schema::dropIfExists('tailor_service_items');
        Schema::dropIfExists('tailor_services');

        // Recreate tailor_services table with correct structure
        Schema::create('tailor_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('employee_id')->nullable()->constrained('users')->nullOnDelete();

            // Service details
            $table->string('service_number');
            $table->text('description');
            $table->text('item_condition')->nullable();

            // Costs
            $table->decimal('labor_cost', 10, 2)->default(0);
            $table->decimal('materials_cost', 10, 2)->default(0);
            $table->decimal('total_cost', 10, 2)->default(0);

            // Dates and status
            $table->date('received_date');
            $table->date('promised_date')->nullable();
            $table->date('completed_date')->nullable();
            $table->date('delivered_date')->nullable();
            $table->enum('status', ['received', 'in_progress', 'completed', 'delivered', 'cancelled'])->default('received');

            // Payment
            $table->enum('payment_status', ['paid', 'credit', 'partial', 'unpaid'])->default('unpaid');
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('credit_amount', 10, 2)->default(0);
            $table->date('credit_due_date')->nullable();
            $table->foreignId('customer_credit_id')->nullable()->constrained()->nullOnDelete();

            // Additional info
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['account_id', 'status']);
            $table->index(['account_id', 'customer_id']);
            $table->index(['account_id', 'received_date']);
            $table->unique(['account_id', 'service_number']);
        });

        // Recreate tailor_service_items table with correct structure
        Schema::create('tailor_service_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tailor_service_id')->constrained()->cascadeOnDelete();

            // Item can be either a product (material) or a service
            $table->enum('item_type', ['product', 'service']);
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('item_name');

            // Quantity and pricing
            $table->decimal('quantity', 10, 3)->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);

            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['account_id', 'tailor_service_id']);
        });

        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tailor_service_items');
        Schema::dropIfExists('tailor_services');
    }
};
