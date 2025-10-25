<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptTemplate extends Model
{
    use BelongsToAccount;

    protected $primaryKey = 'template_id';

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'template_id';
    }

    protected $fillable = [
        'account_id',
        'name',
        'type',
        'template_content',
        'variables',
        'paper_size',
        'width_chars',
        'is_default',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'width_chars' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function getAvailableVariables(): array
    {
        $baseVariables = [
            'company_name' => 'Şirkət adı',
            'company_address' => 'Şirkət ünvanı',
            'company_phone' => 'Şirkət telefonu',
            'company_email' => 'Şirkət email',
            'company_website' => 'Şirkət veb saytı',
            'tax_number' => 'Vergi nömrəsi',
            'branch_name' => 'Filial adı',
            'branch_address' => 'Filial ünvanı',
            'branch_phone' => 'Filial telefonu',
            'branch_email' => 'Filial email',
            'date' => 'Tarix',
            'time' => 'Vaxt',
            'receipt_number' => 'Qəbz nömrəsi',
            'divider' => 'Ayırıcı xətt (---)',
        ];

        switch ($this->type) {
            case 'sale':
                return array_merge($baseVariables, [
                    'customer_name' => 'Müştəri adı',
                    'customer_phone' => 'Müştəri telefonu',
                    'items' => 'Məhsullar',
                    'subtotal' => 'Ara cəm',
                    'tax_amount' => 'Vergi məbləği',
                    'discount_amount' => 'Endirim məbləği',
                    'total' => 'Ümumi məbləğ',
                    'payment_method' => 'Ödəniş üsulu',
                ]);
            
            case 'service':
                return array_merge($baseVariables, [
                    'customer_name' => 'Müştəri adı',
                    'vehicle_plate' => 'Avtomobil nömrəsi',
                    'vehicle_brand' => 'Avtomobil markası',
                    'service_description' => 'Xidmət təsviri',
                    'employee_name' => 'Texnik adı',
                    'labor_cost' => 'İş haqqı',
                    'parts_cost' => 'Hissələrin dəyəri',
                    'total_cost' => 'Ümumi dəyər',
                ]);

            case 'customer_item':
                return array_merge($baseVariables, [
                    'customer_name' => 'Müştəri adı',
                    'customer_phone' => 'Müştəri telefonu',
                    'item_type' => 'Məhsul növü',
                    'service_type' => 'Xidmət növü',
                    'item_description' => 'Məhsul təsviri',
                    'item_color' => 'Rəng',
                    'fabric_type' => 'Parça növü',
                    'reference_number' => 'Referans nömrəsi',
                    'received_date' => 'Qəbul tarixi',
                    'status' => 'Status',
                    'measurements' => 'Ölçülər',
                    'services_count' => 'Xidmət sayı',
                    'services_summary' => 'Xidmətlər siyahısı',
                    'subtotal' => 'Ümumi məbləğ',
                    'paid_amount' => 'Ödənilmiş',
                    'balance' => 'Qalıq',
                    'payment_status' => 'Ödəniş statusu',
                    'notes' => 'Qeydlər',
                ]);

            default:
                return $baseVariables;
        }
    }
}
