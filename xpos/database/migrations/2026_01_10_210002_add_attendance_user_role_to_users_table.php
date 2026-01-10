<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'attendance_user' to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'account_owner',
            'admin',
            'branch_manager',
            'warehouse_manager',
            'sales_staff',
            'cashier',
            'accountant',
            'tailor',
            'attendance_user',
            'support_user',
            'super_admin'
        ) NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'attendance_user' from the enum
        // First, check if any users have this role and update them
        DB::statement("UPDATE users SET role = NULL WHERE role = 'attendance_user'");

        // Then modify the enum to remove attendance_user
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'account_owner',
            'admin',
            'branch_manager',
            'warehouse_manager',
            'sales_staff',
            'cashier',
            'accountant',
            'tailor',
            'support_user',
            'super_admin'
        ) NULL");
    }
};
