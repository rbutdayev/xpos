<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barkod - {{ $product->name }}</title>
    <style>
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            @page {
                margin: 5mm;
                size: 60mm 40mm; /* Optimized for barcode labels */
            }
            
            .no-print {
                display: none !important;
            }
            
            .print-container {
                transform: scale(1);
                width: 50mm;
                height: 30mm;
                padding: 2mm;
                margin: 0;
                border: none;
            }
            
            .header {
                display: none; /* Hide header in print */
            }
            
            .product-info {
                display: none; /* Hide product info in print to save space */
            }
            
            .print-info {
                display: none; /* Hide print info in print */
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
        }
        
        .print-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
        }
        
        .product-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-item {
            padding: 10px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        
        .info-label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 16px;
            color: #333;
        }
        
        .barcode-section {
            text-align: center;
            margin: 40px 0;
            padding: 30px;
            border: 2px dashed #ccc;
            background: #fafafa;
        }
        
        .barcode-image {
            margin: 20px 0;
        }
        
        .barcode-image img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
        
        .barcode-text {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin: 15px 0;
            letter-spacing: 2px;
        }
        
        .barcode-type {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        /* Print-specific barcode section styling */
        @media print {
            .barcode-section {
                width: 48mm;
                height: 28mm;
                margin: 0;
                padding: 1mm;
                background: white;
                border: 1px solid #000;
                border-radius: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .barcode-image {
                margin: 1mm 0;
            }
            
            .barcode-image img {
                max-width: 45mm;
                max-height: 20mm;
                border: none;
                padding: 0;
                margin: 0;
            }
            
            .barcode-text {
                font-size: 8px;
                margin: 1mm 0;
                letter-spacing: 0.5px;
            }
            
            .barcode-type {
                font-size: 6px;
                margin: 0;
            }
        }
        
        .print-info {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        
        .buttons {
            text-align: center;
            margin: 20px 0;
        }
        
        .btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 0 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            background: #2563eb;
        }
        
        .btn-secondary {
            background: #6b7280;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
        }
    </style>
</head>
<body>
    <div class="print-container">
        <div class="header">
            <h1>MƏHSUL BARKODU</h1>
        </div>
        
        <div class="buttons no-print">
            <button class="btn" onclick="window.print()">Çap et</button>
            <a href="{{ url()->previous() }}" class="btn btn-secondary">Geri qayıt</a>
        </div>
        
        <div class="product-info">
            <div class="info-item">
                <div class="info-label">Məhsul Adı</div>
                <div class="info-value">{{ $product->name }}</div>
            </div>
            
            @if($product->sku)
            <div class="info-item">
                <div class="info-label">SKU</div>
                <div class="info-value">{{ $product->sku }}</div>
            </div>
            @endif
            
            @if($product->category)
            <div class="info-item">
                <div class="info-label">Kateqoriya</div>
                <div class="info-value">{{ $product->category->name }}</div>
            </div>
            @endif
            
            @if($product->brand)
            <div class="info-item">
                <div class="info-label">Marka</div>
                <div class="info-value">{{ $product->brand }}</div>
            </div>
            @endif
            
            @if($product->model)
            <div class="info-item">
                <div class="info-label">Model</div>
                <div class="info-value">{{ $product->model }}</div>
            </div>
            @endif
            
            <div class="info-item">
                <div class="info-label">Ölçü Vahidi</div>
                <div class="info-value">{{ $product->unit }}</div>
            </div>
        </div>
        
        <div class="barcode-section">
            @if($product->barcode_type)
            <div class="barcode-type">{{ $product->barcode_type }}</div>
            @endif
            
            <div class="barcode-image">
                <img src="{{ $barcode_url }}" alt="Barkod: {{ $product->barcode }}" />
            </div>
            
            <div class="barcode-text">{{ $product->barcode }}</div>
        </div>
        
        <div class="print-info">
            <p>Çap edilmə tarixi: {{ $generated_at }}</p>
            <p>Bu sənəd xPOS sistemi tərəfindən avtomatik olaraq yaradılmışdır.</p>
        </div>
    </div>
    
    <script>
        // Auto-focus print dialog when page loads for better UX
        window.addEventListener('load', function() {
            // Small delay to ensure page is fully loaded
            setTimeout(function() {
                if (window.location.search.includes('autoprint=1')) {
                    window.print();
                }
            }, 500);
        });
    </script>
</body>
</html>