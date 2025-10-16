<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class StorageSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'encrypted',
    ];

    protected $casts = [
        'encrypted' => 'boolean',
    ];

    /**
     * Get the setting value, automatically decrypting if needed
     */
    public function getValueAttribute($value)
    {
        if ($this->encrypted && $value) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return $value; // Return original if decryption fails
            }
        }
        
        return $value;
    }

    /**
     * Set the setting value, automatically encrypting if needed
     */
    public function setValueAttribute($value)
    {
        if ($this->encrypted && $value) {
            $this->attributes['value'] = Crypt::encryptString($value);
        } else {
            $this->attributes['value'] = $value;
        }
    }

    /**
     * Get a setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by key
     */
    public static function set(string $key, $value, bool $encrypted = true)
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'encrypted' => $encrypted
            ]
        );
    }

    /**
     * Get Azure connection string
     */
    public static function getAzureConnectionString()
    {
        return static::get('azure_connection_string');
    }

    /**
     * Get Azure container name
     */
    public static function getAzureContainer()
    {
        return static::get('azure_container', 'xpos');
    }
}