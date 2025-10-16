<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Attempting;
use App\Services\SecurityMonitoringService;

class TrackLoginAttempts
{
    public function __construct(
        private SecurityMonitoringService $securityService
    ) {}

    public function handleLogin(Login $event): void
    {
        $request = request();
        
        $this->securityService->trackLoginAttempt(
            $event->user->email,
            $request->ip(),
            true,
            $request->userAgent()
        );

        // Log successful login as security event for admin accounts
        if ($event->user->is_super_admin || $event->user->hasRole('admin')) {
            $this->securityService->createSecurityEvent(
                'ADMIN_ACCESS',
                'medium',
                "Admin user {$event->user->email} logged in successfully",
                $event->user->id,
                $event->user->account_id,
                $request->ip(),
                $request->userAgent()
            );
        }
    }

    public function handleFailed(Failed $event): void
    {
        $request = request();
        $email = $request->input('email', 'unknown');
        
        $this->securityService->trackLoginAttempt(
            $email,
            $request->ip(),
            false,
            $request->userAgent()
        );

        // Create security event for failed login
        $this->securityService->createSecurityEvent(
            'FAILED_LOGIN',
            'low',
            "Failed login attempt for email: {$email}",
            null,
            null,
            $request->ip(),
            $request->userAgent()
        );
    }

    public function subscribe($events): void
    {
        $events->listen(
            Login::class,
            [TrackLoginAttempts::class, 'handleLogin']
        );

        $events->listen(
            Failed::class,
            [TrackLoginAttempts::class, 'handleFailed']
        );
    }
}