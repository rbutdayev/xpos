<?php

namespace App\Http\Requests\Rental;

use Illuminate\Foundation\Http\FormRequest;

class StoreRentalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        // Get valid rental category slugs from database
        $validCategories = \App\Models\RentalCategory::where('account_id', auth()->user()->account_id)
            ->where('is_active', true)
            ->pluck('slug')
            ->toArray();

        // If no categories exist, use default
        if (empty($validCategories)) {
            $validCategories = ['general'];
        }

        return [
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'rental_start_date' => 'required|date|after_or_equal:today',
            'rental_end_date' => 'nullable|date|after:rental_start_date',

            // Collateral
            'collateral_type' => 'required|in:deposit_cash,passport,id_card,drivers_license,other_document',
            'collateral_amount' => 'required_if:collateral_type,deposit_cash|nullable|numeric|min:0',
            'collateral_document_type' => 'required_unless:collateral_type,deposit_cash|nullable|string|max:100',
            'collateral_document_number' => 'nullable|string|max:100',
            'collateral_photo' => 'nullable|string', // Base64 encoded image
            'collateral_photo_path' => 'nullable|string|max:255', // For existing rentals
            'collateral_notes' => 'nullable|string',

            // Status
            'status' => 'nullable|in:reserved,active',
            'payment_status' => 'nullable|in:paid,credit,partial',

            // Payment
            'paid_amount' => 'nullable|numeric|min:0',

            // Items
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.rental_inventory_id' => 'nullable|exists:rental_inventory,id',
            'items.*.rate_type' => 'required|in:daily,weekly,monthly',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.duration' => 'required|integer|min:1',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.condition_checklist' => 'nullable|array',
            'items.*.notes' => 'nullable|string',

            // Notes
            'notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',

            // Agreement
            'agreement' => 'nullable|array',
            'agreement.rental_category' => 'required_with:agreement|in:' . implode(',', $validCategories),
            'agreement.condition_checklist' => 'nullable|array', // Changed from required_with to nullable
            'agreement.condition_photos' => 'nullable|array',
            'agreement.notes' => 'nullable|string',
            'agreement.customer_signature' => 'required_with:agreement|string',
            'agreement.terms_accepted' => 'required_with:agreement|boolean|accepted',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'customer_id.required' => 'Müştəri seçilməlidir.',
            'customer_id.exists' => 'Seçilmiş müştəri mövcud deyil.',
            'branch_id.required' => 'Filial seçilməlidir.',
            'branch_id.exists' => 'Seçilmiş filial mövcud deyil.',
            'rental_start_date.required' => 'Başlama tarixi daxil edilməlidir.',
            'rental_start_date.after_or_equal' => 'Başlama tarixi bu gündən əvvəl ola bilməz.',
            'rental_end_date.after' => 'Bitmə tarixi başlama tarixindən sonra olmalıdır.',
            'collateral_type.required' => 'Girov növü seçilməlidir.',
            'collateral_amount.required_if' => 'Nağd depozit məbləği daxil edilməlidir.',
            'collateral_document_type.required_unless' => 'Sənəd növü daxil edilməlidir.',
            'items.required' => 'Ən azı bir məhsul əlavə edilməlidir.',
            'items.min' => 'Ən azı bir məhsul əlavə edilməlidir.',
            'items.*.product_id.required' => 'Məhsul seçilməlidir.',
            'items.*.product_id.exists' => 'Seçilmiş məhsul mövcud deyil.',
            'items.*.rate_type.required' => 'Qiymət növü seçilməlidir.',
            'items.*.unit_price.required' => 'Vahid qiymət daxil edilməlidir.',
            'items.*.duration.required' => 'Müddət daxil edilməlidir.',
            'items.*.total_price.required' => 'Cəmi məbləğ hesablanmalıdır.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'account_id' => auth()->user()->account_id,
            'user_id' => auth()->id(),
        ]);
    }
}
