<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $primaryKey = 'log_id';
    
    protected $fillable = [
        'account_id',
        'user_id',
        'action',
        'model_type',
        'model_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'geolocation',
        'device_type',
        'session_id',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'geolocation' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getModelName(): string
    {
        return $this->model_type;
    }

    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeForModelType($query, string $modelType)
    {
        return $query->where('model_type', $modelType);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public static function log(string $action, string $modelType, ?string $modelId = null, array $properties = []): self
    {
        $user = auth()->user();
        $request = request();
        $securityService = app(\App\Services\SecurityMonitoringService::class);

        $ipAddress = $request?->ip();
        $userAgent = $request?->userAgent();

        return static::create([
            'account_id' => $user?->account_id,
            'user_id' => $user?->id,
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'description' => $properties['description'] ?? null,
            'old_values' => $properties['old_values'] ?? null,
            'new_values' => $properties['new_values'] ?? null,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'geolocation' => $ipAddress ? $securityService->getGeolocation($ipAddress) : null,
            'device_type' => $userAgent ? $securityService->getDeviceType($userAgent) : null,
            'session_id' => $request?->session()?->getId(),
        ]);
    }
}
