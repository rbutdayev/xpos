<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalPrinterConfig extends Model
{
    protected $fillable = [
        'account_id',
        'provider',
        'name',
        'ip_address',
        'port',
        'username',
        'password',
        'merchant_id',
        'security_key',
        'device_serial',
        'bank_port',
        'default_tax_name',
        'default_tax_rate',
        'auto_send',
        'show_in_terminal',
        'settings',
        'is_active',
        'shift_open',
        'shift_opened_at',
        'last_z_report_at',
        'current_shift_duration_hours',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'auto_send' => 'boolean',
        'show_in_terminal' => 'boolean',
        'shift_open' => 'boolean',
        'port' => 'integer',
        'default_tax_rate' => 'decimal:2',
        'shift_opened_at' => 'datetime',
        'last_z_report_at' => 'datetime',
        'current_shift_duration_hours' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function providerConfig()
    {
        return $this->hasOne(FiscalPrinterProvider::class, 'code', 'provider');
    }

    public function getAuthHeaders(): array
    {
        $headers = [];

        switch ($this->provider) {
            case 'nba':
            case 'caspos':
            case 'oneclick':
                if ($this->username && $this->password) {
                    $credentials = base64_encode("{$this->username}:{$this->password}");
                    $headers['Authorization'] = "Basic {$credentials}";
                }
                break;
        }

        return $headers;
    }

    public function getFullUrl(string $endpoint = ''): string
    {
        $base = "http://{$this->ip_address}:{$this->port}";
        return $endpoint ? $base . '/' . ltrim($endpoint, '/') : $base;
    }

    public function isConfigured(): bool
    {
        if (!$this->is_active || empty($this->ip_address) || empty($this->port)) {
            return false;
        }

        switch ($this->provider) {
            case 'nba':
            case 'caspos':
                return !empty($this->username) && !empty($this->password);
            case 'oneclick':
                return !empty($this->security_key);
            case 'azsmart':
                return !empty($this->merchant_id);
            case 'omnitech':
                return true;
            default:
                return false;
        }
    }

    public function getProviderName(): string
    {
        return match($this->provider) {
            'nba' => 'NBA Smart',
            'caspos' => 'Caspos',
            'oneclick' => 'OneClick',
            'omnitech' => 'Omnitech',
            'azsmart' => 'AzSmart',
            default => $this->provider,
        };
    }

    public function getDefaultPort(): int
    {
        return match($this->provider) {
            'nba' => 9898,
            'caspos' => 5544,
            'oneclick' => 9876,
            'omnitech' => 8989,
            'azsmart' => 8008,
            default => 8080,
        };
    }

    /**
     * Check if shift is currently open
     */
    public function isShiftOpen(): bool
    {
        return $this->shift_open && $this->shift_opened_at !== null;
    }

    /**
     * Get shift duration in hours
     */
    public function getShiftDurationHours(): ?int
    {
        if (!$this->shift_opened_at) {
            return null;
        }

        return (int) $this->shift_opened_at->diffInHours(now());
    }

    /**
     * Check if shift has exceeded 24 hours
     */
    public function isShiftExpired(): bool
    {
        if (!$this->isShiftOpen()) {
            return false;
        }

        $hours = $this->getShiftDurationHours();
        return $hours !== null && $hours >= 24;
    }

    /**
     * Check if shift is approaching expiration (>= 23 hours)
     */
    public function isShiftNearExpiration(): bool
    {
        if (!$this->isShiftOpen()) {
            return false;
        }

        $hours = $this->getShiftDurationHours();
        return $hours !== null && $hours >= 23;
    }

    /**
     * Check if shift is valid for creating fiscal receipts
     */
    public function isShiftValid(): bool
    {
        return $this->isShiftOpen() && !$this->isShiftExpired();
    }

    /**
     * Get shift status message
     */
    public function getShiftStatusMessage(): string
    {
        if (!$this->isShiftOpen()) {
            return 'Növbə bağlıdır';
        }

        $hours = $this->getShiftDurationHours();

        if ($this->isShiftExpired()) {
            return "Növbə vaxtı bitib! ({$hours} saat)";
        }

        if ($this->isShiftNearExpiration()) {
            return "Diqqət: Növbə tezliklə bitəcək! ({$hours} saat)";
        }

        return "Növbə açıqdır ({$hours} saat)";
    }
}

