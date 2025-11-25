<?php

namespace App\Http\Controllers;

use App\Models\FiscalPrinterConfig;
use App\Models\LoyaltyProgram;
use App\Models\SmsCredential;
use App\Models\SmsLog;
use App\Models\TelegramCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class IntegrationsController extends Controller
{
    /**
     * Display integrations marketplace
     */
    public function index()
    {
        Gate::authorize('access-account-data');

        $accountId = Auth::user()->account_id;
        $account = Auth::user()->account;

        // Check SMS configuration
        $smsConfigured = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->exists();

        // Check Telegram configuration
        $telegramConfigured = TelegramCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->exists();

        // Check Fiscal Printer configuration
        $fiscalPrinterConfig = FiscalPrinterConfig::where('account_id', $accountId)->first();
        $fiscalPrinterConfigured = $fiscalPrinterConfig !== null;
        $fiscalPrinterEnabled = $account->fiscal_printer_enabled ?? false;

        // Check Loyalty Program configuration
        $loyaltyProgram = LoyaltyProgram::where('account_id', $accountId)->first();
        $loyaltyProgramConfigured = $loyaltyProgram !== null;
        $loyaltyProgramActive = $loyaltyProgram?->is_active ?? false;

        return Inertia::render('Integrations/Index', [
            'smsConfigured' => $smsConfigured,
            'telegramConfigured' => $telegramConfigured,
            'fiscalPrinterConfigured' => $fiscalPrinterConfigured,
            'fiscalPrinterEnabled' => $fiscalPrinterEnabled,
            'loyaltyProgramConfigured' => $loyaltyProgramConfigured,
            'loyaltyProgramActive' => $loyaltyProgramActive,
        ]);
    }

    /**
     * Display SMS integration settings
     */
    public function sms()
    {
        Gate::authorize('access-account-data');

        $accountId = Auth::user()->account_id;
        $credentials = SmsCredential::where('account_id', $accountId)->first();

        // Get statistics
        $total = SmsLog::where('account_id', $accountId)->count();
        $sent = SmsLog::where('account_id', $accountId)->where('status', 'sent')->count();
        $failed = SmsLog::where('account_id', $accountId)->where('status', 'failed')->count();
        $pending = SmsLog::where('account_id', $accountId)->where('status', 'pending')->count();

        return Inertia::render('Integrations/SMS/Settings', [
            'credentials' => $credentials,
            'statistics' => [
                'total' => $total,
                'sent' => $sent,
                'failed' => $failed,
                'pending' => $pending,
            ],
        ]);
    }

    /**
     * Display Telegram integration settings
     */
    public function telegram()
    {
        Gate::authorize('access-account-data');

        $accountId = Auth::user()->account_id;
        $credentials = TelegramCredential::where('account_id', $accountId)->first();

        return Inertia::render('Integrations/Telegram/Settings', [
            'credentials' => $credentials,
        ]);
    }
}
