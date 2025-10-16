<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class UpdatePoliciesCommand extends Command
{
    protected $signature = 'policies:update {--dry-run : Show what would be updated without making changes}';
    protected $description = 'Update all policies to extend BasePolicy and use standardized roles';

    public function handle()
    {
        $policyPath = app_path('Policies');
        $policies = File::files($policyPath);
        
        $this->info('Updating policies to use BasePolicy...');
        
        foreach ($policies as $policy) {
            $filename = $policy->getFilename();
            
            // Skip BasePolicy itself
            if ($filename === 'BasePolicy.php') {
                continue;
            }
            
            $content = File::get($policy->getPathname());
            
            // Check if already extends BasePolicy
            if (str_contains($content, 'extends BasePolicy')) {
                $this->line("✓ {$filename} already extends BasePolicy");
                continue;
            }
            
            $this->updatePolicy($policy->getPathname(), $content, $filename);
        }
        
        $this->info('Policy update completed!');
    }
    
    private function updatePolicy($path, $content, $filename)
    {
        $updated = $content;
        
        // Remove unused imports
        $updated = preg_replace('/use Illuminate\\Auth\\Access\\Response;\s*\n/', '', $updated);
        $updated = preg_replace('/use Illuminate\\Support\\Facades\\Gate;\s*\n/', '', $updated);
        
        // Update class declaration to extend BasePolicy
        $updated = preg_replace(
            '/class (\w+Policy)\s*\n\s*{/',
            'class $1 extends BasePolicy\n{',
            $updated
        );
        
        // Replace common role patterns with trait methods
        $roleReplacements = [
            '/\$user->hasRole\(\[\'admin\', \'account_owner\'\]\)/' => '$user->hasAdminRole()',
            '/\$user->hasRole\(\[\'admin\', \'account_owner\', \'sales_staff\'\]\)/' => '$user->hasSalesRole()',
            '/\$user->hasRole\(\[\'admin\', \'account_owner\', \'accountant\'\]\)/' => '$user->hasFinancialRole()',
            '/\$user->hasRole\(\[\'admin\', \'account_owner\', \'tailor\'\]\)/' => '$user->hasTailorRole()',
        ];
        
        foreach ($roleReplacements as $pattern => $replacement) {
            $updated = preg_replace($pattern, $replacement, $updated);
        }
        
        // Replace account_id checks with belongsToUserAccount method
        $updated = preg_replace(
            '/\$user->account_id === \$(\w+)->account_id/',
            '$this->belongsToUserAccount($user, $$1)',
            $updated
        );
        
        // Remove empty restore and forceDelete methods if they just return false
        $updated = preg_replace('/\s+public function restore\([^}]+return false;\s+}\s+public function forceDelete\([^}]+return false;\s+}/s', '', $updated);
        
        if ($this->option('dry-run')) {
            $this->line("Would update: {$filename}");
            return;
        }
        
        File::put($path, $updated);
        $this->line("✓ Updated {$filename}");
    }
}