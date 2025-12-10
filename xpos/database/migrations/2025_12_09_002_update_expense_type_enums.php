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
        // Update expense type values in expense_categories table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('expense_categories', 'type')) {
            // Step 1: Alter ENUM to include both old and new values temporarily
            DB::statement("
                ALTER TABLE expense_categories
                MODIFY COLUMN type ENUM(
                    'maaş', 'xərclər', 'ödənişlər', 'kommunal', 'nəqliyyat', 'digər',
                    'salary', 'expenses', 'payments', 'utilities', 'transport', 'other'
                ) NOT NULL DEFAULT 'xərclər'
            ");

            // Step 2: Update the data
            DB::statement("
                UPDATE expense_categories
                SET type = CASE
                    WHEN type = 'maaş' THEN 'salary'
                    WHEN type = 'xərclər' THEN 'expenses'
                    WHEN type = 'ödənişlər' THEN 'payments'
                    WHEN type = 'kommunal' THEN 'utilities'
                    WHEN type = 'nəqliyyat' THEN 'transport'
                    WHEN type = 'digər' THEN 'other'
                    ELSE type
                END
                WHERE type IN ('maaş', 'xərclər', 'ödənişlər', 'kommunal', 'nəqliyyat', 'digər')
            ");

            // Step 3: Remove old values from ENUM and update default
            DB::statement("
                ALTER TABLE expense_categories
                MODIFY COLUMN type ENUM('salary', 'expenses', 'payments', 'utilities', 'transport', 'other')
                NOT NULL DEFAULT 'expenses'
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback expense type values in expense_categories table if the column exists
        if (DB::getSchemaBuilder()->hasColumn('expense_categories', 'type')) {
            // Step 1: Alter ENUM to include both values
            DB::statement("
                ALTER TABLE expense_categories
                MODIFY COLUMN type ENUM(
                    'maaş', 'xərclər', 'ödənişlər', 'kommunal', 'nəqliyyat', 'digər',
                    'salary', 'expenses', 'payments', 'utilities', 'transport', 'other'
                ) NOT NULL DEFAULT 'expenses'
            ");

            // Step 2: Update the data back
            DB::statement("
                UPDATE expense_categories
                SET type = CASE
                    WHEN type = 'salary' THEN 'maaş'
                    WHEN type = 'expenses' THEN 'xərclər'
                    WHEN type = 'payments' THEN 'ödənişlər'
                    WHEN type = 'utilities' THEN 'kommunal'
                    WHEN type = 'transport' THEN 'nəqliyyat'
                    WHEN type = 'other' THEN 'digər'
                    ELSE type
                END
                WHERE type IN ('salary', 'expenses', 'payments', 'utilities', 'transport', 'other')
            ");

            // Step 3: Remove English values from ENUM and restore original default
            DB::statement("
                ALTER TABLE expense_categories
                MODIFY COLUMN type ENUM('maaş', 'xərclər', 'ödənişlər', 'kommunal', 'nəqliyyat', 'digər')
                NOT NULL DEFAULT 'xərclər'
            ");
        }
    }
};
