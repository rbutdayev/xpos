import { ClockIcon } from '@heroicons/react/24/outline';
import { SettingsSection } from '../SettingsSection';
import FormGrid from '../FormGrid';
import FormField from '../FormField';

interface BusinessHoursData {
    business_hours_start: string;
    business_hours_end: string;
    business_days: string[];
}

interface BusinessHoursSectionProps {
    data: BusinessHoursData;
    setData: (key: keyof BusinessHoursData, value: string | string[]) => void;
    errors: Partial<Record<keyof BusinessHoursData, string>>;
    onBusinessDayChange: (dayValue: string, checked: boolean) => void;
    saving?: boolean;
}

export default function BusinessHoursSection({ 
    data, 
    setData, 
    errors, 
    onBusinessDayChange,
    saving 
}: BusinessHoursSectionProps) {
    const weekDays = [
        { value: '1', label: 'Bazar ertəsi' },
        { value: '2', label: 'Çərşənbə axşamı' },
        { value: '3', label: 'Çərşənbə' },
        { value: '4', label: 'Cümə axşamı' },
        { value: '5', label: 'Cümə' },
        { value: '6', label: 'Şənbə' },
        { value: '0', label: 'Bazar' }
    ];

    return (
        <SettingsSection
            title="İş Saatları"
            icon={ClockIcon}
            iconColor="text-orange-600"
            saving={saving}
        >
            <FormGrid>
                <FormField label="Başlama Saatı" error={errors.business_hours_start}>
                    <input
                        type="time"
                        value={data.business_hours_start}
                        onChange={(e) => setData('business_hours_start', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                    />
                </FormField>

                <FormField label="Bitirmə Saatı" error={errors.business_hours_end}>
                    <input
                        type="time"
                        value={data.business_hours_end}
                        onChange={(e) => setData('business_hours_end', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                    />
                </FormField>

                <FormField 
                    label="İş Günləri" 
                    error={errors.business_days}
                    className="md:col-span-2"
                >
                    <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                        {weekDays.map((day) => (
                            <label key={day.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.business_days.includes(day.value)}
                                    onChange={(e) => onBusinessDayChange(day.value, e.target.checked)}
                                    className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-900">{day.label}</span>
                            </label>
                        ))}
                    </div>
                </FormField>
            </FormGrid>
        </SettingsSection>
    );
}