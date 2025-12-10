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
        // Step 1: Alter ENUM in subscriptions table to include both values
        DB::statement("
            ALTER TABLE subscriptions
            MODIFY COLUMN plan_type ENUM('başlanğıc', 'professional', 'enterprise', 'starter')
            NOT NULL
        ");

        // Step 2: Update subscription plan values in subscriptions table
        DB::statement("
            UPDATE subscriptions
            SET plan_type = 'starter'
            WHERE plan_type = 'başlanğıc'
        ");

        // Step 3: Remove old value from ENUM
        DB::statement("
            ALTER TABLE subscriptions
            MODIFY COLUMN plan_type ENUM('starter', 'professional', 'enterprise')
            NOT NULL
        ");

        // Update subscription plan values in accounts table if column exists
        if (DB::getSchemaBuilder()->hasColumn('accounts', 'subscription_plan')) {
            // Step 1: Alter ENUM to include both values
            DB::statement("
                ALTER TABLE accounts
                MODIFY COLUMN subscription_plan ENUM('başlanğıc', 'professional', 'enterprise', 'starter')
                NULL
            ");

            // Step 2: Update data
            DB::statement("
                UPDATE accounts
                SET subscription_plan = 'starter'
                WHERE subscription_plan = 'başlanğıc'
            ");

            // Step 3: Remove old value from ENUM
            DB::statement("
                ALTER TABLE accounts
                MODIFY COLUMN subscription_plan ENUM('starter', 'professional', 'enterprise')
                NULL
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Alter ENUM in subscriptions table to include both values
        DB::statement("
            ALTER TABLE subscriptions
            MODIFY COLUMN plan_type ENUM('başlanğıc', 'professional', 'enterprise', 'starter')
            NOT NULL
        ");

        // Step 2: Rollback subscription plan values in subscriptions table
        DB::statement("
            UPDATE subscriptions
            SET plan_type = 'başlanğıc'
            WHERE plan_type = 'starter'
        ");

        // Step 3: Remove 'starter' from ENUM
        DB::statement("
            ALTER TABLE subscriptions
            MODIFY COLUMN plan_type ENUM('başlanğıc', 'professional', 'enterprise')
            NOT NULL
        ");

        // Rollback subscription plan values in accounts table if column exists
        if (DB::getSchemaBuilder()->hasColumn('accounts', 'subscription_plan')) {
            // Step 1: Alter ENUM to include both values
            DB::statement("
                ALTER TABLE accounts
                MODIFY COLUMN subscription_plan ENUM('başlanğıc', 'professional', 'enterprise', 'starter')
                NULL
            ");

            // Step 2: Update data
            DB::statement("
                UPDATE accounts
                SET subscription_plan = 'başlanğıc'
                WHERE subscription_plan = 'starter'
            ");

            // Step 3: Remove 'starter' from ENUM
            DB::statement("
                ALTER TABLE accounts
                MODIFY COLUMN subscription_plan ENUM('başlanğıc', 'professional', 'enterprise')
                NULL
            ");
        }
    }
};
