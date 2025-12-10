<?php

return [
    'required' => 'The :attribute field is required.',
    'required_if' => 'The :attribute field is required when :other is :value.',
    'min' => [
        'numeric' => 'The :attribute must be at least :min.',
        'string' => 'The :attribute must be at least :min characters.',
    ],
    'max' => [
        'numeric' => 'The :attribute may not be greater than :max.',
        'string' => 'The :attribute may not be greater than :max characters.',
    ],
    'email' => 'The :attribute must be a valid email address.',
    'unique' => 'The :attribute has already been taken.',
    'exists' => 'The selected :attribute is invalid.',
    'in' => 'The selected :attribute is invalid.',
    'numeric' => 'The :attribute must be a number.',
    'integer' => 'The :attribute must be an integer.',
    'string' => 'The :attribute must be a string.',
    'array' => 'The :attribute must be an array.',
    'date' => 'The :attribute is not a valid date.',
    'after' => 'The :attribute must be a date after :date.',
    'before' => 'The :attribute must be a date before :date.',

    // Custom validation messages
    'custom' => [
        'amount' => [
            'min' => 'Payment amount must be at least :min :currency.',
        ],
        'collateral_amount' => [
            'required_if' => 'Cash deposit amount must be entered.',
        ],
        'items' => [
            'required' => 'At least one product must be added.',
        ],
        'method' => [
            'in' => 'Invalid payment method selected.',
        ],
    ],

    'attributes' => [
        'email' => 'email address',
        'password' => 'password',
        'name' => 'name',
        'amount' => 'amount',
        'method' => 'payment method',
        'phone' => 'phone number',
        'address' => 'address',
        'tax_number' => 'tax number',
        'voen' => 'VOEN',
        'return_date' => 'return date',
    ],
];
