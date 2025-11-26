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
        'account_id',
        'role',
        'status',
        'phone',
        'position',
        'hire_date',
        'hourly_rate',
        'branch_id',
        'notes',
        'permissions',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
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
            'permissions' => 'array',
            'last_login_at' => 'datetime',
            'hire_date' => 'date',
            'hourly_rate' => 'decimal:2',
        ];
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
