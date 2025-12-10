<?php

namespace App\Http\Requests\Rental;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

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
            'payment_method' => ['nullable', new Enum(PaymentMethod::class)],
            'payment_amount' => 'nullable|numeric|min:0',

            // Notification settings
            'send_sms' => 'nullable|boolean',
            'send_telegram' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'return_date' => __('validation.attributes.return_date'),
            'payment_method' => __('validation.attributes.method'),
            'payment_amount' => __('validation.attributes.amount'),
        ];
    }
}
