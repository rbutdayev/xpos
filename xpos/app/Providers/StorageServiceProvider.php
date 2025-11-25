<?php

namespace App\Providers;

use App\Models\StorageSetting;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter;
use League\Flysystem\AzureBlobStorage\AzureBlobStorageAdapter;
use League\Flysystem\Filesystem;
use MicrosoftAzure\Storage\Blob\BlobRestProxy;

class StorageServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Only configure if we're not in console or if we are but not in migration
        if (!$this->app->runningInConsole() || $this->app->runningUnitTests()) {
            $this->configureDynamicStorage();
        } else {
            // If running in console, check if we're not in migration/install context
            if (!str_contains(request()->server('argv')[1] ?? '', 'migrate') && 
                !str_contains(request()->server('argv')[1] ?? '', 'install')) {
                $this->configureDynamicStorage();
            }
        }
    }

    private function configureDynamicStorage(): void
    {
        try {
            // Get the selected storage driver from database
            $driver = StorageSetting::getStorageDriver();

            switch ($driver) {
                case 'azure':
                    $this->configureAzureStorage();
                    break;

                case 's3':
                case 's3-compatible':
                    $this->configureS3Storage();
                    break;

                case 'local':
                default:
                    $this->configureLocalStorage();
                    break;
            }
        } catch (\Exception $e) {
            \Log::warning('Could not load storage settings from database: ' . $e->getMessage());
            $this->configureFallbackStorage();
        }
    }

    private function configureAzureStorage(): void
    {
        $connectionString = StorageSetting::getAzureConnectionString();
        $container = StorageSetting::getAzureContainer();

        if ($connectionString) {
            config([
                'filesystems.disks.documents' => [
                    'driver' => 'azure',
                    'connection_string' => $connectionString,
                    'container' => $container,
                    'prefix' => '',
                    'throw' => false,
                ]
            ]);
            return;
        }

        throw new \Exception('Azure credentials not found');
    }

    private function configureS3Storage(): void
    {
        $accessKey = StorageSetting::getS3AccessKey();
        $secretKey = StorageSetting::getS3SecretKey();
        $bucket = StorageSetting::getS3Bucket();
        $region = StorageSetting::getS3Region();
        $endpoint = StorageSetting::getS3Endpoint();
        $usePathStyle = StorageSetting::getS3UsePathStyleEndpoint();
        $url = StorageSetting::getS3Url();

        if ($accessKey && $secretKey && $bucket) {
            $config = [
                'driver' => 's3',
                'key' => $accessKey,
                'secret' => $secretKey,
                'region' => $region,
                'bucket' => $bucket,
                'throw' => false,
            ];

            // Add endpoint for S3-compatible services (like Backblaze)
            if ($endpoint) {
                $config['endpoint'] = $endpoint;
                $config['use_path_style_endpoint'] = $usePathStyle;
            }

            // Add custom URL if provided
            if ($url) {
                $config['url'] = $url;
            }

            config(['filesystems.disks.documents' => $config]);
            return;
        }

        throw new \Exception('S3 credentials not found');
    }

    private function configureLocalStorage(): void
    {
        config([
            'filesystems.disks.documents' => [
                'driver' => 'local',
                'root' => storage_path('app/documents'),
                'throw' => false,
            ]
        ]);
    }

    private function configureFallbackStorage(): void
    {
        // Try .env Azure configuration
        $envConnectionString = env('AZURE_STORAGE_CONNECTION_STRING');
        $envContainer = env('AZURE_STORAGE_CONTAINER', 'xpos');

        if ($envConnectionString) {
            config([
                'filesystems.disks.documents' => [
                    'driver' => 'azure',
                    'connection_string' => $envConnectionString,
                    'container' => $envContainer,
                    'prefix' => '',
                    'throw' => false,
                ]
            ]);
            return;
        }

        // Try .env S3 configuration
        if (env('AWS_ACCESS_KEY_ID') && env('AWS_SECRET_ACCESS_KEY') && env('AWS_BUCKET')) {
            config([
                'filesystems.disks.documents' => [
                    'driver' => 's3',
                    'key' => env('AWS_ACCESS_KEY_ID'),
                    'secret' => env('AWS_SECRET_ACCESS_KEY'),
                    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
                    'bucket' => env('AWS_BUCKET'),
                    'url' => env('AWS_URL'),
                    'endpoint' => env('AWS_ENDPOINT'),
                    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
                    'throw' => false,
                ]
            ]);
            return;
        }

        // Final fallback to local storage
        \Log::warning('No cloud storage credentials found in database or .env, using local storage');
        $this->configureLocalStorage();
    }
}