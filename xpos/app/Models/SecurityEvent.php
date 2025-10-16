<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityEvent extends Model
{
    protected $fillable = [
        'type',
        'severity',
        'description',
        'user_id',
        'account_id',
        'ip_address',
        'user_agent',
        'geolocation',
        'resolved_at'
    ];

    protected $casts = [
        'geolocation' => 'array',
        'resolved_at' => 'datetime'
    ];

    public const array TYPES = [
        'FAILED_LOGIN' => 'failed_login',
        'SUSPICIOUS_ACTIVITY' => 'suspicious_activity',
        'PERMISSION_ESCALATION' => 'permission_escalation',
        'DATA_EXPORT' => 'data_export',
        'ADMIN_ACCESS' => 'admin_access',
        'ACCOUNT_LOCKOUT' => 'account_lockout'
    ];

    public const array SEVERITIES = ['low', 'medium', 'high', 'critical'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function scopeUnresolved($query)
    {
        return $query->whereNull('resolved_at');
    }

    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }
}
