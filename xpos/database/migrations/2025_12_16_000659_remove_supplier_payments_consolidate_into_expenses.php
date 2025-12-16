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
        // Add invoice_number to expenses table (from supplier_payments) - only if doesn't exist
        if (!Schema::hasColumn('expenses', 'invoice_number')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->string('invoice_number', 100)->nullable()->after('reference_number');
            });
        }

        // Remove supplier_payment_id and its foreign key constraint - only if exists
        if (Schema::hasColumn('expenses', 'supplier_payment_id')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->dropForeign(['supplier_payment_id']);
                $table->dropColumn('supplier_payment_id');
            });
        }

        // Drop supplier_payments table entirely
        Schema::dropIfExists('supplier_payments');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate supplier_payments table
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->string('description', 500);
            $table->date('payment_date');
            $table->string('payment_method', 50);
            $table->string('reference_number', 100)->unique();
            $table->string('invoice_number', 100)->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Add back supplier_payment_id to expenses
        Schema::table('expenses', function (Blueprint $table) {
            $table->unsignedBigInteger('supplier_payment_id')->nullable()->after('supplier_id');
            $table->foreign('supplier_payment_id')->references('payment_id')->on('supplier_payments')->onDelete('set null');
        });

        // Remove invoice_number from expenses
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('invoice_number');
        });
    }
};
