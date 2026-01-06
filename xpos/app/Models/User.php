<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\HasStandardRoles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasStandardRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'position',
        'hire_date',
        'hourly_rate',
        'branch_id',
        'notes',
        'last_login_at',
        'language',
        'kiosk_pin',
        'kiosk_enabled',
    ];

    /**
     * The attributes that aren't mass assignable.
     * Security: Protect sensitive fields from mass assignment
     *
     * @var list<string>
     */
    protected $guarded = [
        'id',
        'account_id',      // Prevent account switching
        'role',            // Prevent privilege escalation
        'status',          // Prevent self-activation
        'permissions',     // Prevent permission manipulation
        'remember_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'kiosk_pin',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'has_kiosk_pin',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'kiosk_pin' => 'hashed',
            'permissions' => 'array',
            'last_login_at' => 'datetime',
            'hire_date' => 'date',
            'hourly_rate' => 'decimal:2',
            'kiosk_enabled' => 'boolean',
        ];
    }

    /**
     * Check if kiosk PIN is configured (without exposing the PIN itself)
     */
    public function getHasKioskPinAttribute(): bool
    {
        return !is_null($this->getAttributeValue('kiosk_pin')) && $this->getAttributeValue('kiosk_pin') !== '';
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function isOwner(): bool
    {
        return $this->role === 'account_owner';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['account_owner', 'admin']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isOwner()) {
            return true;
        }
        
        return in_array($permission, $this->permissions ?? []);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasRole(array|string $roles): bool
    {
        if (is_string($roles)) {
            $roles = [$roles];
        }

        return in_array($this->role, $roles);
    }

    /**
     * Check if this user is a system user (e.g., Online Shop user)
     * System users cannot be edited, deleted, or viewed
     * MULTI-TENANT: Checks for shop-slug-specific system user emails
     */
    public function isSystemUser(): bool
    {
        // Match pattern: online-shop@system-{shop_slug}.local
        return str_starts_with($this->email, 'online-shop@system-')
            && str_ends_with($this->email, '.local');
    }
}
