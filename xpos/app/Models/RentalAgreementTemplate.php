<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class RentalAgreementTemplate extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'name',
        'rental_category',
        'terms_and_conditions_az',
        'terms_and_conditions_en',
        'damage_liability_terms_az',
        'damage_liability_terms_en',
        'condition_checklist',
        'is_active',
        'is_default',
        'require_photos',
        'min_photos',
        'notes',
        'is_master_template',
    ];

    protected function casts(): array
    {
        return [
            'condition_checklist' => 'json',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'require_photos' => 'boolean',
            'min_photos' => 'integer',
            'is_master_template' => 'boolean',
        ];
    }

    // Relationships
    public function agreements(): HasMany
    {
        return $this->hasMany(RentalAgreement::class, 'template_id');
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('rental_category', $category);
    }

    public function scopeMasterTemplates(Builder $query): Builder
    {
        return $query->where('is_master_template', true)->whereNull('account_id');
    }

    public function scopeAccountTemplates(Builder $query): Builder
    {
        return $query->where('is_master_template', false)->whereNotNull('account_id');
    }

    // Status Methods
    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function isDefault(): bool
    {
        return $this->is_default;
    }

    public function requiresPhotos(): bool
    {
        return $this->require_photos;
    }

    public function isMasterTemplate(): bool
    {
        return $this->is_master_template;
    }

    // Template Methods
    public function setAsDefault(): void
    {
        // Remove default flag from other templates in same category
        static::where('account_id', $this->account_id)
            ->where('rental_category', $this->rental_category)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->is_default = true;
        $this->save();
    }

    public function activate(): void
    {
        $this->is_active = true;
        $this->save();
    }

    public function deactivate(): void
    {
        $this->is_active = false;
        $this->is_default = false; // Can't be default if inactive
        $this->save();
    }

    /**
     * Get terms and conditions in specified language
     */
    public function getTerms(string $language = 'az'): string
    {
        return $language === 'en' && $this->terms_and_conditions_en
            ? $this->terms_and_conditions_en
            : $this->terms_and_conditions_az;
    }

    /**
     * Get damage liability terms in specified language
     */
    public function getDamageTerms(string $language = 'az'): string
    {
        return $language === 'en' && $this->damage_liability_terms_en
            ? $this->damage_liability_terms_en
            : $this->damage_liability_terms_az;
    }

    /**
     * Get condition checklist with translations
     */
    public function getConditionChecklist(string $language = 'az'): array
    {
        $checklist = $this->condition_checklist;

        if (!is_array($checklist)) {
            return [];
        }

        // Map labels based on language
        foreach ($checklist as &$item) {
            if (isset($item['label_az']) && isset($item['label_en'])) {
                $item['label'] = $language === 'en' ? $item['label_en'] : $item['label_az'];
            }

            if (isset($item['options_az']) && isset($item['options_en'])) {
                $item['options'] = $language === 'en' ? $item['options_en'] : $item['options_az'];
            }
        }

        return $checklist;
    }

    /**
     * Create agreement from this template
     */
    public function createAgreement(int $rentalId, string $language = 'az'): RentalAgreement
    {
        return RentalAgreement::create([
            'account_id' => $this->account_id,
            'rental_id' => $rentalId,
            'template_id' => $this->id,
            'rental_category' => $this->rental_category,
            'terms_and_conditions' => $this->getTerms($language),
            'damage_liability_terms' => $this->getDamageTerms($language),
            'condition_checklist' => $this->getConditionChecklist($language),
            'status' => 'draft',
        ]);
    }

    /**
     * Get default template for a category
     */
    public static function getDefaultForCategory(int $accountId, string $category): ?self
    {
        return static::where('account_id', $accountId)
            ->where('rental_category', $category)
            ->where('is_active', true)
            ->where('is_default', true)
            ->first();
    }

    /**
     * Get all active templates for a category
     */
    public static function getActiveForCategory(int $accountId, string $category)
    {
        return static::where('account_id', $accountId)
            ->where('rental_category', $category)
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();
    }

    /**
     * Copy master templates to a new account
     */
    public static function copyMasterTemplatesToAccount(int $accountId): void
    {
        $masterTemplates = static::withoutGlobalScope('account')
            ->masterTemplates()
            ->active()
            ->get();

        foreach ($masterTemplates as $masterTemplate) {
            static::create([
                'account_id' => $accountId,
                'name' => $masterTemplate->name,
                'rental_category' => $masterTemplate->rental_category,
                'terms_and_conditions_az' => $masterTemplate->terms_and_conditions_az,
                'terms_and_conditions_en' => $masterTemplate->terms_and_conditions_en,
                'damage_liability_terms_az' => $masterTemplate->damage_liability_terms_az,
                'damage_liability_terms_en' => $masterTemplate->damage_liability_terms_en,
                'condition_checklist' => $masterTemplate->condition_checklist,
                'is_active' => true,
                'is_default' => $masterTemplate->is_default,
                'require_photos' => $masterTemplate->require_photos,
                'min_photos' => $masterTemplate->min_photos,
                'notes' => $masterTemplate->notes,
                'is_master_template' => false,
            ]);
        }
    }

    /**
     * Create a copy of this template for an account
     */
    public function copyToAccount(int $accountId): self
    {
        return static::create([
            'account_id' => $accountId,
            'name' => $this->name,
            'rental_category' => $this->rental_category,
            'terms_and_conditions_az' => $this->terms_and_conditions_az,
            'terms_and_conditions_en' => $this->terms_and_conditions_en,
            'damage_liability_terms_az' => $this->damage_liability_terms_az,
            'damage_liability_terms_en' => $this->damage_liability_terms_en,
            'condition_checklist' => $this->condition_checklist,
            'is_active' => true,
            'is_default' => $this->is_default,
            'require_photos' => $this->require_photos,
            'min_photos' => $this->min_photos,
            'notes' => $this->notes,
            'is_master_template' => false,
        ]);
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($template) {
            // If this is marked as default, remove default flag from others
            if ($template->is_default) {
                static::where('account_id', $template->account_id)
                    ->where('rental_category', $template->rental_category)
                    ->update(['is_default' => false]);
            }
        });

        static::updating(function ($template) {
            // If being set as default, remove default flag from others
            if ($template->is_default && $template->isDirty('is_default')) {
                static::where('account_id', $template->account_id)
                    ->where('rental_category', $template->rental_category)
                    ->where('id', '!=', $template->id)
                    ->update(['is_default' => false]);
            }

            // If being deactivated, remove default flag
            if (!$template->is_active && $template->isDirty('is_active')) {
                $template->is_default = false;
            }
        });
    }
}
