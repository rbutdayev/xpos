<?php

namespace App\Enums;

enum ExpenseType: string
{
    case SALARY = 'salary';
    case EXPENSES = 'expenses';
    case PAYMENTS = 'payments';
    case UTILITIES = 'utilities';
    case TRANSPORT = 'transport';
    case OTHER = 'other';

    /**
     * Get all values as an array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get the display name for the expense type
     */
    public function label(): string
    {
        return match($this) {
            self::SALARY => __('enums.expense_types.salary'),
            self::EXPENSES => __('enums.expense_types.expenses'),
            self::PAYMENTS => __('enums.expense_types.payments'),
            self::UTILITIES => __('enums.expense_types.utilities'),
            self::TRANSPORT => __('enums.expense_types.transport'),
            self::OTHER => __('enums.expense_types.other'),
        };
    }

    /**
     * Get Azerbaijani translation (legacy support)
     */
    public function labelAz(): string
    {
        return match($this) {
            self::SALARY => 'Maaş',
            self::EXPENSES => 'Xərclər',
            self::PAYMENTS => 'Ödənişlər',
            self::UTILITIES => 'Kommunal',
            self::TRANSPORT => 'Nəqliyyat',
            self::OTHER => 'Digər',
        };
    }
}
