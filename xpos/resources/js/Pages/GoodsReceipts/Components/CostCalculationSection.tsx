interface Props { quantity?: number; unitCost?: number; }

export default function CostCalculationSection({ quantity = 0, unitCost = 0 }: Props) {
    const total = (quantity || 0) * (unitCost || 0);
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Cəmi Dəyər</div>
            <div className="text-lg font-semibold text-gray-900">{Number.isFinite(total) ? `${total.toFixed(2)} AZN` : '-'}</div>
        </div>
    );
}

