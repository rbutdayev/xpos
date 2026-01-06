<?php

namespace App\Http\Controllers;

use App\Models\SmsCredential;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class SmsController extends Controller
{
    protected SmsService $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Display SMS settings page
     */
    public function index()
    {
        $accountId = Auth::user()->account_id;
        $credentials = SmsCredential::where('account_id', $accountId)->first();
        $statistics = $this->smsService->getStatistics($accountId);

        return Inertia::render('SMS/Settings', [
            'credentials' => $credentials ? [
                'id' => $credentials->id,
                'gateway_url' => $credentials->gateway_url,
                'login' => $credentials->login,
                'sender_name' => $credentials->sender_name,
                'is_active' => $credentials->is_active,
            ] : null,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Display SMS send page
     */
    public function sendPage(Request $request)
    {
        $accountId = Auth::user()->account_id;

        $hasCredentials = SmsCredential::where('account_id', $accountId)
            ->where('is_active', true)
            ->exists();

        // Get total count for statistics
        $totalCustomersWithPhone = \App\Models\Customer::where('account_id', $accountId)
            ->whereNotNull('phone')
            ->count();

        // Get customers based on search (limit to 20 results for dropdown)
        $customers = ['data' => []];

        if ($request->has('search') && strlen($request->search) >= 2) {
            $search = $request->search;
            $customers['data'] = \App\Models\Customer::where('account_id', $accountId)
                ->whereNotNull('phone')
                ->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('phone', 'like', '%' . $search . '%');
                })
                ->select('id', 'name', 'phone')
                ->orderBy('name')
                ->limit(20)
                ->get()
                ->toArray();
        }

        return Inertia::render('SMS/Send', [
            'customers' => $customers,
            'totalCustomersWithPhone' => $totalCustomersWithPhone,
            'hasCredentials' => $hasCredentials,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store or update SMS credentials
     */
    public function storeCredentials(Request $request)
    {
        $validated = $request->validate([
            'login' => 'required|string',
            'password' => 'nullable|string',
            'sender_name' => 'required|string|max:11',
            'is_active' => 'boolean',
        ]);

        $accountId = Auth::user()->account_id;

        // Prepare data for update/create
        $data = [
            'gateway_url' => 'https://apps.lsim.az/quicksms/v1/smssender',
            'login' => $validated['login'],
            'sender_name' => $validated['sender_name'],
            'is_active' => $validated['is_active'] ?? true,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $data['password'] = $validated['password'];
        }

        // Always use LSIM gateway - it's the only provider
        $credentials = SmsCredential::updateOrCreate(
            ['account_id' => $accountId],
            $data
        );

        return back()->with('success', 'SMS parametrləri uğurla yadda saxlanıldı');
    }

    /**
     * Send a single SMS
     */
    public function send(Request $request)
    {
        $validated = $request->validate([
            'phone_number' => 'required|string',
            'message' => 'required|string|max:500',
        ]);

        $accountId = Auth::user()->account_id;

        $result = $this->smsService->send(
            $accountId,
            $validated['phone_number'],
            $validated['message']
        );

        if ($result['success']) {
            return back()->with('success', 'SMS sent successfully');
        } else {
            return back()->withErrors(['error' => $result['error']]);
        }
    }

    /**
     * Send bulk SMS
     */
    public function sendBulk(Request $request)
    {
        $validated = $request->validate([
            'phone_numbers' => 'required|array',
            'phone_numbers.*' => 'required|string',
            'message' => 'required|string|max:500',
        ]);

        $accountId = Auth::user()->account_id;

        $result = $this->smsService->sendBulk(
            $accountId,
            $validated['phone_numbers'],
            $validated['message']
        );

        return back()->with('success', "Sent {$result['success']} SMS(es), {$result['failed']} failed");
    }

    /**
     * Send SMS to all customers
     */
    public function sendAll(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $accountId = Auth::user()->account_id;

        // Get all phone numbers for this account
        $phoneNumbers = \App\Models\Customer::where('account_id', $accountId)
            ->whereNotNull('phone')
            ->pluck('phone')
            ->toArray();

        $result = $this->smsService->sendBulk(
            $accountId,
            $phoneNumbers,
            $validated['message']
        );

        return back()->with('success', "Sent {$result['success']} SMS(es), {$result['failed']} failed");
    }

    /**
     * Get SMS logs
     */
    public function logs(Request $request)
    {
        Gate::authorize('view-reports');

        $accountId = Auth::user()->account_id;
        $perPage = $request->input('per_page', 20);

        // Get paginated logs
        $logs = \App\Models\SmsLog::where('account_id', $accountId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return Inertia::render('SMS/Logs', [
            'logs' => $logs,
        ]);
    }

    /**
     * Delete a single SMS log
     */
    public function destroy($id)
    {
        Gate::authorize('delete-account-data');

        $accountId = Auth::user()->account_id;

        $log = \App\Models\SmsLog::where('account_id', $accountId)
            ->findOrFail($id);

        $log->delete();

        return back()->with('success', 'SMS loqu uğurla silindi');
    }

    /**
     * Bulk delete SMS logs
     */
    public function bulkDelete(Request $request)
    {
        Gate::authorize('delete-account-data');

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer',
        ]);

        $accountId = Auth::user()->account_id;

        try {
            \DB::beginTransaction();

            // Only delete logs that belong to the current account
            $deletedCount = \App\Models\SmsLog::where('account_id', $accountId)
                ->whereIn('id', $validated['ids'])
                ->delete();

            \DB::commit();

            return back()->with('success', "{$deletedCount} SMS loqu uğurla silindi");
        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->withErrors(['error' => 'SMS loglarını silmək mümkün olmadı']);
        }
    }

    /**
     * Test SMS sending
     */
    public function test(Request $request)
    {
        $validated = $request->validate([
            'phone_number' => 'required|string',
        ]);

        $accountId = Auth::user()->account_id;

        $result = $this->smsService->send(
            $accountId,
            $validated['phone_number'],
            'This is a test message from XPOS SMS Service'
        );

        return response()->json($result);
    }
}
