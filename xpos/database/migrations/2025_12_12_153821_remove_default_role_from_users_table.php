<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove default value from role column
        // Role should be explicitly set when creating users
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor', 'support_user', 'super_admin') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore the default value to 'sales_staff'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('account_owner', 'admin', 'branch_manager', 'warehouse_manager', 'sales_staff', 'cashier', 'accountant', 'tailor', 'support_user', 'super_admin') DEFAULT 'sales_staff'");
    }
};
