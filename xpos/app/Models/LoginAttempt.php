<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    protected $fillable = [
        'email',
        'ip_address',
        'success',
        'user_agent',
        'attempted_at'
    ];

    protected $casts = [
        'success' => 'boolean',
        'attempted_at' => 'datetime'
    ];

    public function scopeFailedAttempts($query)
    {
        return $query->where('success', false);
    }

    public function scopeSuccessfulAttempts($query)
    {
        return $query->where('success', true);
    }

    public function scopeFromIP($query, $ip)
    {
        return $query->where('ip_address', $ip);
    }

    public function scopeRecent($query, $minutes = 15)
    {
        return $query->where('attempted_at', '>=', now()->subMinutes($minutes));
    }

    public function scopeForEmail($query, $email)
    {
        return $query->where('email', $email);
    }
}
