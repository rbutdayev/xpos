import { memo } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { ServiceTotals } from '../Utils/serviceCalculations';

interface LaborSectionProps {
    laborCost: number;
    onLaborCostChange: (cost: number) => void;
    totals: ServiceTotals;
    errors: Record<string, string>;
    processing?: boolean;
}

export const LaborSection = memo(({
    laborCost,
    onLaborCostChange,
    totals,
    errors,
    processing = false
}: LaborSectionProps) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <InputLabel htmlFor="labor_cost" value="İş xərcləri" />
                    <TextInput
                        id="labor_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={laborCost || ''}
                        onChange={(e) => onLaborCostChange(Number(e.target.value) || 0)}
                        disabled={processing}
                        className="mt-1 block w-full"
                        placeholder="0.00"
                    />
                    <div className="text-sm text-gray-500 mt-1">AZN</div>
                    <InputError message={errors.labor_cost} className="mt-2" />
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Xərc Hesabatı</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Məhsul/Xidmət cəmi:</span>
                        <span className="font-medium">{totals.formattedItemsCost}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">İş xərcləri:</span>
                        <span className="font-medium">{totals.formattedLaborCost}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                        <span className="font-semibold text-gray-900">Ümumi məbləğ:</span>
                        <span className="font-bold text-lg text-indigo-600">{totals.formattedTotalCost}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});