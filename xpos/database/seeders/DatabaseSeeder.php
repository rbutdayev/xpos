<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create SUPER ADMIN user for global system administration
        // Check if super admin already exists to prevent duplicates
        $superAdmin = User::where('email', 'admin@xpos.az')->first();

        if (!$superAdmin) {
            User::create([
                'account_id' => null,
                'name' => 'System Administrator',
                'email' => 'admin@xpos.az',
                'password' => Hash::make('SuperAdmin2025!'),
                'role' => 'super_admin',
                'status' => 'active',
                'phone' => '+994501234567',
                'position' => 'System Administrator',
                'hire_date' => now(),
                'branch_id' => null,
                'permissions' => [
                    'manage_users' => true,
                    'manage_products' => true,
                    'manage_sales' => true,
                    'manage_inventory' => true,
                    'manage_reports' => true,
                    'manage_settings' => true,
                    'super_admin' => true,
                ],
                'last_login_at' => null,
            ]);
            echo "✓ Super Admin user created (admin@xpos.az)\n";
        } else {
            // Update password if super admin exists to ensure it's correct
            $superAdmin->update([
                'password' => Hash::make('SuperAdmin2025!'),
            ]);
            echo "✓ Super Admin password updated (admin@xpos.az)\n";
        }

        // Call XPOSSeeder to create comprehensive test data
        $this->call([
            XPOSSeeder::class,
        ]);
    }
}
