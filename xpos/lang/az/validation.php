<?php

return [
    'required' => ':attribute daxil edilməlidir.',
    'required_if' => ':other :value olduqda :attribute daxil edilməlidir.',
    'min' => [
        'numeric' => ':attribute ən azı :min olmalıdır.',
        'string' => ':attribute ən azı :min simvol olmalıdır.',
    ],
    'max' => [
        'numeric' => ':attribute maksimum :max ola bilər.',
        'string' => ':attribute maksimum :max simvol ola bilər.',
    ],
    'email' => ':attribute düzgün email ünvanı olmalıdır.',
    'unique' => 'Bu :attribute artıq mövcuddur.',
    'exists' => 'Seçilmiş :attribute yanlışdır.',
    'in' => 'Seçilmiş :attribute yanlışdır.',
    'numeric' => ':attribute rəqəm olmalıdır.',
    'integer' => ':attribute tam ədəd olmalıdır.',
    'string' => ':attribute mətn olmalıdır.',
    'array' => ':attribute massiv olmalıdır.',
    'date' => ':attribute düzgün tarix deyil.',
    'after' => ':attribute :date tarixindən sonra olmalıdır.',
    'before' => ':attribute :date tarixindən əvvəl olmalıdır.',

    // Custom validation messages
    'custom' => [
        'amount' => [
            'required' => 'Ödəniş məbləği tələb olunur.',
            'numeric' => 'Ödəniş məbləği rəqəm olmalıdır.',
            'min' => 'Ödəniş məbləği minimum :min AZN olmalıdır.',
        ],
        'method' => [
            'required' => 'Ödəniş üsulu seçilməlidir.',
            'in' => 'Yanlış ödəniş üsulu seçildi.',
        ],
        'return_date' => [
            'date' => 'Qaytarma tarixi düzgün formatda olmalıdır.',
        ],
        'items.*.item_id' => [
            'required' => 'Məhsul ID-si tələb olunur.',
            'exists' => 'Seçilmiş məhsul mövcud deyil.',
        ],
        'items.*.damage_fee' => [
            'min' => 'Zədə haqqı mənfi ola bilməz.',
        ],
        'collateral_amount' => [
            'required_if' => 'Nağd depozit məbləği daxil edilməlidir.',
        ],
        'items' => [
            'required' => 'Ən azı bir məhsul əlavə edilməlidir.',
        ],
    ],

    'attributes' => [
        'email' => 'email ünvanı',
        'password' => 'şifrə',
        'name' => 'ad',
        'amount' => 'məbləğ',
        'method' => 'ödəniş üsulu',
        'phone' => 'telefon nömrəsi',
        'address' => 'ünvan',
        'tax_number' => 'vergi nömrəsi',
        'voen' => 'VÖEN',
        'return_date' => 'qaytarma tarixi',
        'latitude' => 'enlik (latitude)',
        'longitude' => 'uzunluq (longitude)',
        'accuracy' => 'dəqiqlik',
        'branch_id' => 'filial',
    ],
];
