<?php

namespace App\Http\Requests\Rental;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalRequest extends FormRequest
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
        return [
            'customer_id' => 'sometimes|required|exists:customers,id',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'rental_start_date' => 'sometimes|required|date',
            'rental_end_date' => 'nullable|date|after:rental_start_date',
            'status' => 'nullable|in:reserved,active,returned,overdue,cancelled',
            'payment_status' => 'nullable|in:paid,credit,partial',
            'paid_amount' => 'nullable|numeric|min:0',
            'collateral_type' => 'sometimes|required|string',
            'collateral_amount' => 'nullable|numeric|min:0',
            'collateral_document_type' => 'nullable|string',
            'collateral_document_number' => 'nullable|string',
            'collateral_notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',

            // Items
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.rental_inventory_id' => 'nullable|exists:rental_inventory,id',
            'items.*.rate_type' => 'required|in:daily,weekly,monthly',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.duration' => 'required|integer|min:1',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'rental_end_date.after' => 'Bitmə tarixi başlama tarixindən sonra olmalıdır.',
            'paid_amount.min' => 'Ödəniş məbləği mənfi ola bilməz.',
        ];
    }
}
