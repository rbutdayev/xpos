<?php

namespace App\Http\Requests\Rental;

use Illuminate\Foundation\Http\FormRequest;

class ProcessReturnRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'return_date' => 'nullable|date',
            'return_collateral' => 'nullable|boolean',
            'condition_on_return' => 'nullable|array',
            'damage_notes' => 'nullable|string',

            // Cleaning fee (optional)
            'needs_cleaning' => 'nullable|boolean',
            'cleaning_fee' => 'nullable|numeric|min:0',

            // Items condition on return
            'items' => 'nullable|array',
            'items.*.item_id' => 'required|exists:rental_items,id',
            'items.*.condition_on_return' => 'nullable|array',
            'items.*.damage_notes' => 'nullable|string',
            'items.*.damage_fee' => 'nullable|numeric|min:0',

            // Payment information
            'payment_type' => 'nullable|in:full,partial,credit',
            'payment_method' => 'nullable|in:cash,card,transfer',
            'payment_amount' => 'nullable|numeric|min:0',

            // Notification settings
            'send_sms' => 'nullable|boolean',
            'send_telegram' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'return_date.date' => 'Qaytarma tarixi düzgün formatda olmalıdır.',
            'items.*.item_id.required' => 'Məhsul ID-si tələb olunur.',
            'items.*.item_id.exists' => 'Seçilmiş məhsul mövcud deyil.',
            'items.*.damage_fee.min' => 'Zədə haqqı mənfi ola bilməz.',
        ];
    }
}
