<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;

class ProductDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'file_path',
        'file_type',
        'file_extension',
        'original_name',
        'file_size',
        'mime_type',
        'document_type',
        'description',
        'thumbnail_path',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function scopeImages(Builder $query): Builder
    {
        return $query->where('document_type', 'image');
    }

    public function scopeManuals(Builder $query): Builder
    {
        return $query->where('document_type', 'manual');
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('document_type', $type);
    }

    public function isImage(): bool
    {
        return $this->document_type === 'image' || 
               in_array($this->file_extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }

    public function isPdf(): bool
    {
        return $this->file_extension === 'pdf';
    }

    public function getUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getDocumentTypeDisplayAttribute(): string
    {
        $types = [
            'image' => 'Şəkil',
            'manual' => 'İstifadə təlimatı',
            'certificate' => 'Sertifikat',
            'qaimə' => 'Qaimə',
            'warranty' => 'Zəmanət',
            'other' => 'Digər',
        ];

        return $types[$this->document_type] ?? $this->document_type;
    }

    public function delete(): bool
    {
        // Delete the file from storage when deleting the record
        if (Storage::exists($this->file_path)) {
            Storage::delete($this->file_path);
        }

        return parent::delete();
    }
}
