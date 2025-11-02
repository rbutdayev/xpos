<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentalAgreementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rental_id' => $this->rental_id,
            'template_id' => $this->template_id,

            // Category
            'rental_category' => $this->rental_category,
            'rental_category_label' => $this->getCategoryLabel(),

            // Terms
            'terms_and_conditions' => $this->terms_and_conditions,
            'damage_liability_terms' => $this->damage_liability_terms,

            // Condition Checklists
            'condition_checklist' => $this->condition_checklist,
            'condition_checklist_return' => $this->condition_checklist_return,
            'condition_photos' => $this->condition_photos,

            // Condition comparison
            'has_return_checklist' => $this->hasReturnChecklist(),
            'condition_differences' => $this->when(
                $this->hasReturnChecklist(),
                $this->compareConditions()
            ),

            // Damage Assessment
            'damage_assessment' => $this->damage_assessment,
            'damage_fee_calculated' => (float) $this->damage_fee_calculated,
            'damage_fee_waived' => $this->damage_fee_waived,
            'damage_waiver_reason' => $this->damage_waiver_reason,

            // Signatures
            'customer_signed' => $this->hasCustomerSignature(),
            'customer_signed_at' => $this->customer_signed_at?->format('Y-m-d H:i:s'),
            'customer_signature' => $this->when($this->hasCustomerSignature(), $this->customer_signature),

            'staff_signed' => $this->hasStaffSignature(),
            'staff_user_id' => $this->staff_user_id,
            'staff_signed_at' => $this->staff_signed_at?->format('Y-m-d H:i:s'),
            'staff_signature' => $this->when($this->hasStaffSignature(), $this->staff_signature),

            'fully_signed' => $this->isFullySigned(),

            // PDF
            'has_pdf' => $this->hasPdf(),
            'pdf_path' => $this->when($this->hasPdf(), $this->pdf_path),
            'pdf_url' => $this->when($this->hasPdf(), $this->getPdfUrl()),
            'pdf_generated_at' => $this->pdf_generated_at?->format('Y-m-d H:i:s'),

            // Status
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),

            // Notes
            'notes' => $this->notes,

            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get category label in Azerbaijani
     */
    protected function getCategoryLabel(): string
    {
        return match($this->rental_category) {
            'clothing' => 'Geyim',
            'electronics' => 'Elektronika',
            'home_appliances' => 'Məişət texnikası',
            'cosmetics' => 'Kosmetika',
            'event_equipment' => 'Tədbir avadanlığı',
            'furniture' => 'Mebel',
            'jewelry' => 'Zərgərlik',
            'toys' => 'Oyuncaqlar',
            'sports' => 'İdman',
            'general' => 'Ümumi',
            default => $this->rental_category,
        };
    }

    /**
     * Get status label in Azerbaijani
     */
    protected function getStatusLabel(): string
    {
        return match($this->status) {
            'draft' => 'Qaralama',
            'signed' => 'İmzalanıb',
            'completed' => 'Tamamlanıb',
            'voided' => 'Ləğv edilib',
            default => $this->status,
        };
    }
}
