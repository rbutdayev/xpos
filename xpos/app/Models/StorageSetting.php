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
     * Get storage driver type
     */
    public static function getStorageDriver()
    {
        return static::get('storage_driver', 'local');
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

    /**
     * Get S3 access key
     */
    public static function getS3AccessKey()
    {
        return static::get('s3_access_key');
    }

    /**
     * Get S3 secret key
     */
    public static function getS3SecretKey()
    {
        return static::get('s3_secret_key');
    }

    /**
     * Get S3 bucket name
     */
    public static function getS3Bucket()
    {
        return static::get('s3_bucket');
    }

    /**
     * Get S3 region
     */
    public static function getS3Region()
    {
        return static::get('s3_region', 'us-east-1');
    }

    /**
     * Get S3 endpoint (for S3-compatible services like Backblaze)
     */
    public static function getS3Endpoint()
    {
        return static::get('s3_endpoint');
    }

    /**
     * Check if using path-style endpoint (required for some S3-compatible services)
     */
    public static function getS3UsePathStyleEndpoint()
    {
        return static::get('s3_use_path_style_endpoint', 'false') === 'true';
    }

    /**
     * Get S3 URL
     */
    public static function getS3Url()
    {
        return static::get('s3_url');
    }
}