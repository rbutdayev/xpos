<!DOCTYPE html>
<html lang="{{ $account->language ?? 'az' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $account->language === 'ru' ? 'Накладная на приход товара' : 'Mal Qəbul Qaiməsi' }} - {{ $receipt->receipt_number }}</title>
    <style>
        @media print {
            body {
                margin: 0;
                padding: 10mm;
            }
            .no-print {
                display: none !important;
            }
            .page-break {
                page-break-after: always;
            }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
            background: white;
        }

        .container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 15mm;
        }

        .document-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
        }

        .document-header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .document-number {
            font-size: 13pt;
            font-weight: bold;
            margin: 10px 0;
        }

        .document-date {
            font-size: 10pt;
            color: #333;
        }

        .parties-section {
            margin: 20px 0;
            display: table;
            width: 100%;
            border: 1px solid #000;
        }

        .party {
            display: table-cell;
            width: 50%;
            padding: 15px;
            vertical-align: top;
        }

        .party:first-child {
            border-right: 1px solid #000;
        }

        .party-title {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
        }

        .party-info {
            font-size: 10pt;
            line-height: 1.6;
        }

        .party-info .label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
        }

        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
        }

        .products-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 10pt;
        }

        .products-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
        }

        .products-table .text-right {
            text-align: right;
        }

        .products-table .text-center {
            text-align: center;
        }

        .totals-section {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #000;
            background-color: #f9f9f9;
        }

        .total-row {
            display: table;
            width: 100%;
            margin: 5px 0;
            font-size: 11pt;
        }

        .total-label {
            display: table-cell;
            width: 70%;
            font-weight: bold;
            text-align: right;
            padding-right: 20px;
        }

        .total-value {
            display: table-cell;
            width: 30%;
            font-weight: bold;
            font-size: 13pt;
        }

        .notes-section {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #333;
            min-height: 60px;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .signatures-section {
            margin-top: 40px;
            display: table;
            width: 100%;
        }

        .signature {
            display: table-cell;
            width: 50%;
            padding: 10px;
        }

        .signature-title {
            font-weight: bold;
            margin-bottom: 30px;
            font-size: 10pt;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 9pt;
            text-align: center;
        }

        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 14pt;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            z-index: 1000;
        }

        .print-button:hover {
            background: #45a049;
        }

        .warehouse-info {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #333;
            background-color: #f5f5f5;
        }

        .info-row {
            margin: 5px 0;
        }

        .info-row .label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
    </style>
