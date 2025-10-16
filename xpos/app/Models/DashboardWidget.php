<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardWidget extends Model
{
    use BelongsToAccount;

    protected $primaryKey = 'widget_id';

    protected $fillable = [
        'account_id',
        'user_id',
        'type',
        'title',
        'position_x',
        'position_y',
        'width',
        'height',
        'config',
        'is_visible',
        'refresh_interval',
    ];

    protected $casts = [
        'config' => 'array',
        'is_visible' => 'boolean',
        'position_x' => 'integer',
        'position_y' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'refresh_interval' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public static function getAvailableTypes(): array
    {
        return [
            'sales_chart' => 'Satış diaqramı',
            'revenue_chart' => 'Gəlir diaqramı',
            'kpi_sales' => 'Satış KPI',
            'kpi_customers' => 'Müştəri KPI',
            'kpi_inventory' => 'Anbar KPI',
            'top_products' => 'Ən çox satılan məhsullar',
            'recent_sales' => 'Son satışlar',
            'low_stock' => 'Az qalan məhsullar',
            'daily_summary' => 'Günlük xülasə',
            'weekly_trend' => 'Həftəlik trend',
            'monthly_summary' => 'Aylıq xülasə',
        ];
    }
}
