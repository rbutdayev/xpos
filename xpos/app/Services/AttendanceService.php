<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\Branch;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceService
{
    /**
     * Earth radius in kilometers for Haversine formula
     */
    const EARTH_RADIUS_KM = 6371;

    /**
     * Default allowed radius in meters
     */
    const DEFAULT_ALLOWED_RADIUS_METERS = 200;

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     *
     * @param float $lat1 Latitude of point 1
     * @param float $lon1 Longitude of point 1
     * @param float $lat2 Latitude of point 2
     * @param float $lon2 Longitude of point 2
     * @return float Distance in meters
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        // Convert degrees to radians
        $lat1Rad = deg2rad($lat1);
        $lon1Rad = deg2rad($lon1);
        $lat2Rad = deg2rad($lat2);
        $lon2Rad = deg2rad($lon2);

        // Haversine formula
        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLon = $lon2Rad - $lon1Rad;

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLon / 2) * sin($deltaLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        // Distance in kilometers
        $distanceKm = self::EARTH_RADIUS_KM * $c;

        // Convert to meters
        return $distanceKm * 1000;
    }

    /**
     * Validate if GPS location is within allowed radius of branch
     *
     * @param float $latitude User's latitude
     * @param float $longitude User's longitude
     * @param int $branchId Branch ID
     * @param int $accountId Account ID for multi-tenant security
     * @return array ['valid' => bool, 'distance' => float, 'message' => string]
     */
    public function validateGPSLocation(float $latitude, float $longitude, int $branchId, int $accountId): array
    {
        $branch = Branch::where('id', $branchId)
            ->where('account_id', $accountId)
            ->first();

        if (!$branch) {
            return [
                'valid' => false,
                'distance' => null,
                'message' => 'Filial tapılmadı.'
            ];
        }

        if (!$branch->latitude || !$branch->longitude) {
            return [
                'valid' => false,
                'distance' => null,
                'message' => 'Filial üçün GPS koordinatları təyin edilməyib.'
            ];
        }

        $distance = $this->calculateDistance(
            $latitude,
            $longitude,
            $branch->latitude,
            $branch->longitude
        );

        $allowedRadius = self::DEFAULT_ALLOWED_RADIUS_METERS;

        $isValid = $distance <= $allowedRadius;

        return [
            'valid' => $isValid,
            'distance' => round($distance, 2),
            'allowed_radius' => $allowedRadius,
            'message' => $isValid
                ? 'GPS yeri təsdiqləndi.'
                : "Siz filialdan " . round($distance, 2) . "m məsafədəsiniz. İcazə verilən radius: {$allowedRadius}m."
        ];
    }

    /**
     * Get user's attendance record for today
     *
     * @param int $userId
     * @return AttendanceRecord|null
     */
    public function getUserTodayCheckIn(int $userId): ?AttendanceRecord
    {
        $user = User::find($userId);

        if (!$user) {
            return null;
        }

        return AttendanceRecord::where('user_id', $userId)
            ->where('account_id', $user->account_id)
            ->where('type', 'check_in')
            ->whereDate('recorded_at', today())
            ->first();
    }

    /**
     * Process user check-in
     *
     * @param int $userId
     * @param float $latitude
     * @param float $longitude
     * @param float $accuracy GPS accuracy in meters
     * @return array ['success' => bool, 'message' => string, 'attendance' => AttendanceRecord|null]
     */
    public function checkIn(int $userId, float $latitude, float $longitude, float $accuracy): array
    {
        $user = User::with('branch')->find($userId);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'İstifadəçi tapılmadı.',
                'attendance' => null
            ];
        }

        if (!$user->branch_id) {
            return [
                'success' => false,
                'message' => 'Sizə filial təyin edilməyib. Administrator ilə əlaqə saxlayın.',
                'attendance' => null
            ];
        }

        // Check if already checked in today
        $existingCheckIn = $this->getUserTodayCheckIn($userId);

        if ($existingCheckIn) {
            return [
                'success' => false,
                'message' => 'Siz artıq bu gün işə gəlmə qeydiyyatından keçmisiniz.',
                'attendance' => $existingCheckIn
            ];
        }

        // Validate GPS location
        $gpsValidation = $this->validateGPSLocation(
            $latitude,
            $longitude,
            $user->branch_id,
            $user->account_id
        );

        if (!$gpsValidation['valid']) {
            Log::warning('Attendance check-in GPS validation failed', [
                'user_id' => $userId,
                'branch_id' => $user->branch_id,
                'distance' => $gpsValidation['distance'],
                'message' => $gpsValidation['message']
            ]);

            return [
                'success' => false,
                'message' => $gpsValidation['message'],
                'attendance' => null,
                'distance' => $gpsValidation['distance']
            ];
        }

        try {
            $attendance = AttendanceRecord::create([
                'user_id' => $userId,
                'branch_id' => $user->branch_id,
                'account_id' => $user->account_id,
                'type' => 'check_in',
                'recorded_at' => now(),
                'latitude' => $latitude,
                'longitude' => $longitude,
                'gps_accuracy' => $accuracy,
                'is_within_branch_radius' => true,
                'distance_from_branch' => $gpsValidation['distance'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'device_type' => $this->detectDeviceType(request()->userAgent()),
            ]);

            Log::info('User checked in successfully', [
                'user_id' => $userId,
                'attendance_id' => $attendance->id,
                'distance' => $gpsValidation['distance']
            ]);

            return [
                'success' => true,
                'message' => 'İşə gəlmə qeydiyyatı uğurla tamamlandı.',
                'attendance' => $attendance,
                'distance' => $gpsValidation['distance']
            ];
        } catch (\Exception $e) {
            Log::error('Attendance check-in failed', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Qeydiyyat zamanı xəta baş verdi. Yenidən cəhd edin.',
                'attendance' => null
            ];
        }
    }

    /**
     * Process user check-out
     *
     * @param int $userId
     * @param float $latitude
     * @param float $longitude
     * @param float $accuracy GPS accuracy in meters
     * @return array ['success' => bool, 'message' => string, 'attendance' => AttendanceRecord|null]
     */
    public function checkOut(int $userId, float $latitude, float $longitude, float $accuracy): array
    {
        $user = User::with('branch')->find($userId);

        if (!$user) {
            return [
                'success' => false,
                'message' => 'İstifadəçi tapılmadı.',
                'attendance' => null
            ];
        }

        // Get today's check-in record
        $checkInRecord = $this->getUserTodayCheckIn($userId);

        if (!$checkInRecord) {
            return [
                'success' => false,
                'message' => 'Bu gün işə gəlmə qeydiyyatınız yoxdur.',
                'attendance' => null
            ];
        }

        // Check if already checked out
        $existingCheckOut = AttendanceRecord::where('user_id', $userId)
            ->where('account_id', $user->account_id)
            ->where('type', 'check_out')
            ->whereDate('recorded_at', today())
            ->first();

        if ($existingCheckOut) {
            return [
                'success' => false,
                'message' => 'Siz artıq işdən çıxış qeydiyyatından keçmisiniz.',
                'attendance' => $existingCheckOut
            ];
        }

        // Validate GPS location
        $gpsValidation = $this->validateGPSLocation(
            $latitude,
            $longitude,
            $user->branch_id,
            $user->account_id
        );

        if (!$gpsValidation['valid']) {
            Log::warning('Attendance check-out GPS validation failed', [
                'user_id' => $userId,
                'check_in_id' => $checkInRecord->id,
                'distance' => $gpsValidation['distance'],
                'message' => $gpsValidation['message']
            ]);

            return [
                'success' => false,
                'message' => $gpsValidation['message'],
                'attendance' => $checkInRecord,
                'distance' => $gpsValidation['distance']
            ];
        }

        try {
            $checkOutRecord = AttendanceRecord::create([
                'user_id' => $userId,
                'branch_id' => $user->branch_id,
                'account_id' => $user->account_id,
                'type' => 'check_out',
                'recorded_at' => now(),
                'latitude' => $latitude,
                'longitude' => $longitude,
                'gps_accuracy' => $accuracy,
                'is_within_branch_radius' => true,
                'distance_from_branch' => $gpsValidation['distance'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'device_type' => $this->detectDeviceType(request()->userAgent()),
            ]);

            Log::info('User checked out successfully', [
                'user_id' => $userId,
                'check_in_id' => $checkInRecord->id,
                'check_out_id' => $checkOutRecord->id,
                'distance' => $gpsValidation['distance']
            ]);

            return [
                'success' => true,
                'message' => "İşdən çıxış qeydiyyatı tamamlandı.",
                'attendance' => $checkOutRecord,
                'distance' => $gpsValidation['distance'],
                'check_in_record' => $checkInRecord
            ];
        } catch (\Exception $e) {
            Log::error('Attendance check-out failed', [
                'user_id' => $userId,
                'check_in_id' => $checkInRecord->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Çıxış qeydiyyatı zamanı xəta baş verdi. Yenidən cəhd edin.',
                'attendance' => $checkInRecord
            ];
        }
    }

    /**
     * Get user's attendance history
     *
     * @param int $userId
     * @param string|null $startDate
     * @param string|null $endDate
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUserAttendanceHistory(int $userId, ?string $startDate = null, ?string $endDate = null)
    {
        $user = User::find($userId);

        if (!$user) {
            return collect([]);
        }

        $query = AttendanceRecord::where('user_id', $userId)
            ->where('account_id', $user->account_id)
            ->with('branch:id,name');

        if ($startDate) {
            $query->whereDate('recorded_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('recorded_at', '<=', $endDate);
        }

        return $query->orderBy('recorded_at', 'desc')->get();
    }

    /**
     * Get attendance statistics for a user
     *
     * @param int $userId
     * @param string $month Format: 'Y-m'
     * @return array
     */
    public function getUserMonthlyStats(int $userId, string $month): array
    {
        $user = User::find($userId);

        if (!$user) {
            return [
                'total_days' => 0,
                'total_hours' => 0,
                'average_hours' => 0,
                'late_arrivals' => 0
            ];
        }

        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        // Get all check-in/check-out pairs for the month
        $dailyRecords = [];
        $current = $startDate->copy();

        while ($current <= $endDate) {
            $pairs = AttendanceRecord::getDailyRecordsForUser(
                $user->account_id,
                $userId,
                $current->format('Y-m-d')
            );

            if (!empty($pairs)) {
                $dailyRecords[$current->format('Y-m-d')] = $pairs;
            }

            $current->addDay();
        }

        $totalDays = count($dailyRecords);
        $totalMinutes = 0;
        $lateArrivals = 0;

        foreach ($dailyRecords as $date => $pairs) {
            foreach ($pairs as $pair) {
                if ($pair['check_out'] && $pair['duration_minutes']) {
                    $totalMinutes += $pair['duration_minutes'];
                }

                // Count late arrivals (after 9:00 AM)
                $checkInTime = Carbon::parse($pair['check_in']->recorded_at);
                if ($checkInTime->format('H:i') > '09:00') {
                    $lateArrivals++;
                }
            }
        }

        $totalHours = $totalMinutes / 60;
        $averageHours = $totalDays > 0 ? $totalHours / $totalDays : 0;

        return [
            'total_days' => $totalDays,
            'total_hours' => round($totalHours, 2),
            'average_hours' => round($averageHours, 2),
            'late_arrivals' => $lateArrivals
        ];
    }

    /**
     * Detect device type from user agent
     *
     * @param string|null $userAgent
     * @return string
     */
    private function detectDeviceType(?string $userAgent): string
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
}
