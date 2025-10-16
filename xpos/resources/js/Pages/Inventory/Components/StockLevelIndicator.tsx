interface Props {
    percentage: number;
    label?: string;
}

export default function StockLevelIndicator({ percentage, label }: Props) {
    const pct = Math.max(0, Math.min(100, percentage || 0));
    return (
        <div>
            {label && <div className="text-sm text-gray-600 mb-1">{label}</div>}
            <div className="w-full bg-gray-200 rounded h-2">
                <div className="bg-blue-600 h-2 rounded" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

