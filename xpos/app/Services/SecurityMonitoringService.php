<?php

namespace App\Services;

use App\Models\SecurityEvent;
use App\Models\LoginAttempt;
use App\Models\BlockedIP;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SecurityMonitoringService
{
    public function trackLoginAttempt(string $email, string $ip, bool $success, ?string $userAgent = null): void
    {
        LoginAttempt::create([
            'email' => $email,
            'ip_address' => $ip,
            'success' => $success,
            'user_agent' => $userAgent,
            'attempted_at' => now()
        ]);

        if (!$success) {
            $this->checkForSuspiciousActivity($email, $ip);
        }
    }

    public function checkForSuspiciousActivity(string $email, string $ip): void
    {
        $recentFailures = LoginAttempt::where('ip_address', $ip)
            ->where('success', false)
            ->where('attempted_at', '>=', now()->subMinutes(15))
            ->count();

        if ($recentFailures >= 5) {
            $this->createSecurityEvent(
                SecurityEvent::TYPES['FAILED_LOGIN'],
                'high',
                "Multiple failed login attempts from IP: {$ip}",
                null,
                null,
                $ip
            );
            
            $this->blockIP($ip, 'Automated block: Multiple failed login attempts');
        }

        $emailFailures = LoginAttempt::where('email', $email)
            ->where('success', false)
            ->where('attempted_at', '>=', now()->subHour())
            ->count();

        if ($emailFailures >= 10) {
            $this->createSecurityEvent(
                SecurityEvent::TYPES['SUSPICIOUS_ACTIVITY'],
                'medium',
                "Multiple failed login attempts for email: {$email}",
                null,
                null,
                $ip
            );
        }
    }

    public function detectSuspiciousActivity(int $userId, ?int $accountId = null): void
    {
        $user = User::find($userId);
        if (!$user) {
            return;
        }

        $recentLogins = AuditLog::where('user_id', $userId)
            ->where('action', 'login')
            ->where('created_at', '>=', now()->subHours(24))
            ->get();

        $uniqueLocations = $recentLogins->whereNotNull('geolocation')
            ->pluck('geolocation')
            ->unique()
            ->count();

        if ($uniqueLocations > 3) {
            $this->createSecurityEvent(
                SecurityEvent::TYPES['SUSPICIOUS_ACTIVITY'],
                'medium',
                "User logged in from {$uniqueLocations} different locations in 24h",
                $userId,
                $accountId
            );
        }

        $nightLogins = $recentLogins->filter(function ($log) {
            return $log->created_at->hour < 6 || $log->created_at->hour > 22;
        });

        if ($nightLogins->count() > 2) {
            $this->createSecurityEvent(
                SecurityEvent::TYPES['SUSPICIOUS_ACTIVITY'],
                'low',
                "Multiple off-hours login attempts detected",
                $userId,
                $accountId
            );
        }
    }

    public function createSecurityEvent(
        string $type,
        string $severity,
        string $description,
        ?int $userId = null,
        ?int $accountId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): SecurityEvent {
        $geolocation = $ipAddress ? $this->getGeolocation($ipAddress) : null;

        return SecurityEvent::create([
            'type' => $type,
            'severity' => $severity,
            'description' => $description,
            'user_id' => $userId,
            'account_id' => $accountId,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'geolocation' => $geolocation
        ]);
    }

    public function blockIP(string $ip, string $reason, bool $isPermanent = false, ?int $hoursToBlock = 24): void
    {
        $existingBlock = BlockedIP::forIP($ip)->active()->first();

        if ($existingBlock) {
            return;
        }

        try {
            BlockedIP::create([
                'ip_address' => $ip,
                'reason' => $reason,
                'is_permanent' => $isPermanent,
                'blocked_at' => now(),
                'expires_at' => $isPermanent ? null : now()->addHours($hoursToBlock),
                'blocked_by' => auth()->id()
            ]);

            Log::warning("IP blocked: {$ip} - Reason: {$reason}");
        } catch (\Exception $e) {
            Log::error("Failed to block IP {$ip}: " . $e->getMessage());
        }
    }

    public function unblockIP(string $ip): bool
    {
        $blocked = BlockedIP::forIP($ip)->active()->first();
        
        if (!$blocked) {
            return false;
        }

        $blocked->update([
            'expires_at' => now()
        ]);

        Log::info("IP unblocked: {$ip}");
        return true;
    }

    public function isIPBlocked(string $ip): bool
    {
        return BlockedIP::forIP($ip)->active()->exists();
    }

    public function getGeolocation(string $ip): ?array
    {
        if ($ip === '127.0.0.1' || $ip === 'localhost') {
            return [
                'country' => 'Local',
                'city' => 'Local',
                'lat' => 0,
                'lon' => 0
            ];
        }

        try {
            $response = Http::timeout(5)->get("http://ip-api.com/json/{$ip}");
            
            if ($response->successful()) {
                $data = $response->json();
                
                if ($data['status'] === 'success') {
                    return [
                        'country' => $data['country'] ?? 'Unknown',
                        'city' => $data['city'] ?? 'Unknown',
                        'lat' => $data['lat'] ?? 0,
                        'lon' => $data['lon'] ?? 0
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning("Failed to get geolocation for IP {$ip}: " . $e->getMessage());
        }

        return null;
    }

    public function getDeviceType(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'unknown';
        }

        $userAgent = strtolower($userAgent);

        if (str_contains($userAgent, 'mobile') || str_contains($userAgent, 'android')) {
            return 'mobile';
        }

        if (str_contains($userAgent, 'tablet') || str_contains($userAgent, 'ipad')) {
            return 'tablet';
        }

        return 'desktop';
    }

    public function getSecurityMetrics(): array
    {
        $last24Hours = now()->subHours(24);
        
        return [
            'total_events' => SecurityEvent::where('created_at', '>=', $last24Hours)->count(),
            'critical_events' => SecurityEvent::where('created_at', '>=', $last24Hours)
                ->where('severity', 'critical')->count(),
            'failed_logins' => LoginAttempt::where('attempted_at', '>=', $last24Hours)
                ->where('success', false)->count(),
            'blocked_ips' => BlockedIP::active()->count(),
            'unresolved_events' => SecurityEvent::unresolved()->count()
        ];
    }

    public function resolveSecurityEvent(int $eventId): bool
    {
        $event = SecurityEvent::find($eventId);
        
        if (!$event) {
            return false;
        }

        $event->update(['resolved_at' => now()]);
        
        return true;
    }

    public function getRecentSecurityEvents(int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return SecurityEvent::with(['user', 'account'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getRecentLoginAttempts(int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return LoginAttempt::orderBy('attempted_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getBlockedIPs(): \Illuminate\Database\Eloquent\Collection
    {
        return BlockedIP::with('blockedBy')
            ->active()
            ->orderBy('blocked_at', 'desc')
            ->get();
    }
}