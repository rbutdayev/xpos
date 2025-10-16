<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:superadmin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a super admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Check if super admin already exists
        if (User::where('role', 'super_admin')->exists()) {
            $this->info('Super admin already exists!');
            return;
        }

        // Create super admin user
        $user = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@onyx.az',
            'password' => Hash::make('123456'),
            'role' => 'super_admin',
            'status' => 'active',
            'account_id' => null,
        ]);

        $this->info('Super admin created successfully!');
        $this->info('Email: superadmin@onyx.az');
        $this->info('Password: 123456');
    }
}
