<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SecurityMonitoringService;
use App\Models\SecurityEvent;
use App\Models\LoginAttempt;
use App\Models\BlockedIP;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    public function __construct(
        private SecurityMonitoringService $securityService
    ) {}

    public function index(): Response
    {
        return Inertia::render('SuperAdmin/SecurityCenter', [
            'metrics' => $this->securityService->getSecurityMetrics(),
            'recentEvents' => $this->securityService->getRecentSecurityEvents(10),
            'recentAttempts' => $this->securityService->getRecentLoginAttempts(20),
            'blockedIPs' => $this->securityService->getBlockedIPs()
        ]);
    }

    public function getMetrics(): JsonResponse
    {
        return response()->json([
            'metrics' => $this->securityService->getSecurityMetrics()
        ]);
    }

    public function getSecurityEvents(Request $request): JsonResponse
    {
        $query = SecurityEvent::with(['user', 'account'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('resolved')) {
            if ($request->boolean('resolved')) {
                $query->whereNotNull('resolved_at');
            } else {
                $query->whereNull('resolved_at');
            }
        }

        if ($request->filled('hours')) {
            $query->where('created_at', '>=', now()->subHours($request->hours));
        }

        $events = $query->paginate($request->get('per_page', 20));

        return response()->json($events);
    }

    public function getLoginAttempts(Request $request): JsonResponse
    {
        $query = LoginAttempt::orderBy('attempted_at', 'desc');

        if ($request->filled('success')) {
            $query->where('success', $request->boolean('success'));
        }

        if ($request->filled('ip')) {
            $query->where('ip_address', $request->ip);
        }

        if ($request->filled('email')) {
            $query->where('email', 'like', '%' . $request->email . '%');
        }

        if ($request->filled('hours')) {
            $query->where('attempted_at', '>=', now()->subHours($request->hours));
        }

        $attempts = $query->paginate($request->get('per_page', 50));

        return response()->json($attempts);
    }

    public function getBlockedIPs(): JsonResponse
    {
        $blockedIPs = BlockedIP::with('blockedBy')
            ->active()
            ->orderBy('blocked_at', 'desc')
            ->get();

        return response()->json($blockedIPs);
    }

    public function blockIP(Request $request): JsonResponse
    {
        $request->validate([
            'ip_address' => 'required|ip',
            'reason' => 'required|string|max:500',
            'is_permanent' => 'boolean',
            'hours' => 'integer|min:1|max:8760'
        ]);

        $this->securityService->blockIP(
            $request->ip_address,
            $request->reason,
            $request->boolean('is_permanent'),
            $request->get('hours', 24)
        );

        return response()->json([
            'message' => 'IP address blocked successfully',
            'blocked_ips' => $this->securityService->getBlockedIPs()
        ]);
    }

    public function unblockIP(Request $request): JsonResponse
    {
        $request->validate([
            'ip_address' => 'required|ip'
        ]);

        $success = $this->securityService->unblockIP($request->ip_address);

        if (!$success) {
            return response()->json([
                'message' => 'IP address not found or already unblocked'
            ], 404);
        }

        return response()->json([
            'message' => 'IP address unblocked successfully',
            'blocked_ips' => $this->securityService->getBlockedIPs()
        ]);
    }

    public function resolveEvent(Request $request, int $eventId): JsonResponse
    {
        $success = $this->securityService->resolveSecurityEvent($eventId);

        if (!$success) {
            return response()->json([
                'message' => 'Security event not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Security event resolved successfully'
        ]);
    }

    public function getSuspiciousActivity(Request $request): JsonResponse
    {
        $suspiciousEvents = SecurityEvent::where('type', SecurityEvent::TYPES['SUSPICIOUS_ACTIVITY'])
            ->with(['user', 'account'])
            ->when($request->filled('hours'), function ($query) use ($request) {
                $query->where('created_at', '>=', now()->subHours($request->hours));
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($suspiciousEvents);
    }

    public function getThreatLevel(): JsonResponse
    {
        $metrics = $this->securityService->getSecurityMetrics();
        
        $threatLevel = 'low';
        $threats = [];

        if ($metrics['critical_events'] > 0) {
            $threatLevel = 'critical';
            $threats[] = "Critical security events detected";
        } elseif ($metrics['failed_logins'] > 50) {
            $threatLevel = 'high';
            $threats[] = "High number of failed login attempts";
        } elseif ($metrics['unresolved_events'] > 10) {
            $threatLevel = 'medium';
            $threats[] = "Multiple unresolved security events";
        }

        return response()->json([
            'level' => $threatLevel,
            'threats' => $threats,
            'metrics' => $metrics
        ]);
    }

    public function exportSecurityReport(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'format' => 'string|in:json,csv'
        ]);

        $events = SecurityEvent::with(['user', 'account'])
            ->whereBetween('created_at', [$request->start_date, $request->end_date])
            ->orderBy('created_at', 'desc')
            ->get();

        $loginAttempts = LoginAttempt::whereBetween('attempted_at', [$request->start_date, $request->end_date])
            ->get();

        $report = [
            'period' => [
                'start' => $request->start_date,
                'end' => $request->end_date
            ],
            'summary' => [
                'total_events' => $events->count(),
                'critical_events' => $events->where('severity', 'critical')->count(),
                'high_events' => $events->where('severity', 'high')->count(),
                'medium_events' => $events->where('severity', 'medium')->count(),
                'low_events' => $events->where('severity', 'low')->count(),
                'total_login_attempts' => $loginAttempts->count(),
                'failed_login_attempts' => $loginAttempts->where('success', false)->count(),
                'successful_login_attempts' => $loginAttempts->where('success', true)->count()
            ],
            'events' => $events,
            'login_attempts' => $loginAttempts
        ];

        return response()->json($report);
    }

    public function getAuditLogs(Request $request): JsonResponse
    {
        $query = \App\Models\AuditLog::with(['user', 'account'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        if ($request->filled('ip')) {
            $query->where('ip_address', $request->ip);
        }

        if ($request->filled('hours')) {
            $query->where('created_at', '>=', now()->subHours($request->hours));
        }

        $logs = $query->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }
}