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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();

            // Multi-tenant fields
            $table->foreignId('account_id')
                ->constrained('accounts')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();

            // Attendance type
            $table->enum('type', ['check_in', 'check_out'])
                ->comment('Type of attendance record');

            // Timestamp
            $table->timestamp('recorded_at')
                ->comment('Exact time of check-in/out');

            // GPS coordinates (immutable)
            $table->decimal('latitude', 10, 8)
                ->nullable()
                ->comment('GPS latitude at time of record');
            $table->decimal('longitude', 11, 8)
                ->nullable()
                ->comment('GPS longitude at time of record');
            $table->decimal('gps_accuracy', 8, 2)
                ->nullable()
                ->comment('GPS accuracy in meters');

            // Location validation
            $table->boolean('is_within_branch_radius')
                ->default(false)
                ->comment('Whether GPS was within allowed radius of branch');
            $table->decimal('distance_from_branch', 10, 2)
                ->nullable()
                ->comment('Distance in meters from branch location');

            // Device & metadata (immutable)
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_type', 50)
                ->nullable()
                ->comment('mobile, tablet, desktop');
            $table->json('device_info')
                ->nullable()
                ->comment('Additional device information');

            // Notes (only at creation)
            $table->text('notes')
                ->nullable()
                ->comment('Optional user notes at check-in/out');

            // Photo evidence (optional)
            $table->string('photo_path')
                ->nullable()
                ->comment('Path to uploaded photo for verification');

            // Validation flags
            $table->boolean('is_manual')
                ->default(false)
                ->comment('True if manually created by admin');
            $table->foreignId('created_by_admin_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Admin who created manual record');
            $table->text('admin_notes')
                ->nullable()
                ->comment('Admin notes for manual records');

            // Immutability enforcement
            $table->boolean('is_locked')
                ->default(true)
                ->comment('Records are immutable once created');

            $table->timestamps();

            // Indexes for performance
            $table->index(['account_id', 'user_id', 'recorded_at'], 'idx_attendance_user_time');
            $table->index(['account_id', 'branch_id', 'recorded_at'], 'idx_attendance_branch_time');
            $table->index(['account_id', 'type', 'recorded_at'], 'idx_attendance_type_time');
            $table->index(['user_id', 'recorded_at'], 'idx_user_recorded_at');
            $table->index(['branch_id', 'recorded_at'], 'idx_branch_recorded_at');
            $table->index(['account_id', 'created_at'], 'idx_attendance_account_created');

            // Composite index for finding check-in/out pairs
            $table->index(['account_id', 'user_id', 'type', 'recorded_at'], 'idx_user_type_pairs');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