</head>
<body>
    <button onclick="window.print()" class="print-button no-print">
        {{ $account->language === 'ru' ? '🖨️ Печать' : '🖨️ Çap et' }}
    </button>

    <div class="container">
        <!-- Document Header -->
        <div class="document-header">
            <h1>{{ $account->language === 'ru' ? 'НАКЛАДНАЯ НА ПРИХОД ТОВАРА' : 'MAL QƏBUL QAİMƏSİ' }}</h1>
            <div class="document-number">{{ $account->language === 'ru' ? '№' : '№' }} {{ $receipt->receipt_number }}</div>
            <div class="document-date">
                {{ $account->language === 'ru' ? 'Дата:' : 'Tarix:' }}
                {{ \Carbon\Carbon::parse($receipt->created_at)->format('d.m.Y H:i') }}
            </div>
        </div>

        <!-- Parties Section -->
        <div class="parties-section">
            <!-- Receiver (Company) -->
            <div class="party">
                <div class="party-title">{{ $account->language === 'ru' ? 'ПОЛУЧАТЕЛЬ' : 'QƏBUL EDƏN' }}</div>
                <div class="party-info">
                    <div><span class="label">{{ $account->language === 'ru' ? 'Организация:' : 'Təşkilat:' }}</span> {{ $account->company_name ?? '-' }}</div>
                    @if($account->address)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Адрес:' : 'Ünvan:' }}</span> {{ $account->address }}</div>
                    @endif
                    @if($account->tax_number)
                    <div><span class="label">{{ $account->language === 'ru' ? 'ИНН:' : 'VÖEN:' }}</span> {{ $account->tax_number }}</div>
                    @endif
                    @if($account->phone)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Телефон:' : 'Telefon:' }}</span> {{ $account->phone }}</div>
                    @endif
                    @if($account->email)
                    <div><span class="label">Email:</span> {{ $account->email }}</div>
                    @endif
                </div>
            </div>

            <!-- Supplier -->
            <div class="party">
                <div class="party-title">{{ $account->language === 'ru' ? 'ПОСТАВЩИК' : 'TƏCHİZATÇI' }}</div>
                @if($receipt->supplier)
                <div class="party-info">
                    <div><span class="label">{{ $account->language === 'ru' ? 'Название:' : 'Ad:' }}</span> {{ $receipt->supplier->name }}</div>
                    @if($receipt->supplier->contact_person)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Контакт. лицо:' : 'Əlaqə şəxsi:' }}</span> {{ $receipt->supplier->contact_person }}</div>
                    @endif
                    @if($receipt->supplier->phone)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Телефон:' : 'Telefon:' }}</span> {{ $receipt->supplier->phone }}</div>
                    @endif
                    @if($receipt->supplier->email)
                    <div><span class="label">Email:</span> {{ $receipt->supplier->email }}</div>
                    @endif
                    @if($receipt->supplier->address)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Адрес:' : 'Ünvan:' }}</span> {{ $receipt->supplier->address }}</div>
                    @endif
                </div>
                @else
                <div class="party-info">
                    <div>{{ $account->language === 'ru' ? 'Не указан' : 'Göstərilməyib' }}</div>
                </div>
                @endif
            </div>
        </div>

        <!-- Warehouse Information -->
        <div class="warehouse-info">
            <div class="info-row">
                <span class="label">{{ $account->language === 'ru' ? 'Склад:' : 'Anbar:' }}</span>
                {{ $receipt->warehouse->name ?? '-' }}
            </div>
            @if($receipt->warehouse && $receipt->warehouse->location)
            <div class="info-row">
                <span class="label">{{ $account->language === 'ru' ? 'Расположение склада:' : 'Anbar yeri:' }}</span>
                {{ $receipt->warehouse->location }}
            </div>
            @endif
            @if($receipt->employee)
            <div class="info-row">
                <span class="label">{{ $account->language === 'ru' ? 'Принял:' : 'Qəbul edən:' }}</span>
                {{ $receipt->employee->name }}
            </div>
            @endif
        </div>

        <!-- Products Table -->
        <table class="products-table">
            <thead>
                <tr>
                    <th style="width: 5%">№</th>
                    <th style="width: 35%">{{ $account->language === 'ru' ? 'Наименование товара' : 'Məhsulun adı' }}</th>
                    <th style="width: 15%">{{ $account->language === 'ru' ? 'Артикул' : 'SKU' }}</th>
                    @if($receipt->variant)
                    <th style="width: 15%">{{ $account->language === 'ru' ? 'Вариант' : 'Variant' }}</th>
                    @endif
                    <th style="width: 10%" class="text-center">{{ $account->language === 'ru' ? 'Кол-во' : 'Miqdar' }}</th>
                    <th style="width: 10%" class="text-right">{{ $account->language === 'ru' ? 'Цена' : 'Qiymət' }}</th>
                    <th style="width: 10%" class="text-right">{{ $account->language === 'ru' ? 'Сумма' : 'Məbləğ' }}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="text-center">1</td>
                    <td>{{ $receipt->product->name ?? '-' }}</td>
                    <td>{{ $receipt->product->sku ?? '-' }}</td>
                    @if($receipt->variant)
                    <td>{{ $receipt->variant->display_name ?? '-' }}</td>
                    @endif
                    <td class="text-center">{{ $receipt->quantity }} {{ $receipt->unit }}</td>
                    <td class="text-right">{{ number_format($receipt->unit_cost, 2, '.', ',') }} ₼</td>
                    <td class="text-right">{{ number_format($receipt->total_cost, 2, '.', ',') }} ₼</td>
                </tr>
            </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
            <div class="total-row">
                <div class="total-label">{{ $account->language === 'ru' ? 'ИТОГО:' : 'CƏMİ:' }}</div>
                <div class="total-value">{{ number_format($receipt->total_cost, 2, '.', ',') }} ₼</div>
            </div>
        </div>

        <!-- Notes Section -->
        @if($receipt->notes)
        <div class="notes-section">
            <div class="notes-title">{{ $account->language === 'ru' ? 'Примечания:' : 'Qeydlər:' }}</div>
            <div>{{ $receipt->notes }}</div>
        </div>
        @endif

        <!-- Signatures Section -->
        <div class="signatures-section">
            <div class="signature">
                <div class="signature-title">{{ $account->language === 'ru' ? 'Передал (Поставщик):' : 'Təhvil verən (Təchizatçı):' }}</div>
                <div class="signature-line">
                    _________________ / _________________
                    <div style="font-size: 8pt; margin-top: 3px;">
                        ({{ $account->language === 'ru' ? 'подпись' : 'imza' }}) / ({{ $account->language === 'ru' ? 'ФИО' : 'A.S.A' }})
                    </div>
                </div>
            </div>

            <div class="signature">
                <div class="signature-title">{{ $account->language === 'ru' ? 'Принял (Получатель):' : 'Təhvil alan (Qəbul edən):' }}</div>
                <div class="signature-line">
                    _________________ / _________________
                    <div style="font-size: 8pt; margin-top: 3px;">
                        ({{ $account->language === 'ru' ? 'подпись' : 'imza' }}) / ({{ $account->language === 'ru' ? 'ФИО' : 'A.S.A' }})
                    </div>
                </div>
            </div>
        </div>

        <!-- Print date footer -->
        <div style="margin-top: 30px; text-align: center; font-size: 8pt; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
            {{ $account->language === 'ru' ? 'Документ распечатан:' : 'Sənəd çap olunub:' }} {{ now()->format('d.m.Y H:i') }}
        </div>
    </div>

    <script>
        // Auto-print on load (optional - comment out if not desired)
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>
