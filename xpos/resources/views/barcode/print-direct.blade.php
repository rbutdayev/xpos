<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barkod - {{ $product_name }}</title>
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
        
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
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
        
        .product-name {
            font-size: 16px;
            color: #333;
            margin-bottom: 15px;
            font-weight: bold;
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
            
            .product-name {
                font-size: 7px;
                margin: 1mm 0;
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
            <h1>Barkod Etiketi</h1>
            <p>{{ $product_name }}</p>
        </div>
        
        <div class="barcode-section">
            <div class="barcode-image">
                <img src="{{ $barcode_url }}" alt="Barkod: {{ $barcode }}" />
            </div>
            
            <div class="barcode-text">{{ $barcode }}</div>
        </div>
        
        <div class="buttons no-print">
            <button onclick="window.print()" class="btn">Çap et</button>
            <button onclick="window.close()" class="btn btn-secondary">Bağla</button>
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