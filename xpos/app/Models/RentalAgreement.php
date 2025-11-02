<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class RentalAgreement extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'rental_id',
        'template_id',
        'rental_category',
        'terms_and_conditions',
        'damage_liability_terms',
        'condition_checklist',
        'condition_checklist_return',
        'condition_photos',
        'damage_assessment',
        'damage_fee_calculated',
        'damage_fee_waived',
        'damage_waiver_reason',
        'customer_signature',
        'customer_signed_at',
        'customer_ip',
        'customer_user_agent',
        'staff_user_id',
        'staff_signature',
        'staff_signed_at',
        'pdf_path',
        'pdf_generated_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'condition_checklist' => 'json',
            'condition_checklist_return' => 'json',
            'condition_photos' => 'json',
            'damage_assessment' => 'json',
            'damage_fee_calculated' => 'decimal:2',
            'damage_fee_waived' => 'boolean',
            'customer_signed_at' => 'datetime',
            'staff_signed_at' => 'datetime',
            'pdf_generated_at' => 'datetime',
        ];
    }

    // Relationships
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(RentalAgreementTemplate::class, 'template_id');
    }

    public function staffUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_user_id');
    }

    // Scopes
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function scopeSigned(Builder $query): Builder
    {
        return $query->where('status', 'signed');
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    public function scopeVoided(Builder $query): Builder
    {
        return $query->where('status', 'voided');
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('rental_category', $category);
    }

    // Status Check Methods
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSigned(): bool
    {
        return $this->status === 'signed';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isVoided(): bool
    {
        return $this->status === 'voided';
    }

    // Signature Methods
    public function hasCustomerSignature(): bool
    {
        return !empty($this->customer_signature);
    }

    public function hasStaffSignature(): bool
    {
        return !empty($this->staff_signature);
    }

    public function isFullySigned(): bool
    {
        return $this->hasCustomerSignature() && $this->hasStaffSignature();
    }

    public function signByCustomer(string $signature, string $ip = null, string $userAgent = null): void
    {
        $this->customer_signature = $signature;
        $this->customer_signed_at = now();
        $this->customer_ip = $ip;
        $this->customer_user_agent = $userAgent;

        if ($this->hasStaffSignature() && $this->isDraft()) {
            $this->status = 'signed';
        }

        $this->save();
    }

    public function signByStaff(int $userId, string $signature): void
    {
        $this->staff_user_id = $userId;
        $this->staff_signature = $signature;
        $this->staff_signed_at = now();

        if ($this->hasCustomerSignature() && $this->isDraft()) {
            $this->status = 'signed';
        }

        $this->save();
    }

    // Condition Checklist Methods
    public function hasConditionChecklist(): bool
    {
        return !empty($this->condition_checklist);
    }

    public function hasReturnChecklist(): bool
    {
        return !empty($this->condition_checklist_return);
    }

    public function hasConditionPhotos(): bool
    {
        return !empty($this->condition_photos);
    }

    /**
     * Compare rental and return condition checklists
     */
    public function compareConditions(): array
    {
        if (!$this->hasConditionChecklist() || !$this->hasReturnChecklist()) {
            return [];
        }

        $differences = [];
        $rentalCondition = $this->condition_checklist;
        $returnCondition = $this->condition_checklist_return;

        foreach ($rentalCondition as $key => $rentalValue) {
            $returnValue = $returnCondition[$key] ?? null;

            if ($rentalValue !== $returnValue) {
                $differences[$key] = [
                    'at_rental' => $rentalValue,
                    'at_return' => $returnValue,
                    'deteriorated' => $this->isConditionWorse($rentalValue, $returnValue),
                ];
            }
        }

        return $differences;
    }

    /**
     * Determine if condition has deteriorated
     */
    private function isConditionWorse($rentalValue, $returnValue): bool
    {
        // For boolean values (e.g., powers_on, sealed)
        if (is_bool($rentalValue) && is_bool($returnValue)) {
            return $rentalValue === true && $returnValue === false;
        }

        // For condition ratings (could be implemented based on specific logic)
        $conditionOrder = [
            'Perfect' => 4,
            'Mükəmməl' => 4,
            'Good' => 3,
            'Yaxşı' => 3,
            'Minor scratches' => 2,
            'Kiçik cızıqlar' => 2,
            'Fair' => 2,
            'Orta' => 2,
            'Cracked' => 1,
            'Çat var' => 1,
            'Damaged' => 0,
            'Zədələnib' => 0,
        ];

        $rentalScore = $conditionOrder[$rentalValue] ?? 2;
        $returnScore = $conditionOrder[$returnValue] ?? 2;

        return $returnScore < $rentalScore;
    }

    // Damage Assessment Methods
    public function hasDamageAssessment(): bool
    {
        return !empty($this->damage_assessment);
    }

    public function hasDamageFee(): bool
    {
        return $this->damage_fee_calculated > 0;
    }

    public function isDamageFeeWaived(): bool
    {
        return $this->damage_fee_waived;
    }

    public function assessDamage(array $assessment, float $fee): void
    {
        $this->damage_assessment = $assessment;
        $this->damage_fee_calculated = $fee;
        $this->save();
    }

    public function waiveDamageFee(string $reason): void
    {
        $this->damage_fee_waived = true;
        $this->damage_waiver_reason = $reason;
        $this->save();
    }

    // PDF Methods
    public function hasPdf(): bool
    {
        return !empty($this->pdf_path) && file_exists(storage_path('app/' . $this->pdf_path));
    }

    public function getPdfUrl(): ?string
    {
        if (!$this->hasPdf()) {
            return null;
        }

        return route('rental.agreement.pdf', ['agreement' => $this->id]);
    }

    public function setPdfPath(string $path): void
    {
        $this->pdf_path = $path;
        $this->pdf_generated_at = now();
        $this->save();
    }

    // Status Update Methods
    public function markAsSigned(): void
    {
        if ($this->isFullySigned()) {
            $this->status = 'signed';
            $this->save();
        }
    }

    public function markAsCompleted(): void
    {
        $this->status = 'completed';
        $this->save();
    }

    public function markAsVoided(string $reason = null): void
    {
        $this->status = 'voided';
        if ($reason) {
            $this->notes = $reason;
        }
        $this->save();
    }

    // Helper Methods
    public function getConditionSummary(): array
    {
        return [
            'has_checklist' => $this->hasConditionChecklist(),
            'has_return_checklist' => $this->hasReturnChecklist(),
            'has_photos' => $this->hasConditionPhotos(),
            'has_damage' => $this->hasDamageAssessment(),
            'damage_fee' => $this->damage_fee_calculated,
            'fee_waived' => $this->isDamageFeeWaived(),
            'differences' => $this->compareConditions(),
        ];
    }
}
