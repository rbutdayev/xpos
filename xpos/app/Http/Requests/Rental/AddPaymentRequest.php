<?php

namespace App\Http\Requests\Rental;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class AddPaymentRequest extends FormRequest
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
            'amount' => 'required|numeric|min:0.01',
            'method' => ['required', new Enum(PaymentMethod::class)],
            'notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'amount' => __('validation.attributes.amount'),
            'method' => __('validation.attributes.method'),
        ];
    }
}
