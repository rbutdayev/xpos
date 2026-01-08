<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ReceiptTemplate;

class UpdateReceiptTemplateNamesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Updates template names to use Azerbaijani instead of English
     */
    public function run(): void
    {
        $this->command->info('Updating receipt template names to Azerbaijani...');

        $typeNames = [
            'sale' => 'Satış',
            'service' => 'Xidmət',
            'customer_item' => 'Müştəri Məhsulu',
            'return' => 'Qaytarma',
            'payment' => 'Ödəniş',
        ];

        // Get all default templates that need renaming
        $templates = ReceiptTemplate::where('is_default', true)->get();

        foreach ($templates as $template) {
            $oldName = $template->name;

            // Check if name contains English word and update it
            if (isset($typeNames[$template->type])) {
                $newName = 'Standart ' . $typeNames[$template->type] . ' Şablonu';

                if ($oldName !== $newName) {
                    $template->update(['name' => $newName]);
                    $this->command->info("  ✓ Updated: '{$oldName}' → '{$newName}'");
                }
            }
        }

        $this->command->info('Receipt template names updated!');
    }
}
