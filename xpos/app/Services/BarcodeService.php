<?php

namespace App\Services;

use App\Models\BarcodeSequence;
use App\Models\Product;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Picqer\Barcode\BarcodeGeneratorSVG;
use Picqer\Barcode\Exceptions\BarcodeException;

class BarcodeService
{
    private BarcodeGeneratorPNG $pngGenerator;
    private BarcodeGeneratorSVG $svgGenerator;

    public function __construct()
    {
        $this->pngGenerator = new BarcodeGeneratorPNG();
        $this->svgGenerator = new BarcodeGeneratorSVG();
    }

    /**
     * Generate barcode for product if it doesn't have one
     */
    public function generateForProduct(Product $product): ?string
    {
        if ($product->barcode && !$product->has_custom_barcode) {
            return $product->barcode;
        }

        if (!$product->barcode) {
            $barcode = $this->generateUniqueBarcode($product->account_id, $product->barcode_type);
            $product->update([
                'barcode' => $barcode,
                'has_custom_barcode' => false,
            ]);
            return $barcode;
        }

        return $product->barcode;
    }

    /**
     * Generate unique barcode based on global sequence
     * To ensure global uniqueness, we use the maximum sequence number across all accounts
     */
    public function generateUniqueBarcode(int $accountId, string $type = 'EAN13'): string
    {
        // Normalize type for database storage
        $normalizedType = $this->normalizeType($type);

        // Get or create sequence for this account
        $sequence = BarcodeSequence::firstOrCreate(
            ['account_id' => $accountId, 'format' => $normalizedType],
            ['prefix' => $this->getDefaultPrefix($normalizedType), 'current_number' => 1]
        );

        // Ensure sequence starts from the global maximum to prevent conflicts
        $maxSequenceNumber = BarcodeSequence::where('format', $normalizedType)
            ->where('prefix', $sequence->prefix)
            ->max('current_number');

        if ($sequence->current_number < $maxSequenceNumber) {
            $sequence->current_number = $maxSequenceNumber;
            $sequence->save();
        }

        // Generate unique barcode
        do {
            $barcode = $this->buildBarcode($sequence, $normalizedType);
            $sequence->increment('current_number');
        } while ($this->barcodeExists($barcode));

        return $barcode;
    }

    /**
     * Generate barcode image as PNG
     */
    public function generatePNG(string $barcode, string $type = 'EAN13', int $widthFactor = 2, int $height = 30): string
    {
        try {
            $barcodeType = $this->getBarcodeType($type);
            return base64_encode($this->pngGenerator->getBarcode($barcode, $barcodeType, $widthFactor, $height));
        } catch (BarcodeException $e) {
            throw new \InvalidArgumentException("Invalid barcode: {$e->getMessage()}");
        }
    }

    /**
     * Generate barcode image as SVG
     */
    public function generateSVG(string $barcode, string $type = 'EAN13', int $widthFactor = 2, int $height = 30): string
    {
        try {
            $barcodeType = $this->getBarcodeType($type);
            return $this->svgGenerator->getBarcode($barcode, $barcodeType, $widthFactor, $height);
        } catch (BarcodeException $e) {
            throw new \InvalidArgumentException("Invalid barcode: {$e->getMessage()}");
        }
    }

    /**
     * Validate barcode format
     */
    public function validateBarcode(string $barcode, string $type): bool
    {
        try {
            $barcodeType = $this->getBarcodeType($type);
            $this->pngGenerator->getBarcode($barcode, $barcodeType);
            return true;
        } catch (BarcodeException $e) {
            return false;
        }
    }

    /**
     * Get supported barcode types
     */
    public function getSupportedTypes(): array
    {
        return [
            'EAN13' => 'EAN-13',
            'EAN8' => 'EAN-8',
            'UPCA' => 'UPC-A',
            'UPCE' => 'UPC-E',
            'CODE128' => 'Code 128',
            'CODE39' => 'Code 39',
            'CODABAR' => 'Codabar',
            'ITF14' => 'ITF-14',
        ];
    }

    /**
     * Generate EAN-13 checksum digit
     */
    public function generateEAN13Checksum(string $code): string
    {
        if (strlen($code) !== 12) {
            throw new \InvalidArgumentException('EAN-13 code must be 12 digits for checksum calculation');
        }

        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $code[$i];
            $sum += ($i % 2 === 0) ? $digit : $digit * 3;
        }

