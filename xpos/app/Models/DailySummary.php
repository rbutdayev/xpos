<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailySummary extends Model
{
    use BelongsToAccount;

    protected $primaryKey = 'summary_id';

    protected $fillable = [
        'account_id',
        'branch_id',
        'date',
        'total_sales',
        'total_revenue',
        'total_cost',
        'gross_profit',
        'sales_count',
        'customers_served',
        'services_completed',
        'service_revenue',
        'products_sold',
        'cash_sales',
        'card_sales',
        'credit_sales',
        'average_sale_value',
    ];

    protected $casts = [
        'date' => 'date',
        'total_sales' => 'decimal:2',
        'total_revenue' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'gross_profit' => 'decimal:2',
        'service_revenue' => 'decimal:2',
        'cash_sales' => 'decimal:2',
        'card_sales' => 'decimal:2',
        'credit_sales' => 'decimal:2',
        'average_sale_value' => 'decimal:2',
        'sales_count' => 'integer',
        'customers_served' => 'integer',
        'services_completed' => 'integer',
        'products_sold' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('date', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereBetween('date', [
            now()->startOfMonth(),
            now()->endOfMonth()
        ]);
    }

    public function scopeLastMonth($query)
    {
        return $query->whereBetween('date', [
            now()->subMonth()->startOfMonth(),
            now()->subMonth()->endOfMonth()
        ]);
    }

    public function getGrossProfitMarginAttribute(): float
    {
        if ($this->total_revenue == 0) {
            return 0;
        }
        return ($this->gross_profit / $this->total_revenue) * 100;
    }

    public static function generateForDate(int $accountId, int $branchId, $date): self
    {
        $summary = self::firstOrNew([
            'account_id' => $accountId,
            'branch_id' => $branchId,
            'date' => $date,
        ]);

        // Calculate sales data
        $salesData = Sale::where('account_id', $accountId)
            ->where('branch_id', $branchId)
            ->whereDate('sale_date', $date)
            ->where('status', 'completed')
            ->selectRaw('
                COUNT(*) as sales_count,
                SUM(total) as total_sales,
                SUM(subtotal) as total_revenue,
                COUNT(DISTINCT customer_id) as customers_served,
                SUM(CASE WHEN has_negative_stock = ? THEN 1 ELSE 0 END) as products_sold,
                AVG(total) as average_sale_value
            ', [true])
            ->first();

        // Calculate payment method breakdowns
        $paymentData = Sale::where('account_id', $accountId)
            ->where('branch_id', $branchId)
            ->whereDate('sale_date', $date)
            ->where('status', 'completed')
            ->with('payments')
            ->get()
            ->flatMap(fn($sale) => $sale->payments)
            ->groupBy('method')
            ->map(fn($payments) => $payments->sum('amount'));

        // Calculate service data
        $serviceData = TailorService::where('account_id', $accountId)
            ->whereDate('service_date', $date)
            ->where('status', 'completed')
            ->selectRaw('
                COUNT(*) as services_completed,
                SUM(total_cost) as service_revenue
            ')
            ->first();

        $summary->fill([
            'total_sales' => $salesData->total_sales ?? 0,
            'total_revenue' => $salesData->total_revenue ?? 0,
            'total_cost' => 0, // Will be calculated from product costs
            'gross_profit' => ($salesData->total_sales ?? 0) - 0, // Simplified for now
            'sales_count' => $salesData->sales_count ?? 0,
            'customers_served' => $salesData->customers_served ?? 0,
            'services_completed' => $serviceData->services_completed ?? 0,
            'service_revenue' => $serviceData->service_revenue ?? 0,
            'products_sold' => $salesData->products_sold ?? 0,
            'cash_sales' => $paymentData['nağd'] ?? 0,
            'card_sales' => $paymentData['kart'] ?? 0,
            'credit_sales' => Sale::whereDate('sale_date', $date)
                ->where('account_id', $accountId)
                ->where('is_credit_sale', true)
                ->sum('credit_amount'),
            'average_sale_value' => $salesData->average_sale_value ?? 0,
        ]);

        $summary->save();

        return $summary;
    }
}
