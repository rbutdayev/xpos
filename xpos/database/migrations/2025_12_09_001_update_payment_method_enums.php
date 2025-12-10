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
        // Step 1: Alter ENUM in payments table to include both old and new values temporarily
        DB::statement("
            ALTER TABLE payments
            MODIFY COLUMN method ENUM(
                'nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı',
                'cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card'
            ) NOT NULL
        ");

        // Step 2: Update payment method values in payments table
        DB::statement("
            UPDATE payments
            SET method = CASE
                WHEN method = 'nağd' THEN 'cash'
                WHEN method = 'kart' THEN 'card'
                WHEN method = 'köçürmə' THEN 'bank_transfer'
                WHEN method = 'bank_kredit' THEN 'bank_credit'
                WHEN method = 'hədiyyə_kartı' THEN 'gift_card'
                ELSE method
            END
            WHERE method IN ('nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı')
        ");

        // Step 3: Remove old Azerbaijani values from ENUM
        DB::statement("
            ALTER TABLE payments
            MODIFY COLUMN method ENUM('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card') NOT NULL
        ");

        // Update payment method values in expenses table
        DB::statement("
            UPDATE expenses
            SET payment_method = CASE
                WHEN payment_method = 'nağd' THEN 'cash'
                WHEN payment_method = 'kart' THEN 'card'
                WHEN payment_method = 'köçürmə' THEN 'bank_transfer'
                WHEN payment_method = 'bank_kredit' THEN 'bank_credit'
                WHEN payment_method = 'hədiyyə_kartı' THEN 'gift_card'
                ELSE payment_method
            END
            WHERE payment_method IN ('nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı')
        ");

        // Update payment method values in sales table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('sales', 'payment_method')) {
            DB::statement("
                UPDATE sales
                SET payment_method = CASE
                    WHEN payment_method = 'nağd' THEN 'cash'
                    WHEN payment_method = 'kart' THEN 'card'
                    WHEN payment_method = 'köçürmə' THEN 'bank_transfer'
                    WHEN payment_method = 'bank_kredit' THEN 'bank_credit'
                    WHEN payment_method = 'hədiyyə_kartı' THEN 'gift_card'
                    ELSE payment_method
                END
                WHERE payment_method IN ('nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı')
            ");
        }

        // Update payment method values in supplier_payments table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('supplier_payments', 'payment_method')) {
            DB::statement("
                UPDATE supplier_payments
                SET payment_method = CASE
                    WHEN payment_method = 'nağd' THEN 'cash'
                    WHEN payment_method = 'kart' THEN 'card'
                    WHEN payment_method = 'köçürmə' THEN 'bank_transfer'
                    WHEN payment_method = 'bank_kredit' THEN 'bank_credit'
                    WHEN payment_method = 'hədiyyə_kartı' THEN 'gift_card'
                    ELSE payment_method
                END
                WHERE payment_method IN ('nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı')
            ");
        }

        // Update payment method values in customer_credit_payments table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('customer_credit_payments', 'payment_method')) {
            DB::statement("
                UPDATE customer_credit_payments
                SET payment_method = CASE
                    WHEN payment_method = 'nağd' THEN 'cash'
                    WHEN payment_method = 'kart' THEN 'card'
                    WHEN payment_method = 'köçürmə' THEN 'bank_transfer'
                    WHEN payment_method = 'bank_kredit' THEN 'bank_credit'
                    WHEN payment_method = 'hədiyyə_kartı' THEN 'gift_card'
                    ELSE payment_method
                END
                WHERE payment_method IN ('nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı')
            ");
        }

        // Update payment method values in rental_payments table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('rental_payments', 'payment_method')) {
            DB::statement("
                UPDATE rental_payments
                SET payment_method = CASE
                    WHEN payment_method = 'nağd' THEN 'cash'
                    WHEN payment_method = 'kart' THEN 'card'
                    WHEN payment_method = 'köçürmə' THEN 'bank_transfer'
                    WHEN payment_method = 'bank_kredit' THEN 'bank_credit'
                    WHEN payment_method = 'hədiyyə_kartı' THEN 'gift_card'
                    ELSE payment_method
                END
                WHERE payment_method IN ('nağd', 'kart', 'köçürmə', 'bank_kredit', 'hədiyyə_kartı')
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback payment method values in payments table
        DB::statement("
            UPDATE payments
            SET method = CASE
                WHEN method = 'cash' THEN 'nağd'
                WHEN method = 'card' THEN 'kart'
                WHEN method = 'bank_transfer' THEN 'köçürmə'
                WHEN method = 'bank_credit' THEN 'bank_kredit'
                WHEN method = 'gift_card' THEN 'hədiyyə_kartı'
                ELSE method
            END
            WHERE method IN ('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card')
        ");

        // Rollback payment method values in expenses table
        DB::statement("
            UPDATE expenses
            SET payment_method = CASE
                WHEN payment_method = 'cash' THEN 'nağd'
                WHEN payment_method = 'card' THEN 'kart'
                WHEN payment_method = 'bank_transfer' THEN 'köçürmə'
                WHEN payment_method = 'bank_credit' THEN 'bank_kredit'
                WHEN payment_method = 'gift_card' THEN 'hədiyyə_kartı'
                ELSE payment_method
            END
            WHERE payment_method IN ('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card')
        ");

        // Rollback payment method values in sales table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('sales', 'payment_method')) {
            DB::statement("
                UPDATE sales
                SET payment_method = CASE
                    WHEN payment_method = 'cash' THEN 'nağd'
                    WHEN payment_method = 'card' THEN 'kart'
                    WHEN payment_method = 'bank_transfer' THEN 'köçürmə'
                    WHEN payment_method = 'bank_credit' THEN 'bank_kredit'
                    WHEN payment_method = 'gift_card' THEN 'hədiyyə_kartı'
                    ELSE payment_method
                END
                WHERE payment_method IN ('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card')
            ");
        }

        // Rollback payment method values in supplier_payments table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('supplier_payments', 'payment_method')) {
            DB::statement("
                UPDATE supplier_payments
                SET payment_method = CASE
                    WHEN payment_method = 'cash' THEN 'nağd'
                    WHEN payment_method = 'card' THEN 'kart'
                    WHEN payment_method = 'bank_transfer' THEN 'köçürmə'
                    WHEN payment_method = 'bank_credit' THEN 'bank_kredit'
                    WHEN payment_method = 'gift_card' THEN 'hədiyyə_kartı'
                    ELSE payment_method
                END
                WHERE payment_method IN ('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card')
            ");
        }

        // Rollback payment method values in customer_credit_payments table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('customer_credit_payments', 'payment_method')) {
            DB::statement("
                UPDATE customer_credit_payments
                SET payment_method = CASE
                    WHEN payment_method = 'cash' THEN 'nağd'
                    WHEN payment_method = 'card' THEN 'kart'
                    WHEN payment_method = 'bank_transfer' THEN 'köçürmə'
                    WHEN payment_method = 'bank_credit' THEN 'bank_kredit'
                    WHEN payment_method = 'gift_card' THEN 'hədiyyə_kartı'
                    ELSE payment_method
                END
                WHERE payment_method IN ('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card')
            ");
        }

        // Rollback payment method values in rental_payments table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('rental_payments', 'payment_method')) {
            DB::statement("
                UPDATE rental_payments
                SET payment_method = CASE
                    WHEN payment_method = 'cash' THEN 'nağd'
                    WHEN payment_method = 'card' THEN 'kart'
                    WHEN payment_method = 'bank_transfer' THEN 'köçürmə'
                    WHEN payment_method = 'bank_credit' THEN 'bank_kredit'
                    WHEN payment_method = 'gift_card' THEN 'hədiyyə_kartı'
                    ELSE payment_method
                END
                WHERE payment_method IN ('cash', 'card', 'bank_transfer', 'bank_credit', 'gift_card')
            ");
        }
    }
};