        $checksum = (10 - ($sum % 10)) % 10;
        return $code . $checksum;
    }

    /**
     * Generate UPC-A checksum digit
     */
    public function generateUPCAChecksum(string $code): string
    {
        if (strlen($code) !== 11) {
            throw new \InvalidArgumentException('UPC-A code must be 11 digits for checksum calculation');
        }

        $sum = 0;
        for ($i = 0; $i < 11; $i++) {
            $digit = (int) $code[$i];
            $sum += ($i % 2 === 0) ? $digit * 3 : $digit;
        }

        $checksum = (10 - ($sum % 10)) % 10;
        return $code . $checksum;
    }

    private function buildBarcode(BarcodeSequence $sequence, string $type): string
    {
        switch ($type) {
            case 'EAN13':
                // EAN-13 needs 12 digits before checksum (3 prefix + 9 number)
                $number = str_pad($sequence->current_number, 9, '0', STR_PAD_LEFT);
                $code = $sequence->prefix . $number;
                return $this->generateEAN13Checksum($code);
            
            case 'UPCA':
                // UPC-A needs 11 digits before checksum (2 prefix + 9 number)  
                $number = str_pad($sequence->current_number, 9, '0', STR_PAD_LEFT);
                $code = $sequence->prefix . $number;
                return $this->generateUPCAChecksum($code);
            
            case 'EAN8':
                // EAN-8 needs 7 digits before checksum (2 prefix + 5 number)
                $number = str_pad($sequence->current_number, 5, '0', STR_PAD_LEFT);
                $code = $sequence->prefix . $number;
                return $this->generateEAN8Checksum($code);
            
            case 'CODE128':
            case 'CODE39':
            case 'CODABAR':
                $number = str_pad($sequence->current_number, 8, '0', STR_PAD_LEFT);
                return $sequence->prefix . $number;
            
            default:
                $number = str_pad($sequence->current_number, 8, '0', STR_PAD_LEFT);
                return $sequence->prefix . $number;
        }
    }

    private function generateEAN8Checksum(string $code): string
    {
        if (strlen($code) !== 7) {
            throw new \InvalidArgumentException('EAN-8 code must be 7 digits for checksum calculation');
        }

        $sum = 0;
        for ($i = 0; $i < 7; $i++) {
            $digit = (int) $code[$i];
            $sum += ($i % 2 === 0) ? $digit * 3 : $digit;
        }

        $checksum = (10 - ($sum % 10)) % 10;
        return $code . $checksum;
    }

    private function normalizeType(string $type): string
    {
        return match ($type) {
            'EAN-13' => 'EAN13',
            'EAN-8' => 'EAN8',
            'UPC-A' => 'UPCA',
            'UPC-E' => 'UPCE',
            'Code-128' => 'CODE128',
            'Code-39' => 'CODE39',
            default => strtoupper(str_replace('-', '', $type)),
        };
    }

    private function getDefaultPrefix(string $type): string
    {
        return match ($type) {
            'EAN13', 'EAN-13' => '590', // Azerbaijan country code for EAN
            'EAN8', 'EAN-8' => '59',
            'UPCA', 'UPC-A' => '59',
            'UPCE', 'UPC-E' => '5',
            'CODE128', 'Code-128' => 'ONX',
            'CODE39', 'Code-39' => 'C39',
            'CODABAR' => 'CDB',
            'ITF14' => 'ITF',
            default => 'DEF',
        };
    }

    private function getBarcodeType(string $type): string
    {
        return match ($type) {
            'EAN13' => $this->pngGenerator::TYPE_EAN_13,
            'EAN8' => $this->pngGenerator::TYPE_EAN_8,
            'UPCA' => $this->pngGenerator::TYPE_UPC_A,
            'UPCE' => $this->pngGenerator::TYPE_UPC_E,
            'CODE128' => $this->pngGenerator::TYPE_CODE_128,
            'CODE39' => $this->pngGenerator::TYPE_CODE_39,
            'CODABAR' => $this->pngGenerator::TYPE_CODABAR,
            'ITF14' => $this->pngGenerator::TYPE_ITF_14,
            default => $this->pngGenerator::TYPE_EAN_13,
        };
    }

    private function barcodeExists(string $barcode): bool
    {
        // Check for global barcode uniqueness (matches database constraint)
        return Product::where('barcode', $barcode)
            ->exists();
    }
}