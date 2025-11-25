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
        // Return 2 example rows to help users understand the format
        return [
            [
                'Sample Product 1',           // name *
                'SKU-001',                    // sku
                '1234567890123',             // barcode
                'Code-128',                   // barcode_type (EAN-13, UPC-A, Code-128, QR-Code)
                'Electronics',                // category_name
                'This is a sample product description',  // description
                '100.00',                     // purchase_price *
                '150.00',                     // sale_price *
                'pcs',                        // unit
                '0.5',                        // weight
                '10x10x10',                   // dimensions
                'SampleBrand',                // brand
                'Model-X',                    // model
                '',                           // packaging_size
                '',                           // base_unit
                '',                           // packaging_quantity
                'TRUE',                       // is_active (TRUE or FALSE)
                'FALSE',                      // allow_negative_stock (TRUE or FALSE)
            ],
            [
                'Sample Product 2',           // name *
                'SKU-002',                    // sku
                '9876543210987',             // barcode
                'EAN-13',                     // barcode_type
                'Clothing',                   // category_name
                'Blue cotton T-shirt',        // description
                '25.00',                      // purchase_price *
                '50.00',                      // sale_price *
                'pcs',                        // unit
                '0.2',                        // weight
                '30x40x2',                    // dimensions
                'FashionBrand',               // brand
                'Classic-T',                  // model
                '12pcs',                      // packaging_size
                'pcs',                        // base_unit
                '12',                         // packaging_quantity
                'TRUE',                       // is_active
                'FALSE',                      // allow_negative_stock
            ],
        ];
    }

    /**
     * Define column headings
     */
    public function headings(): array
    {
        return [
            'name *',
            'sku',
            'barcode',
            'barcode_type',
            'category_name',
            'description',
            'purchase_price *',
            'sale_price *',
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
