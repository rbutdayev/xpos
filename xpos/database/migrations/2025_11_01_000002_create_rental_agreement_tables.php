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
        // Create rental_agreement_templates table
        Schema::create('rental_agreement_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->onDelete('cascade');

            // Template Details
            $table->string('name');
            $table->enum('rental_category', [
                'clothing',
                'electronics',
                'home_appliances',
                'cosmetics',
                'event_equipment',
                'furniture',
                'jewelry',
                'toys',
                'sports',
                'general'
            ]);

            // Content (Bilingual: Azerbaijani & English)
            $table->text('terms_and_conditions_az');
            $table->text('terms_and_conditions_en')->nullable();
            $table->text('damage_liability_terms_az');
            $table->text('damage_liability_terms_en')->nullable();

            // Condition Checklist (JSON structure)
            $table->json('condition_checklist');

            // Settings
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->boolean('require_photos')->default(false);
            $table->integer('min_photos')->default(2);

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['account_id', 'rental_category']);
            $table->index(['account_id', 'is_active']);
            $table->index(['account_id', 'is_default']);
        });

        // Create rental_agreements table
        Schema::create('rental_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->foreignId('rental_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->nullable()->constrained('rental_agreement_templates')->onDelete('set null');

            // Agreement Details
            $table->enum('rental_category', [
                'clothing',
                'electronics',
                'home_appliances',
                'cosmetics',
                'event_equipment',
                'furniture',
                'jewelry',
                'toys',
                'sports',
                'general'
            ]);

            // Content (stored at time of agreement creation)
            $table->text('terms_and_conditions');
            $table->text('damage_liability_terms');

            // Condition Checklists
            $table->json('condition_checklist'); // At rental time
            $table->json('condition_checklist_return')->nullable(); // At return time
            $table->json('condition_photos')->nullable(); // Photo paths

            // Damage Assessment
            $table->json('damage_assessment')->nullable();
            $table->decimal('damage_fee_calculated', 10, 2)->default(0);
            $table->boolean('damage_fee_waived')->default(false);
            $table->text('damage_waiver_reason')->nullable();

            // Customer Signature
            $table->text('customer_signature')->nullable(); // Base64 signature image
            $table->timestamp('customer_signed_at')->nullable();
            $table->string('customer_ip', 45)->nullable();
            $table->text('customer_user_agent')->nullable();

            // Staff Signature
            $table->foreignId('staff_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('staff_signature')->nullable();
            $table->timestamp('staff_signed_at')->nullable();

            // PDF Generation
            $table->string('pdf_path', 255)->nullable();
            $table->timestamp('pdf_generated_at')->nullable();

            // Status
            $table->enum('status', ['draft', 'signed', 'completed', 'voided'])->default('draft');
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['account_id', 'rental_id']);
            $table->index(['account_id', 'rental_category']);
            $table->index(['account_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rental_agreements');
        Schema::dropIfExists('rental_agreement_templates');
    }
};
