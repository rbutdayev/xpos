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
            // Get Azure settings from database
            $connectionString = StorageSetting::getAzureConnectionString();
            $container = StorageSetting::getAzureContainer();

            if ($connectionString) {
                // Extend the storage manager to add the documents disk
                Storage::extend('azure_dynamic', function ($app, $config) {
                    $client = BlobRestProxy::createBlobService($config['connection_string']);
                    $adapter = new AzureBlobStorageAdapter($client, $config['container'], $config['prefix'] ?? '');
                    $filesystem = new Filesystem($adapter);
                    return new FilesystemAdapter($filesystem, $adapter, $config);
                });

                // Dynamically configure the documents disk with database credentials
                config([
                    'filesystems.disks.documents' => [
                        'driver' => 'azure_dynamic',
                        'connection_string' => $connectionString,
                        'container' => $container,
                        'prefix' => '',
                        'throw' => false,
                    ]
                ]);
            }
        } catch (\Exception $e) {
            // If database is not available or settings don't exist, 
            // fall back to local storage for development
            \Log::warning('Could not load storage settings from database: ' . $e->getMessage());
            
            config([
                'filesystems.disks.documents' => [
                    'driver' => 'local',
                    'root' => storage_path('app/documents'),
                    'throw' => false,
                ]
            ]);
        }
    }
}