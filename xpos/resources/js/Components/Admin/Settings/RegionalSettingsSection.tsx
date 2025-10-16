import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { SettingsSection } from '../SettingsSection';
import FormGrid from '../FormGrid';
import FormField from '../FormField';

interface RegionalData {
    currency_code: string;
    currency_symbol: string;
    date_format: string;
    time_format: string;
    timezone: string;
}

interface RegionalSettingsSectionProps {
    data: RegionalData;
    setData: (key: keyof RegionalData, value: string) => void;
    errors: Partial<Record<keyof RegionalData, string>>;
    saving?: boolean;
}

export default function RegionalSettingsSection({ 
    data, 
    setData, 
    errors, 
    saving 
}: RegionalSettingsSectionProps) {
    const timezones = [
        { value: 'Asia/Baku', label: 'Bakı (UTC+4)' },
        { value: 'Europe/Istanbul', label: 'İstanbul (UTC+3)' },
        { value: 'Europe/Moscow', label: 'Moskva (UTC+3)' },
        { value: 'UTC', label: 'UTC' }
    ];

    return (
        <SettingsSection
            title="Regional Ayarlar"
            icon={GlobeAltIcon}
            iconColor="text-purple-600"
            saving={saving}
        >
            <FormGrid columns={3}>
                <FormField label="Valyuta Kodu" error={errors.currency_code}>
                    <input
                        type="text"
                        maxLength={3}
                        value={data.currency_code}
                        onChange={(e) => setData('currency_code', e.target.value.toUpperCase())}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </FormField>

                <FormField label="Valyuta Simvolu" error={errors.currency_symbol}>
                    <input
                        type="text"
                        maxLength={5}
                        value={data.currency_symbol}
                        onChange={(e) => setData('currency_symbol', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </FormField>

                <FormField label="Vaxt Zonası" error={errors.timezone}>
                    <select
                        value={data.timezone}
                        onChange={(e) => setData('timezone', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                                {tz.label}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Tarix Formatı" error={errors.date_format}>
                    <select
                        value={data.date_format}
                        onChange={(e) => setData('date_format', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="d.m.Y">31.12.2025</option>
                        <option value="d/m/Y">31/12/2025</option>
                        <option value="Y-m-d">2025-12-31</option>
                        <option value="m/d/Y">12/31/2025</option>
                    </select>
                </FormField>

                <FormField label="Vaxt Formatı" error={errors.time_format}>
                    <select
                        value={data.time_format}
                        onChange={(e) => setData('time_format', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="H:i">24:00 (15:30)</option>
                        <option value="h:i A">12:00 (3:30 PM)</option>
                    </select>
                </FormField>
            </FormGrid>
        </SettingsSection>
    );
}