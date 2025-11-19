<?php

namespace App\Models;

use App\Traits\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class RentalCategory extends Model
{
    use HasFactory, BelongsToAccount, SoftDeletes;

    protected $fillable = [
        'account_id',
        'name_az',
        'name_en',
        'slug',
        'color',
        'description_az',
        'description_en',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // Relationships
    public function templates(): HasMany
    {
        return $this->hasMany(RentalAgreementTemplate::class, 'rental_category', 'slug');
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name_az');
    }

    // Accessors & Mutators
    public function getName(string $language = 'az'): string
    {
        return $language === 'en' && $this->name_en
            ? $this->name_en
            : $this->name_az;
    }

    public function getDescription(string $language = 'az'): ?string
    {
        return $language === 'en' && $this->description_en
            ? $this->description_en
            : $this->description_az;
    }

    // Methods
    public function activate(): void
    {
        $this->is_active = true;
        $this->save();
    }

    public function deactivate(): void
    {
        $this->is_active = false;
        $this->save();
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if category can be deleted
     */
    public function canBeDeleted(): bool
    {
        return $this->templates()->count() === 0;
    }

    /**
     * Create default rental categories for a new account
     */
    public static function createDefaultCategoriesForAccount(int $accountId): void
    {
        $categories = [
            [
                'name_az' => 'Ümumi',
                'name_en' => 'General',
                'slug' => 'general',
                'color' => '#3B82F6',
                'description_az' => 'Ümumi məqsədli icarə kateqoriyası',
                'description_en' => 'General purpose rental category',
                'sort_order' => 1,
            ],
            [
                'name_az' => 'Paltar',
                'name_en' => 'Clothing',
                'slug' => 'clothing',
                'color' => '#8B5CF6',
                'description_az' => 'Geyim və kostyumların icarəsi üçün',
                'description_en' => 'For clothing and costume rentals',
                'sort_order' => 2,
            ],
            [
                'name_az' => 'Elektronika',
                'name_en' => 'Electronics',
                'slug' => 'electronics',
                'color' => '#F59E0B',
                'description_az' => 'Elektron cihazların icarəsi üçün',
                'description_en' => 'For electronic device rentals',
                'sort_order' => 3,
            ],
            [
                'name_az' => 'Ev Texnikası',
                'name_en' => 'Home Appliances',
                'slug' => 'home_appliances',
                'color' => '#10B981',
                'description_az' => 'Ev təchizatı və texnikasının icarəsi üçün',
                'description_en' => 'For home appliance rentals',
                'sort_order' => 4,
            ],
            [
                'name_az' => 'Zərgərlik',
                'name_en' => 'Jewelry',
                'slug' => 'jewelry',
                'color' => '#EF4444',
                'description_az' => 'Zərgərlik məmulatlarının icarəsi üçün',
                'description_en' => 'For jewelry rentals',
                'sort_order' => 5,
            ],
            [
                'name_az' => 'Avtomobil',
                'name_en' => 'Automobile',
                'slug' => 'automobile',
                'color' => '#6366F1',
                'description_az' => 'Avtomobil və nəqliyyat vasitələrinin icarəsi üçün',
                'description_en' => 'For automobile and vehicle rentals',
                'sort_order' => 6,
            ],
        ];

        foreach ($categories as $categoryData) {
            static::create(array_merge($categoryData, [
                'account_id' => $accountId,
                'is_active' => true,
            ]));
        }
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            // Auto-generate slug if not provided
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name_az);
            }

            // Ensure slug is unique for the account
            $originalSlug = $category->slug;
            $counter = 1;

            while (static::where('account_id', $category->account_id)
                ->where('slug', $category->slug)
                ->exists()
            ) {
                $category->slug = $originalSlug . '-' . $counter;
                $counter++;
            }
        });

        static::deleting(function ($category) {
            if (!$category->canBeDeleted()) {
                throw new \Exception('Bu kateqoriya istifadədə olduğu üçün silinə bilməz.');
            }
        });
    }
}
