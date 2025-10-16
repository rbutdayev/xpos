<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditLogObserver
{
    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        $this->logActivity('created', $model, [
            'description' => $this->getModelDisplayName($model) . ' yaradıldı',
            'new_values' => $model->getAttributes(),
        ]);
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        $changes = $model->getChanges();
        $original = $model->getOriginal();
        
        // Remove timestamps and routine fields from tracking to avoid noise
        unset($changes['updated_at'], $original['updated_at']);
        
        // Skip automatic/routine updates to reduce audit log noise
        if ($this->shouldSkipUpdate($model, $changes)) {
            return;
        }
        
        if (!empty($changes)) {
            $this->logActivity('updated', $model, [
                'description' => $this->getModelDisplayName($model) . ' yeniləndi',
                'old_values' => array_intersect_key($original, $changes),
                'new_values' => $changes,
            ]);
        }
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $this->logActivity('deleted', $model, [
            'description' => $this->getModelDisplayName($model) . ' silindi',
            'old_values' => $model->getOriginal(),
        ]);
    }

    /**
     * Handle the model "restored" event.
     */
    public function restored(Model $model): void
    {
        $this->logActivity('restored', $model, [
            'description' => $this->getModelDisplayName($model) . ' bərpa edildi',
            'new_values' => $model->getAttributes(),
        ]);
    }

    /**
     * Log the activity to audit logs
     */
    private function logActivity(string $action, Model $model, array $properties = []): void
    {
        // Skip logging for AuditLog model itself to prevent infinite loops
        if ($model instanceof AuditLog) {
            return;
        }

        // Only log if user is authenticated and has account_id
        $user = auth()->user();
        if (!$user || !$user->account_id) {
            return;
        }

        AuditLog::log(
            $action,
            get_class($model),
            $model->getKey(),
            $properties
        );
    }

    /**
     * Check if we should skip logging this update to reduce noise
     */
    private function shouldSkipUpdate(Model $model, array $changes): bool
    {
        // Skip if no meaningful changes
        if (empty($changes)) {
            return true;
        }
        
        $className = get_class($model);
        
        // Define fields to ignore for each model to reduce audit log noise
        $skipFields = [
            'App\Models\User' => ['last_login_at', 'remember_token'],
            'App\Models\ProductStock' => ['last_updated_at'],
            // Add more models and their routine fields as needed
        ];
        
        if (isset($skipFields[$className])) {
            // Remove routine fields from changes
            $filteredChanges = array_diff_key($changes, array_flip($skipFields[$className]));
            
            // If only routine fields changed, skip logging
            if (empty($filteredChanges)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get a human-readable model name
     */
    private function getModelDisplayName(Model $model): string
    {
        $className = class_basename($model);
        
        // Map model names to Azerbaijani translations
        $modelNames = [
            'Product' => 'Məhsul',
            'Customer' => 'Müştəri',
            'Sale' => 'Satış',
            'ServiceRecord' => 'Servis qeydi',
            'Expense' => 'Xərc',
            'Supplier' => 'Təchizatçı',
            'Employee' => 'İşçi',
            'User' => 'İstifadəçi',
            'Company' => 'Şirkət',
            'Branch' => 'Filial',
            'Warehouse' => 'Anbar',
            'Category' => 'Kateqoriya',
            'StockMovement' => 'Stok hərəkəti',
            'WarehouseTransfer' => 'Anbar köçürməsi',
            'GoodsReceipt' => 'Mal qəbulu',
            'ProductReturn' => 'Məhsul qaytarması',
            'PrinterConfig' => 'Printer konfiqurasiyası',
        ];

        return $modelNames[$className] ?? $className;
    }
}