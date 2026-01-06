<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths
{
    /**
     * Return sample data for the template
     */
    public function array(): array
    {
        // Clean sample data - modal-da təlimatlar var
        return [
            // Sample 1: Barkod ilə (TÖVSİYƏ EDİLİR)
            [
                '',                                 // sku
                '1234567890123',                    // barcode - məhsulu tapmaq üçün
                'Nümunə Məhsul 1',                  // product_name
                'Əsas Anbar',                       // warehouse_name
                100,                                // quantity
                50.00,                              // unit_cost
                'Başlanğıc qalıq - köhnə sistemdən',// notes
            ],
            // Sample 2: Barkod ilə
            [
                '',
                '9876543210987',
                'Nümunə Məhsul 2',
                'Filial Anbarı 1',
                250,
                35.50,
                'Açılış qalığı',
            ],
            // Sample 3: SKU ilə (yalnız barkod yoxdursa istifadə edin)
            [
                'SKU-003',
                '',
                'Nümunə Məhsul 3',
                'Əsas Anbar',
                500,
                25.00,
                '',
            ],
        ];
    }

    /**
     * Define column headings
     */
    public function headings(): array
    {
        return [
            'sku',
            'barcode',
            'product_name',
            'warehouse_name',
            'quantity',
            'unit_cost',
            'notes',
        ];
    }

    /**
     * Apply styles to the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F81BD'],
                ],
                'font' => [
                    'color' => ['rgb' => 'FFFFFF'],
                    'bold' => true,
                ],
            ],
        ];
    }

    /**
     * Define column widths
     */
    public function columnWidths(): array
    {
        return [
            'A' => 18, // sku
            'B' => 18, // barcode
            'C' => 30, // product_name
            'D' => 25, // warehouse_name
            'E' => 12, // quantity
            'F' => 12, // unit_cost
            'G' => 40, // notes
        ];
    }
}
