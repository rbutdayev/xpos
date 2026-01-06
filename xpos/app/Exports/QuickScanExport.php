<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class QuickScanExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected $scans;

    public function __construct($scans)
    {
        $this->scans = $scans;
    }

    public function collection()
    {
        return collect($this->scans);
    }

    public function headings(): array
    {
        return [
            'Barcode',
            'Məhsul Adı',
            'SKU',
            'Sayılmış',
            'Sistem Sayı',
            'Fərq',
            'İlk Scan',
            'Son Scan'
        ];
    }

    public function map($scan): array
    {
        return [
            $scan['barcode'] ?? '',
            $scan['product_name'] ?? '',
            $scan['sku'] ?? '',
            $scan['count'] ?? 0,
            $scan['db_quantity'] ?? 0,
            $scan['difference'] ?? 0,
            $scan['first_scanned_at'] ?? '',
            $scan['last_scanned_at'] ?? '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
