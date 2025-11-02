<?php

namespace App\Http\Requests\Rental;

use Illuminate\Foundation\Http\FormRequest;

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
            'method' => 'required|in:cash,card,transfer',
            'notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'Ödəniş məbləği tələb olunur.',
            'amount.numeric' => 'Ödəniş məbləği rəqəm olmalıdır.',
            'amount.min' => 'Ödəniş məbləği minimum 0.01 AZN olmalıdır.',
            'method.required' => 'Ödəniş üsulu seçilməlidir.',
            'method.in' => 'Yanlış ödəniş üsulu seçildi.',
        ];
    }
}
