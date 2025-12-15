<!DOCTYPE html>
<html lang="{{ $account->language ?? 'az' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $account->language === 'ru' ? 'Возврат товара поставщику' : 'Təchizatçıya Mal Qaytarılması' }} - #{{ $return->return_id }}</title>
    <style>
        @page {
            size: A4;
            margin: 10mm;
        }

        @media print {
            body {
                margin: 0;
                padding: 0;
                width: 210mm;
                height: 297mm;
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
            color: #d32f2f;
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

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            margin: 10px 0;
            border-radius: 20px;
            font-weight: bold;
            font-size: 11pt;
        }

        .status-gozlemede { background-color: #fff3cd; color: #856404; }
        .status-tesdiq_edilib { background-color: #cfe2ff; color: #084298; }
        .status-gonderildi { background-color: #e2d9f3; color: #6c2e9c; }
        .status-tamamlanib { background-color: #d1e7dd; color: #0f5132; }
        .status-imtina_edilib { background-color: #f8d7da; color: #842029; }

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

        .info-section {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #333;
            background-color: #f9f9f9;
        }

        .info-section-title {
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #666;
            padding-bottom: 5px;
        }

        .info-grid {
            display: table;
            width: 100%;
            margin-top: 10px;
        }

        .info-row {
            display: table-row;
        }

        .info-label {
            display: table-cell;
            width: 35%;
            font-weight: bold;
            padding: 5px 10px 5px 0;
        }

        .info-value {
            display: table-cell;
            width: 65%;
            padding: 5px 0;
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
            border: 2px solid #d32f2f;
            background-color: #ffebee;
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
            color: #d32f2f;
        }

        .reason-section {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #333;
            background-color: #fff9e6;
        }

        .reason-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 11pt;
        }

        .reason-text {
            white-space: pre-wrap;
            line-height: 1.6;
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
    </style>
</head>
<body>
    <button onclick="window.print()" class="print-button no-print">
        {{ $account->language === 'ru' ? '🖨️ Печать' : '🖨️ Çap et' }}
    </button>

    <div class="container">
        <!-- Document Header -->
        <div class="document-header">
            <h1>{{ $account->language === 'ru' ? 'ВОЗВРАТ ТОВАРА ПОСТАВЩИКУ' : 'TƏCHİZATÇIYA MAL QAYTARILMASI' }}</h1>
            <div class="document-number">{{ $account->language === 'ru' ? '№' : '№' }} {{ $return->return_id }}</div>
            <div class="document-date">
                {{ $account->language === 'ru' ? 'Дата возврата:' : 'Qaytarılma tarixi:' }}
                {{ \Carbon\Carbon::parse($return->return_date)->format('d.m.Y') }}
            </div>
            @php
                $statusMap = [
                    'gozlemede' => $account->language === 'ru' ? 'Ожидание' : 'Gözləmədə',
                    'tesdiq_edilib' => $account->language === 'ru' ? 'Подтверждено' : 'Təsdiq edilib',
                    'gonderildi' => $account->language === 'ru' ? 'Отправлено' : 'Göndərildi',
                    'tamamlanib' => $account->language === 'ru' ? 'Завершено' : 'Tamamlanıb',
                    'imtina_edilib' => $account->language === 'ru' ? 'Отклонено' : 'İmtina edilib',
                ];
                $statusClass = 'status-' . $return->status;
            @endphp
            <div class="status-badge {{ $statusClass }}">
                {{ $account->language === 'ru' ? 'Статус:' : 'Status:' }} {{ $statusMap[$return->status] ?? $return->status }}
            </div>
        </div>

        <!-- Parties Section -->
        <div class="parties-section">
            <!-- Sender (Company - Returning) -->
            <div class="party">
                <div class="party-title">{{ $account->language === 'ru' ? 'ВОЗВРАЩАЕТ' : 'QAYTARAN' }}</div>
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

            <!-- Receiver (Supplier) -->
            <div class="party">
                <div class="party-title">{{ $account->language === 'ru' ? 'ПОЛУЧАТЕЛЬ (ПОСТАВЩИК)' : 'QƏBUL EDƏN (TƏCHİZATÇI)' }}</div>
                @if($return->supplier)
                <div class="party-info">
                    <div><span class="label">{{ $account->language === 'ru' ? 'Название:' : 'Ad:' }}</span> {{ $return->supplier->name }}</div>
                    @if($return->supplier->contact_person)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Контакт. лицо:' : 'Əlaqə şəxsi:' }}</span> {{ $return->supplier->contact_person }}</div>
                    @endif
                    @if($return->supplier->phone)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Телефон:' : 'Telefon:' }}</span> {{ $return->supplier->phone }}</div>
                    @endif
                    @if($return->supplier->email)
                    <div><span class="label">Email:</span> {{ $return->supplier->email }}</div>
                    @endif
                    @if($return->supplier->address)
                    <div><span class="label">{{ $account->language === 'ru' ? 'Адрес:' : 'Ünvan:' }}</span> {{ $return->supplier->address }}</div>
                    @endif
                </div>
                @else
                <div class="party-info">
                    <div>{{ $account->language === 'ru' ? 'Не указан' : 'Göstərilməyib' }}</div>
                </div>
                @endif
            </div>
        </div>

        <!-- Warehouse and Staff Information -->
        <div class="info-section">
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-label">{{ $account->language === 'ru' ? 'Склад:' : 'Anbar:' }}</div>
                    <div class="info-value">{{ $return->warehouse->name ?? '-' }}</div>
                </div>
                @if($return->warehouse && $return->warehouse->location)
                <div class="info-row">
                    <div class="info-label">{{ $account->language === 'ru' ? 'Расположение склада:' : 'Anbar yeri:' }}</div>
                    <div class="info-value">{{ $return->warehouse->location }}</div>
                </div>
                @endif
                @if($return->requestedBy)
                <div class="info-row">
                    <div class="info-label">{{ $account->language === 'ru' ? 'Запросил:' : 'Sorğu edən:' }}</div>
                    <div class="info-value">{{ $return->requestedBy->name }}</div>
                </div>
                @endif
                @if($return->approvedBy)
                <div class="info-row">
                    <div class="info-label">{{ $account->language === 'ru' ? 'Утвердил:' : 'Təsdiq edən:' }}</div>
                    <div class="info-value">{{ $return->approvedBy->name }}</div>
                </div>
                @endif
            </div>
        </div>

        <!-- Products Table -->
        <table class="products-table">
            <thead>
                <tr>
                    <th style="width: 5%">№</th>
                    <th style="width: 35%">{{ $account->language === 'ru' ? 'Наименование товара' : 'Məhsulun adı' }}</th>
                    <th style="width: 15%">{{ $account->language === 'ru' ? 'Артикул' : 'SKU' }}</th>
                    <th style="width: 10%">{{ $account->language === 'ru' ? 'Ед.' : 'Vahid' }}</th>
                    <th style="width: 10%" class="text-center">{{ $account->language === 'ru' ? 'Кол-во' : 'Miqdar' }}</th>
                    <th style="width: 12%" class="text-right">{{ $account->language === 'ru' ? 'Цена' : 'Qiymət' }}</th>
                    <th style="width: 13%" class="text-right">{{ $account->language === 'ru' ? 'Сумма' : 'Məbləğ' }}</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $isMultiItem = $return->items && $return->items->count() > 0;
                @endphp

                @if($isMultiItem)
                    @foreach($return->items as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $item->product->name ?? '-' }}</td>
                        <td>{{ $item->product->sku ?? '-' }}</td>
                        <td>{{ $item->unit ?? '-' }}</td>
                        <td class="text-center">{{ number_format($item->quantity, 3, '.', ',') }}</td>
                        <td class="text-right">{{ number_format($item->unit_cost, 2, '.', ',') }} ₼</td>
                        <td class="text-right">{{ number_format($item->total_cost, 2, '.', ',') }} ₼</td>
                    </tr>
                    @endforeach
                @else
                    {{-- Legacy single-item display --}}
                    <tr>
                        <td class="text-center">1</td>
                        <td>{{ $return->product->name ?? '-' }}</td>
                        <td>{{ $return->product->sku ?? '-' }}</td>
                        <td>{{ $return->product->base_unit ?? '-' }}</td>
                        <td class="text-center">{{ number_format($return->quantity ?? 0, 3, '.', ',') }}</td>
                        <td class="text-right">{{ number_format($return->unit_cost ?? 0, 2, '.', ',') }} ₼</td>
                        <td class="text-right">{{ number_format($return->total_cost, 2, '.', ',') }} ₼</td>
                    </tr>
                @endif
            </tbody>
            <tfoot>
                <tr style="background-color: #f0f0f0; font-weight: bold;">
                    <td colspan="6" class="text-right" style="padding: 10px;">
                        {{ $account->language === 'ru' ? 'ИТОГО:' : 'CƏMİ:' }}
                    </td>
                    <td class="text-right" style="padding: 10px; font-size: 12pt; color: #d32f2f;">
                        {{ number_format($return->total_cost, 2, '.', ',') }} ₼
                    </td>
                </tr>
            </tfoot>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
            <div class="total-row">
                <div class="total-label">{{ $account->language === 'ru' ? 'ИТОГО К ВОЗВРАТУ:' : 'QAYTARILACAQ MƏBLƏĞ:' }}</div>
                <div class="total-value">{{ number_format($return->total_cost, 2, '.', ',') }} ₼</div>
            </div>
            @if($return->refund_amount)
            <div class="total-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d32f2f;">
                <div class="total-label">{{ $account->language === 'ru' ? 'ВОЗВРАЩЕННАЯ СУММА:' : 'GERİ QAYTARILAN MƏBLƏĞ:' }}</div>
                <div class="total-value" style="color: #2e7d32;">{{ number_format($return->refund_amount, 2, '.', ',') }} ₼</div>
            </div>
            @if($return->refund_date)
            <div class="info-row">
                <div class="info-label">{{ $account->language === 'ru' ? 'Дата возврата суммы:' : 'Məbləğ qaytarma tarixi:' }}</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($return->refund_date)->format('d.m.Y') }}</div>
            </div>
            @endif
            @endif
        </div>

        <!-- Return Reason -->
        <div class="reason-section">
            <div class="reason-title">{{ $account->language === 'ru' ? 'Причина возврата:' : 'Qaytarılma səbəbi:' }}</div>
            <div class="reason-text">{{ $return->reason }}</div>
        </div>

        <!-- Supplier Response -->
        @if($return->supplier_response)
        <div class="reason-section">
            <div class="reason-title">{{ $account->language === 'ru' ? 'Ответ поставщика:' : 'Təchizatçının cavabı:' }}</div>
            <div class="reason-text">{{ $return->supplier_response }}</div>
        </div>
        @endif

        <!-- Signatures Section -->
        <div class="signatures-section">
            <div class="signature">
                <div class="signature-title">{{ $account->language === 'ru' ? 'Передал (Возвращает):' : 'Təhvil verən (Qaytaran):' }}</div>
                <div class="signature-line">
                    _________________ / _________________
                    <div style="font-size: 8pt; margin-top: 3px;">
                        ({{ $account->language === 'ru' ? 'подпись' : 'imza' }}) / ({{ $account->language === 'ru' ? 'ФИО' : 'A.S.A' }})
                    </div>
                </div>
            </div>

            <div class="signature">
                <div class="signature-title">{{ $account->language === 'ru' ? 'Принял (Поставщик):' : 'Təhvil alan (Təchizatçı):' }}</div>
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
</body>
</html>
