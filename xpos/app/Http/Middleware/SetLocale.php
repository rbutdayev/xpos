<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        // Default locale
        $locale = config('app.locale', 'en');

        // If user is authenticated, check their language preference
        if (Auth::check()) {
            $user = Auth::user();

            // 1. First priority: User's personal language preference
            if ($user->language) {
                $locale = $user->language;
            }
            // 2. Second priority: Account's default language
            elseif ($user->account && $user->account->language) {
                $locale = $user->account->language;
            }
            // 3. Third priority: Company's default language
            elseif ($user->currentCompany && $user->currentCompany->default_language) {
                $locale = $user->currentCompany->default_language;
            }
        }

        // For API requests, allow language override via header
        if ($request->hasHeader('X-Locale')) {
            $requestedLocale = $request->header('X-Locale');
            if (in_array($requestedLocale, ['en', 'az'])) {
                $locale = $requestedLocale;
            }
        }

        // Set the application locale
        App::setLocale($locale);

        return $next($request);
    }
}
