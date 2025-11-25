<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FiscalPrinterProvider extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'default_port',
        'api_base_path',
        'print_endpoint',
        'status_endpoint',
        'required_fields',
        'endpoint_config',
        'is_active',
    ];

    protected $casts = [
        'required_fields' => 'array',
        'endpoint_config' => 'array',
        'is_active' => 'boolean',
        'default_port' => 'integer',
    ];

    /**
     * Get the full API endpoint for a specific action
     */
    public function getEndpoint(string $ipAddress, int $port, string $action): string
    {
        $base = "http://{$ipAddress}:{$port}";
        $path = rtrim($this->api_base_path, '/');

        $endpoint = match($action) {
            'print' => $this->print_endpoint,
            'status' => $this->status_endpoint,
            default => $action,
        };

        return "{$base}{$path}/{$endpoint}";
    }

    /**
     * Get required fields for this provider
     */
    public function getRequiredFields(): array
    {
        return $this->required_fields ?? [];
    }
}
