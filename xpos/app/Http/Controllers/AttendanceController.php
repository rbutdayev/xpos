<?php

namespace App\Http\Controllers;

use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->middleware('auth');
        $this->middleware('account.access');
        $this->attendanceService = $attendanceService;
    }

    /**
     * Show attendance scan page
     *
     * @return \Inertia\Response
     */
    public function scan()
    {
        Gate::authorize('use-attendance');

        $user = Auth::user();

        // Get user's branch information
        $branch = $user->branch()->select('id', 'name', 'address', 'latitude', 'longitude')->first();

        // Get today's attendance status
        $todayCheckIn = null;
        $todayCheckOut = null;

        if ($branch) {
            $todayCheckIn = $this->attendanceService->getUserTodayCheckIn($user->id);

            if ($todayCheckIn) {
                $todayCheckOut = \App\Models\AttendanceRecord::where('user_id', $user->id)
                    ->where('account_id', $user->account_id)
                    ->where('type', 'check_out')
                    ->whereDate('recorded_at', today())
                    ->first();
            }
        }

        return Inertia::render('Attendance/Scan', [
            'userBranch' => $branch,
            'todayCheckIn' => $todayCheckIn,
            'todayCheckOut' => $todayCheckOut,
            'allowedRadius' => \App\Services\AttendanceService::DEFAULT_ALLOWED_RADIUS_METERS,
        ]);
    }

    /**
     * Get current attendance status (API endpoint)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function status()
    {
        Gate::authorize('use-attendance');

        $user = Auth::user();

        $todayCheckIn = $this->attendanceService->getUserTodayCheckIn($user->id);
        $todayCheckOut = null;

        if ($todayCheckIn) {
            $todayCheckOut = \App\Models\AttendanceRecord::where('user_id', $user->id)
                ->where('account_id', $user->account_id)
                ->where('type', 'check_out')
                ->whereDate('recorded_at', today())
                ->first();
        }

        return response()->json([
            'check_in' => $todayCheckIn,
            'check_out' => $todayCheckOut,
        ]);
    }

    /**
     * Process check-in
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkIn(Request $request)
    {
        Gate::authorize('use-attendance');

        $validated = $request->validate([
            'method' => ['required', 'in:gps,qr'],
            'latitude' => ['required_if:method,gps', 'nullable', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['required_if:method,gps', 'nullable', 'numeric', 'min:-180', 'max:180'],
            'accuracy' => ['required_if:method,gps', 'nullable', 'integer', 'min:0'],
            'branch_id' => ['required_if:method,qr', 'nullable', 'integer', 'exists:branches,id'],
        ]);

        $user = Auth::user();

        // For QR-based check-in, validate branch belongs to account
        if ($validated['method'] === 'qr') {
            $branch = \App\Models\Branch::where('id', $validated['branch_id'])
                ->where('account_id', $user->account_id)
                ->first();

            if (!$branch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid branch or branch does not belong to your account.',
                ], 422);
            }

            // For QR check-in, use branch location as attendance location
            $result = $this->attendanceService->checkIn(
                $user->id,
                $branch->latitude,
                $branch->longitude,
                0 // Perfect accuracy for QR-based check-in
            );
        } else {
            // GPS-based check-in
            $result = $this->attendanceService->checkIn(
                $user->id,
                $validated['latitude'],
                $validated['longitude'],
                $validated['accuracy']
            );
        }

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Process check-out
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkOut(Request $request)
    {
        Gate::authorize('use-attendance');

        $validated = $request->validate([
            'method' => ['required', 'in:gps,qr'],
            'latitude' => ['required_if:method,gps', 'nullable', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['required_if:method,gps', 'nullable', 'numeric', 'min:-180', 'max:180'],
            'accuracy' => ['required_if:method,gps', 'nullable', 'integer', 'min:0'],
            'branch_id' => ['required_if:method,qr', 'nullable', 'integer', 'exists:branches,id'],
        ]);

        $user = Auth::user();

        // For QR-based check-out, validate branch belongs to account
        if ($validated['method'] === 'qr') {
            $branch = \App\Models\Branch::where('id', $validated['branch_id'])
                ->where('account_id', $user->account_id)
                ->first();

            if (!$branch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid branch or branch does not belong to your account.',
                ], 422);
            }

            // For QR check-out, use branch location as attendance location
            $result = $this->attendanceService->checkOut(
                $user->id,
                $branch->latitude,
                $branch->longitude,
                0 // Perfect accuracy for QR-based check-out
            );
        } else {
            // GPS-based check-out
            $result = $this->attendanceService->checkOut(
                $user->id,
                $validated['latitude'],
                $validated['longitude'],
                $validated['accuracy']
            );
        }

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Show personal attendance history
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function history(Request $request)
    {
        Gate::authorize('use-attendance');

        $user = Auth::user();

        // Validate filters
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;
        $perPage = $validated['per_page'] ?? 25;

        // Get attendance records
        $query = \App\Models\AttendanceRecord::where('user_id', $user->id)
            ->where('account_id', $user->account_id)
            ->with('branch:id,name');

        if ($startDate) {
            $query->whereDate('recorded_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('recorded_at', '<=', $endDate);
        }

        $records = $query->orderBy('recorded_at', 'desc')->paginate($perPage);

        // Calculate monthly statistics if date range is provided
        $monthlyStats = null;
        if ($startDate && $endDate) {
            $month = \Carbon\Carbon::parse($startDate)->format('Y-m');
            $monthlyStats = $this->attendanceService->getUserMonthlyStats($user->id, $month);
        }

        return Inertia::render('Attendance/History', [
            'records' => $records,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'per_page' => $perPage,
            ],
            'monthlyStats' => $monthlyStats,
        ]);
    }
}
