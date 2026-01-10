<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceReportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    /**
     * Display attendance reports with filters
     * GET /attendance/reports
     */
    public function index(Request $request)
    {
        Gate::authorize('view-attendance-reports');

        $user = Auth::user();
        $accountId = $user->account_id;
        $perPage = $request->input('per_page', 20);

        // Build base query
        $query = AttendanceRecord::where('account_id', $accountId)
            ->with(['user:id,name,email', 'branch:id,name']);

        // Branch manager restriction - can only see their branch
        if ($user->role === 'branch_manager' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('date_from')) {
            $startDate = Carbon::parse($request->input('date_from'))->startOfDay();
            $query->where('recorded_at', '>=', $startDate);
        }

        if ($request->filled('date_to')) {
            $endDate = Carbon::parse($request->input('date_to'))->endOfDay();
            $query->where('recorded_at', '<=', $endDate);
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'check_in') {
                $query->checkIns();
            } elseif ($status === 'check_out') {
                $query->checkOuts();
            } elseif ($status === 'manual') {
                $query->manualRecords();
            } elseif ($status === 'auto') {
                $query->autoRecords();
            } elseif ($status === 'within_radius') {
                $query->withinRadius();
            } elseif ($status === 'outside_radius') {
                $query->outsideRadius();
            }
        }

        // Get all check-in records (not paginated yet, we'll paginate the consolidated data)
        $checkIns = $query->where('type', 'check_in')
            ->orderBy('recorded_at', 'desc')
            ->get();

        // Transform to consolidated records (one record per check-in with corresponding check-out)
        $consolidatedRecords = $checkIns->map(function ($checkIn) {
            $checkOut = AttendanceRecord::where('account_id', $checkIn->account_id)
                ->where('user_id', $checkIn->user_id)
                ->where('branch_id', $checkIn->branch_id)
                ->where('type', 'check_out')
                ->where('recorded_at', '>', $checkIn->recorded_at)
                ->whereDate('recorded_at', $checkIn->recorded_at->toDateString())
                ->with(['user:id,name,email', 'branch:id,name'])
                ->first();

            $duration = null;
            $status = 'incomplete';

            if ($checkOut) {
                $duration = $checkIn->recorded_at->diffInMinutes($checkOut->recorded_at);
                $status = 'completed';
            }

            return [
                'id' => $checkIn->id,
                'user' => $checkIn->user,
                'branch' => $checkIn->branch,
                'check_in' => $checkIn->recorded_at->toISOString(),
                'check_out' => $checkOut ? $checkOut->recorded_at->toISOString() : null,
                'duration' => $duration,
                'status' => $status,
                'recorded_at' => $checkIn->recorded_at->toISOString(),
            ];
        });

        // Manual pagination of consolidated records
        $currentPage = $request->input('page', 1);
        $total = $consolidatedRecords->count();
        $items = $consolidatedRecords->forPage($currentPage, $perPage)->values();

        $records = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        // Calculate statistics
        $statsQuery = AttendanceRecord::where('account_id', $accountId);

        // Apply branch manager restriction to stats
        if ($user->role === 'branch_manager' && $user->branch_id) {
            $statsQuery->where('branch_id', $user->branch_id);
        }

        // Apply same filters to stats
        if ($request->filled('branch_id')) {
            $statsQuery->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('user_id')) {
            $statsQuery->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('start_date')) {
            $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
            $statsQuery->where('recorded_at', '>=', $startDate);
        }

        if ($request->filled('end_date')) {
            $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
            $statsQuery->where('recorded_at', '<=', $endDate);
        }

        // Calculate total records and unique employees
        $totalRecords = $statsQuery->count();
        $uniqueEmployees = $statsQuery->distinct('user_id')->count('user_id');

        // Calculate total hours (from check-out records that have corresponding check-ins)
        $totalMinutes = 0;
        $checkOuts = $statsQuery->where('type', 'check_out')->get();

        foreach ($checkOuts as $checkOut) {
            $duration = $checkOut->calculateWorkDuration();
            if ($duration) {
                $totalMinutes += $duration;
            }
        }

        $totalHours = round($totalMinutes / 60, 2);

        $stats = [
            'total_records' => $totalRecords,
            'total_hours' => $totalHours,
            'unique_employees' => $uniqueEmployees,
        ];

        // Get branches for filter dropdown (respecting branch manager restriction)
        $branchesQuery = Branch::where('account_id', $accountId)
            ->where('is_active', true)
            ->select('id', 'name');

        if ($user->role === 'branch_manager' && $user->branch_id) {
            $branchesQuery->where('id', $user->branch_id);
        }

        $branches = $branchesQuery->orderBy('name')->get();

        // Get users for filter dropdown (respecting branch manager restriction)
        $usersQuery = \App\Models\User::where('account_id', $accountId)
            ->where('status', 'active')
            ->select('id', 'name', 'email');

        if ($user->role === 'branch_manager' && $user->branch_id) {
            $usersQuery->where('branch_id', $user->branch_id);
        }

        $users = $usersQuery->orderBy('name')->get();

        return Inertia::render('Attendance/Reports/Index', [
            'attendances' => $records,
            'stats' => $stats,
            'branches' => $branches,
            'users' => $users,
            'filters' => $request->only(['search', 'branch_id', 'user_id', 'date_from', 'date_to', 'status', 'per_page']),
        ]);
    }

    /**
     * Display QR codes for all branches
     * GET /attendance/qr-codes
     */
    public function qrCodes()
    {
        Gate::authorize('manage-attendance');

        $user = Auth::user();
        $accountId = $user->account_id;

        // Get all active branches for the account
        $branches = Branch::where('account_id', $accountId)
            ->where('is_active', true)
            ->select('id', 'name', 'address', 'phone', 'latitude', 'longitude')
            ->orderBy('is_main', 'desc')
            ->orderBy('name')
            ->get();

        // Generate QR code data for each branch
        $qrCodesData = $branches->map(function ($branch) use ($accountId) {
            // QR code data format: account_id:branch_id:timestamp
            // This ensures QR codes are unique and time-sensitive
            $qrData = base64_encode(json_encode([
                'account_id' => $accountId,
                'branch_id' => $branch->id,
                'type' => 'attendance',
                'generated_at' => now()->timestamp,
            ]));

            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'phone' => $branch->phone,
                'latitude' => $branch->latitude,
                'longitude' => $branch->longitude,
                'qr_data' => $qrData,
            ];
        });

        return Inertia::render('Attendance/QRCodes', [
            'branches' => $qrCodesData,
        ]);
    }

    /**
     * Export attendance records to CSV
     * GET /attendance/reports/export
     */
    public function export(Request $request)
    {
        Gate::authorize('view-attendance-reports');

        // Validate parameters
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'user_id' => 'nullable|integer|exists:users,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $user = Auth::user();
        $accountId = $user->account_id;

        // Build query
        $query = AttendanceRecord::where('account_id', $accountId)
            ->with(['user:id,name,email', 'branch:id,name']);

        // Branch manager restriction
        if ($user->role === 'branch_manager' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply filters
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $validated['branch_id']);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $validated['user_id']);
        }

        // Default to last 30 days if no dates provided
        $startDate = $request->filled('date_from')
            ? Carbon::parse($validated['date_from'])->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay();

        $endDate = $request->filled('date_to')
            ? Carbon::parse($validated['date_to'])->endOfDay()
            : Carbon::now()->endOfDay();

        $query->whereBetween('recorded_at', [$startDate, $endDate]);

        // Get records
        $records = $query->orderBy('recorded_at', 'desc')->get();

        // Generate filename
        $filename = "davamiyyət_hesabatı_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}.csv";

        // Stream CSV with UTF-8 BOM for Excel compatibility
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'Cache-Control' => 'no-cache, must-revalidate',
        ];

        $callback = function () use ($records) {
            $file = fopen('php://output', 'w');

            // Add UTF-8 BOM for proper Excel display
            fwrite($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, [
                'ID',
                'İstifadəçi',
                'Filial',
                'Giriş vaxtı',
                'Çıxış vaxtı',
                'Status',
            ]);

            // Group records by user and date to pair check-ins with check-outs
            $recordsByUserDate = [];
            foreach ($records as $record) {
                $userId = $record->user_id;
                $date = $record->recorded_at->format('Y-m-d');
                $key = "{$userId}_{$date}";

                if (!isset($recordsByUserDate[$key])) {
                    $recordsByUserDate[$key] = [
                        'user_name' => $record->user->name ?? 'Naməlum',
                        'branch_name' => $record->branch->name ?? 'Naməlum',
                        'check_ins' => [],
                        'check_outs' => [],
                    ];
                }

                if ($record->type === 'check_in') {
                    $recordsByUserDate[$key]['check_ins'][] = $record;
                } else {
                    $recordsByUserDate[$key]['check_outs'][] = $record;
                }
            }

            // Write data rows
            foreach ($recordsByUserDate as $key => $data) {
                $checkIns = $data['check_ins'];
                $checkOuts = $data['check_outs'];
                $maxRecords = max(count($checkIns), count($checkOuts));

                for ($i = 0; $i < $maxRecords; $i++) {
                    $checkIn = $checkIns[$i] ?? null;
                    $checkOut = $checkOuts[$i] ?? null;

                    $checkInTime = $checkIn ? $checkIn->recorded_at->format('d.m.Y H:i') : '-';
                    $checkOutTime = $checkOut ? $checkOut->recorded_at->format('d.m.Y H:i') : '-';

                    // Determine status
                    $status = '';
                    if ($checkIn && $checkOut) {
                        $status = 'Tamamlandı';
                    } elseif ($checkIn && !$checkOut) {
                        $status = 'Açıq (Çıxış yoxdur)';
                    } elseif (!$checkIn && $checkOut) {
                        $status = 'Yalnız Çıxış';
                    }

                    // Add manual/auto indicator
                    if ($checkIn && $checkIn->is_manual) {
                        $status .= ' (Manual)';
                    } elseif ($checkOut && $checkOut->is_manual) {
                        $status .= ' (Manual)';
                    }

                    $recordId = $checkIn ? $checkIn->id : ($checkOut ? $checkOut->id : '-');

                    fputcsv($file, [
                        $recordId,
                        $data['user_name'],
                        $data['branch_name'],
                        $checkInTime,
                        $checkOutTime,
                        $status,
                    ]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
