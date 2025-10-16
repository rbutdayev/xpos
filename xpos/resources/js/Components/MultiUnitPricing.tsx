import React, { useState, useEffect } from 'react';

interface Product {
    id: number;
    name: string;
    unit_price?: number;
    packaging_price?: number;
    packaging_size?: string;
    base_unit?: string;
    packaging_quantity?: number;
}

interface PricingInfo {
    unitPrice: number;
    totalPrice: number;
    displayUnit: string;
    isPackaging: boolean;
}

interface Props {
    product: Product;
    quantity: number;
    selectedUnit: string;
    onPriceChange: (pricingInfo: PricingInfo) => void;
    onUnitChange: (unit: string) => void;
    showUnitSelector?: boolean;
    className?: string;
}

export default function MultiUnitPricing({ 
    product, 
    quantity, 
    selectedUnit, 
    onPriceChange, 
    onUnitChange,
    showUnitSelector = true,
    className = '' 
}: Props) {
    const [pricingInfo, setPricingInfo] = useState<PricingInfo>({
        unitPrice: 0,
        totalPrice: 0,
        displayUnit: selectedUnit,
        isPackaging: false
    });

    const availableUnits = React.useMemo(() => {
        const units = [];

        // Base unit (litr üçün qiymət)
        if (product.base_unit && product.unit_price !== undefined && product.unit_price !== null && !isNaN(Number(product.unit_price))) {
            units.push({
                value: product.base_unit,
                label: product.base_unit,
                price: Number(product.unit_price),
                isPackaging: false
            });
        }

        // Packaging unit (qab qiyməti)
        if (product.packaging_size && product.packaging_price !== undefined && product.packaging_price !== null && !isNaN(Number(product.packaging_price))) {
            units.push({
                value: 'qab',
                label: `Qab (${product.packaging_size})`,
                price: Number(product.packaging_price),
                isPackaging: true
            });
        }

        return units;
    }, [product]);

    useEffect(() => {
        const selectedUnitInfo = availableUnits.find(u => u.value === selectedUnit);
        
        if (selectedUnitInfo) {
            const newPricingInfo: PricingInfo = {
                unitPrice: selectedUnitInfo.price,
                totalPrice: quantity * selectedUnitInfo.price,
                displayUnit: selectedUnitInfo.label,
                isPackaging: selectedUnitInfo.isPackaging
            };
            
            setPricingInfo(newPricingInfo);
            onPriceChange(newPricingInfo);
        }
    }, [product, quantity, selectedUnit, availableUnits, onPriceChange]);

    const handleUnitChange = (unit: string) => {
        onUnitChange(unit);
    };

    if (availableUnits.length === 0) {
        return (
            <div className={`text-sm text-gray-500 ${className}`}>
                Qiymət məlumatları yoxdur
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {showUnitSelector && availableUnits.length > 1 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Satış vahidi
                    </label>
                    <select
                        value={selectedUnit}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        {availableUnits.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                                {unit.label} - {unit.price.toFixed(2)} AZN
                            </option>
                        ))}
                    </select>
                </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Vahid qiymət:</span>
                        <div className="font-medium">
                            {pricingInfo.unitPrice.toFixed(2)} AZN/{pricingInfo.isPackaging ? 'qab' : product.base_unit}
                        </div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Ümumi məbləğ:</span>
                        <div className="font-medium text-lg">
                            {pricingInfo.totalPrice.toFixed(2)} AZN
                        </div>
                    </div>
                </div>
                
                {pricingInfo.isPackaging && product.packaging_quantity && Number(product.packaging_quantity) > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                        * 1 qab = {product.packaging_quantity} {product.base_unit}
                        (Litr üçün: {(pricingInfo.unitPrice / Number(product.packaging_quantity)).toFixed(4)} AZN/{product.base_unit})
                    </div>
                )}
            </div>
        </div>
    );
}