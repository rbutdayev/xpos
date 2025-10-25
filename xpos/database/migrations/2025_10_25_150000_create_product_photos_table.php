<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // File paths
            $table->string('original_path');
            $table->string('medium_path')->nullable();
            $table->string('thumbnail_path')->nullable();

            // File metadata
            $table->string('original_name');
            $table->unsignedBigInteger('file_size'); // bytes
            $table->string('mime_type');

            // Photo properties
            $table->boolean('is_primary')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('alt_text')->nullable();

            // Audit
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Indexes
            $table->index(['account_id', 'product_id']);
            $table->index(['account_id', 'product_id', 'is_primary']);
            $table->index(['account_id', 'product_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_photos');
    }
};
