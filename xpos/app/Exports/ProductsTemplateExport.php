<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ProductsTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths
{
    /**
     * Return sample data for the template
     */
    public function array(): array
    {
        // Return sample rows to help users understand the format
        // Note: Required fields are name, purchase_price, sale_price
        return [
            // Sample data row 1
            [
                'Sample Product 1',           // name (REQUIRED)
                'SKU-001',                    // sku
                '1234567890123',             // barcode
                'Code-128',                   // barcode_type (EAN-13, UPC-A, Code-128, QR-Code)
                'Electronics',                // category_name (auto-created if not exists)
                'This is a sample product description', // description
                100.00,                       // purchase_price (REQUIRED)
                150.00,                       // sale_price (REQUIRED)
                'pcs',                        // unit
                0.5,                          // weight
                '10x10x10',                   // dimensions
                'SampleBrand',                // brand
                'Model-X',                    // model
                '',                           // packaging_size
                '',                           // base_unit
                '',                           // packaging_quantity
                'TRUE',                       // is_active (TRUE or FALSE)
                'FALSE',                      // allow_negative_stock (TRUE or FALSE)
            ],
            // Sample data row 2
            [
                'Sample Product 2',
                'SKU-002',
                '9876543210987',
                'EAN-13',
                'Clothing',
                'Blue cotton T-shirt',
                25.00,
                50.00,
                'pcs',
                0.2,
                '30x40x2',
                'FashionBrand',
                'Classic-T',
                '12pcs',
                'pcs',
                12,
                'TRUE',
                'FALSE',
            ],
        ];
    }

    /**
     * Define column headings
     */
    public function headings(): array
    {
        return [
            'name',
            'sku',
            'barcode',
            'barcode_type',
            'category_name',
            'description',
            'purchase_price',
            'sale_price',
            'unit',
            'weight',
            'dimensions',
            'brand',
            'model',
            'packaging_size',
            'base_unit',
            'packaging_quantity',
            'is_active',
            'allow_negative_stock',
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
            'A' => 25, // name
            'B' => 15, // sku
            'C' => 18, // barcode
            'D' => 15, // barcode_type
            'E' => 20, // category_name
            'F' => 40, // description
            'G' => 15, // purchase_price
            'H' => 15, // sale_price
            'I' => 10, // unit
            'J' => 10, // weight
            'K' => 15, // dimensions
            'L' => 15, // brand
            'M' => 15, // model
            'N' => 15, // packaging_size
            'O' => 12, // base_unit
            'P' => 18, // packaging_quantity
            'Q' => 12, // is_active
            'R' => 20, // allow_negative_stock
        ];
    }
}
