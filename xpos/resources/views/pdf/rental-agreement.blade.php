<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İcarə Müqaviləsi - {{ $rental->rental_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 0;
        }

        .header {
            text-align: center;
            padding: 20px;
            border-bottom: 2px solid #333;
            background-color: #f8f9fa;
        }

        .header h1 {
            font-size: 18pt;
            margin-bottom: 5px;
            color: #2c3e50;
        }

        .header h2 {
            font-size: 14pt;
            color: #7f8c8d;
            margin-bottom: 15px;
        }

        .header .meta {
            font-size: 10pt;
            color: #666;
        }

        .section {
            padding: 15px 20px;
            border-bottom: 1px solid #ddd;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
            text-transform: uppercase;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }

        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }

        .info-label {
            display: table-cell;
            width: 35%;
            font-weight: bold;
            color: #555;
        }

        .info-value {
            display: table-cell;
            width: 65%;
            color: #333;
        }

        .checklist {
            margin: 10px 0;
        }

        .checklist-item {
            padding: 5px 0;
            border-bottom: 1px dotted #ddd;
        }

        .checklist-item:last-child {
            border-bottom: none;
        }

        .price-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        .price-table td {
            padding: 8px;
            border-bottom: 1px solid #eee;
        }

        .price-table .label {
            font-weight: bold;
            width: 60%;
        }

        .price-table .amount {
            text-align: right;
            width: 40%;
            font-size: 12pt;
        }

        .price-table .total {
            font-weight: bold;
            font-size: 13pt;
            background-color: #f8f9fa;
        }

        .terms {
            font-size: 9pt;
            line-height: 1.5;
            color: #555;
            white-space: pre-wrap;
        }

        .signatures {
            padding: 30px 20px;
            display: table;
            width: 100%;
        }

        .signature-block {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 0 15px;
        }

        .signature-block h3 {
            font-size: 11pt;
            margin-bottom: 10px;
            color: #2c3e50;
        }

        .signature-line {
            border-top: 2px solid #333;
            margin: 40px auto 10px;
            width: 80%;
        }

        .signature-name {
            font-weight: bold;
            margin-top: 5px;
        }

        .signature-date {
            font-size: 9pt;
            color: #666;
            margin-top: 3px;
        }

        .photos-grid {
            display: table;
            width: 100%;
            margin: 10px 0;
        }

        .photo-item {
            display: table-cell;
            width: 25%;
            padding: 5px;
            text-align: center;
        }

        .photo-placeholder {
            width: 100%;
            height: 80px;
            border: 1px solid #ddd;
            background-color: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8pt;
            color: #999;
        }

        .footer {
            padding: 15px 20px;
            text-align: center;
            font-size: 9pt;
            color: #666;
            background-color: #f8f9fa;
        }

        .checkmark {
            color: #27ae60;
            font-weight: bold;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        .items-table th {
            background-color: #f8f9fa;
            padding: 8px;
            text-align: left;
            font-size: 10pt;
            border-bottom: 2px solid #333;
        }

        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{{ $branch->name ?? 'XPOS' }}</h1>
            <h2>İCARƏ MÜQAVİLƏSİ / RENTAL AGREEMENT</h2>
            <div class="meta">
                <strong>Müqavilə №:</strong> {{ $rental->rental_number }}<br>
                <strong>Tarix:</strong> {{ $rental->created_at->format('d.m.Y H:i') }}
            </div>
        </div>

        <!-- Customer Information -->
        <div class="section">
            <div class="section-title">MÜŞTƏRİ MƏLUMATI / CUSTOMER INFORMATION</div>
            <div class="info-row">
                <div class="info-label">Ad / Name:</div>
                <div class="info-value">{{ $customer->name }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Telefon / Phone:</div>
                <div class="info-value">{{ $customer->phone }}</div>
            </div>
            @if($customer->email)
            <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">{{ $customer->email }}</div>
            </div>
            @endif
        </div>

        <!-- Rental Items -->
        <div class="section">
            <div class="section-title">MƏHSUL MƏLUMATI / PRODUCT INFORMATION</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Məhsul / Product</th>
                        <th>SKU</th>
                        <th>Qiymət / Price</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $item)
                    <tr>
                        <td>{{ $item->product_name }}</td>
                        <td>{{ $item->sku ?? '-' }}</td>
                        <td>{{ number_format($item->total_price, 2) }} AZN</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="info-row" style="margin-top: 15px;">
                <div class="info-label">Kateqoriya / Category:</div>
                <div class="info-value">{{ ucfirst($agreement->rental_category ?? 'general') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">İcarə müddəti / Rental Period:</div>
                <div class="info-value">
                    {{ $rental->rental_start_date->format('d.m.Y') }} - {{ $rental->rental_end_date->format('d.m.Y') }}
                    ({{ $rental->rental_start_date->diffInDays($rental->rental_end_date) }} gün / days)
                </div>
            </div>
        </div>

        <!-- Pricing -->
        <div class="section">
            <table class="price-table">
                <tr>
                    <td class="label">İcarə Qiyməti / Rental Price:</td>
                    <td class="amount">{{ number_format($rental->rental_price, 2) }} AZN</td>
                </tr>
                @if($rental->collateral_type === 'deposit_cash' && $rental->collateral_amount)
                <tr>
                    <td class="label">Depozit / Deposit:</td>
                    <td class="amount">{{ number_format($rental->collateral_amount, 2) }} AZN</td>
                </tr>
                @endif
                <tr class="total">
                    <td class="label">Cəmi / Total:</td>
                    <td class="amount">{{ number_format($rental->total_cost, 2) }} AZN</td>
                </tr>
            </table>
        </div>

        <!-- Collateral Information -->
        <div class="section">
            <div class="section-title">GİROV MƏLUMATI / COLLATERAL INFORMATION</div>
            <div class="info-row">
                <div class="info-label">Girov Növü / Type:</div>
                <div class="info-value">
                    @php
                        $collateralTypeLabels = [
                            'deposit_cash' => 'Nağd depozit / Cash Deposit',
                            'passport' => 'Pasport / Passport',
                            'id_card' => 'Şəxsiyyət vəsiqəsi / ID Card',
                            'drivers_license' => 'Sürücülük vəsiqəsi / Driver\'s License',
                            'other_document' => 'Digər sənəd / Other Document',
                        ];
                        echo $collateralTypeLabels[$rental->collateral_type] ?? $rental->collateral_type;
                    @endphp
                </div>
            </div>
            @if($rental->collateral_type === 'deposit_cash' && $rental->collateral_amount)
            <div class="info-row">
                <div class="info-label">Məbləğ / Amount:</div>
                <div class="info-value">{{ number_format($rental->collateral_amount, 2) }} AZN</div>
            </div>
            @endif
            @if($rental->collateral_document_type)
            <div class="info-row">
                <div class="info-label">Sənəd Növü / Document Type:</div>
                <div class="info-value">{{ $rental->collateral_document_type }}</div>
            </div>
            @endif
            @if($rental->collateral_document_number)
            <div class="info-row">
                <div class="info-label">Sənəd Nömrəsi / Document Number:</div>
                <div class="info-value">{{ $rental->collateral_document_number }}</div>
            </div>
            @endif
            @if($rental->collateral_notes)
            <div class="info-row">
                <div class="info-label">Qeydlər / Notes:</div>
                <div class="info-value">{{ $rental->collateral_notes }}</div>
            </div>
            @endif
        </div>

        <!-- Condition at Rental -->
        @if($agreement && $agreement->condition_checklist)
        <div class="section">
            <div class="section-title">QƏBUL VƏZİYYƏTİ / CONDITION AT RENTAL</div>
            <div class="checklist">
                @foreach($agreement->condition_checklist as $key => $value)
                <div class="checklist-item">
                    @if(is_bool($value))
                        <span class="checkmark">{{ $value ? '✓' : '✗' }}</span>
                    @endif
                    <strong>{{ $key }}:</strong>
                    @if(is_bool($value))
                        {{ $value ? 'Bəli / Yes' : 'Xeyr / No' }}
                    @elseif(is_array($value))
                        {{ implode(', ', $value) }}
                    @else
                        {{ $value }}
                    @endif
                </div>
                @endforeach
            </div>

            @if($agreement->notes)
            <div style="margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #3498db;">
                <strong>Qeydlər / Notes:</strong><br>
                {{ $agreement->notes }}
            </div>
            @endif
        </div>
        @endif

        <!-- Terms & Conditions -->
        @if($agreement && $agreement->terms_and_conditions)
        <div class="section">
            <div class="section-title">ŞƏRTLƏR / TERMS & CONDITIONS</div>
            <div class="terms">{{ $agreement->terms_and_conditions }}</div>
        </div>
        @endif

        <!-- Damage Liability -->
        @if($agreement && $agreement->damage_liability_terms)
        <div class="section">
            <div class="section-title">ZƏRƏR MƏSULİYYƏTİ / DAMAGE LIABILITY</div>
            <div class="terms">{{ $agreement->damage_liability_terms }}</div>
        </div>
        @endif

        <!-- Signatures -->
        <div class="signatures">
            <div class="signature-block">
                <h3>MÜŞTƏRİ / CUSTOMER</h3>
                <div class="signature-line"></div>
                <div class="signature-name">{{ $customer->name }}</div>
                @if($agreement && $agreement->customer_signed_at)
                <div class="signature-date">{{ $agreement->customer_signed_at->format('d.m.Y H:i') }}</div>
                @endif
            </div>
            <div class="signature-block">
                <h3>İŞÇİ / STAFF</h3>
                <div class="signature-line"></div>
                @if($agreement && $agreement->staffUser)
                <div class="signature-name">{{ $agreement->staffUser->name ?? 'Staff' }}</div>
                @endif
                @if($agreement && $agreement->staff_signed_at)
                <div class="signature-date">{{ $agreement->staff_signed_at->format('d.m.Y H:i') }}</div>
                @endif
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            Sənəd avtomatik yaradılmışdır / Document generated automatically<br>
            {{ now()->format('d.m.Y H:i:s') }}
        </div>
    </div>
</body>
</html>
