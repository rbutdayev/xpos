<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SystemSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display the system settings form
     */
    public function index()
    {
        $user = Auth::user();
        $company = Company::where('account_id', $user->account_id)->first();

        $settings = $this->getDefaultSettings();
        
        if ($company) {
            // Map company data to settings format
            $settings = array_merge($settings, [
                'company_name' => $company->name,
                'company_address' => $company->address,
                'company_phone' => $company->phone,
                'company_email' => $company->email,
                'company_website' => $company->website,
                'tax_number' => $company->tax_number,
                'default_language' => $company->default_language ?? 'az',
                'business_hours' => $company->business_hours,
            ]);
        }

        return Inertia::render('Settings/Index', [
            'company' => $company,
            'settings' => $settings
        ]);
    }

    /**
     * Update the system settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            // Company Information
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string',
            'company_phone' => 'nullable|string|max:255',
            'company_email' => 'nullable|email|max:255',
            'company_website' => 'nullable|url|max:255',
            'tax_number' => 'nullable|string|max:255',
            'default_language' => 'required|string|in:az,en,tr',
            
            // Receipt Settings
            'receipt_header_text' => 'nullable|string|max:255',
            'receipt_footer_text' => 'nullable|string|max:255',
            'default_paper_size' => 'required|in:58mm,80mm,A4,letter',
            'default_width_chars' => 'required|integer|min:20|max:100',
            
            // Regional Settings
            'currency_code' => 'required|string|size:3',
            'currency_symbol' => 'required|string|max:5',
            'date_format' => 'required|string|max:255',
            'time_format' => 'required|string|max:255',
            'timezone' => 'required|string|max:255',
            
            // Business Settings
            'business_hours_start' => 'nullable|date_format:H:i',
            'business_hours_end' => 'nullable|date_format:H:i',
            'business_days' => 'nullable|array',
            'business_days.*' => 'string|in:0,1,2,3,4,5,6',
            
            // Notification Settings
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
            'notification_email' => 'nullable|email|max:255',
            'notification_phone' => 'nullable|string|max:255',
        ]);

        try {
            $user = Auth::user();
            $company = Company::where('account_id', $user->account_id)->first();

            if (!$company) {
                return redirect()->back()->with('error', 'Şirkət məlumatları tapılmadı.');
            }

            // Update company information
            $company->update([
                'name' => $validated['company_name'],
                'address' => $validated['company_address'],
                'phone' => $validated['company_phone'],
                'email' => $validated['company_email'],
                'website' => $validated['company_website'],
                'tax_number' => $validated['tax_number'],
                'default_language' => $validated['default_language'],
                'business_hours' => [
                    'start' => $validated['business_hours_start'] ?? null,
                    'end' => $validated['business_hours_end'] ?? null,
                    'days' => $validated['business_days'] ?? [],
                ],
            ]);

            return redirect()->back()->with('success', 'Sistem ayarları uğurla yeniləndi.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Sistem ayarları yenilənərkən xəta baş verdi: ' . $e->getMessage());
        }
    }

    /**
     * Get default settings structure
     */
    private function getDefaultSettings(): array
    {
        return [
            // Company Information
            'company_name' => '',
            'company_address' => '',
            'company_phone' => '',
            'company_email' => '',
            'company_website' => '',
            'tax_number' => '',
            'default_language' => 'az',
            
            // Receipt Settings
            'receipt_header_text' => 'Xoş gəlmisiniz!',
            'receipt_footer_text' => 'Təşəkkür edirik!',
            'default_paper_size' => '80mm',
            'default_width_chars' => 32,
            
            // Regional Settings
            'currency_code' => 'AZN',
            'currency_symbol' => '₼',
            'date_format' => 'd.m.Y',
            'time_format' => 'H:i',
            'timezone' => 'Asia/Baku',
            
            // Business Settings
            'business_hours_start' => '09:00',
            'business_hours_end' => '18:00',
            'business_days' => ['1', '2', '3', '4', '5'], // Monday to Friday
            
            // Notification Settings
            'email_notifications' => true,
            'sms_notifications' => false,
            'notification_email' => '',
            'notification_phone' => '',
        ];
    }
}
