import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { SettingsSection } from '../SettingsSection';
import FormGrid from '../FormGrid';
import FormField from '../FormField';

interface CompanyData {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    tax_number: string;
    default_language: string;
}

interface CompanyInformationSectionProps {
    data: CompanyData;
    setData: (key: keyof CompanyData, value: string) => void;
    errors: Partial<Record<keyof CompanyData, string>>;
    saving?: boolean;
}

export default function CompanyInformationSection({ 
    data, 
    setData, 
    errors, 
    saving 
}: CompanyInformationSectionProps) {
    return (
        <SettingsSection
            title="Şirkət Məlumatları"
            icon={BuildingOfficeIcon}
            iconColor="text-blue-600"
            saving={saving}
        >
            <FormGrid>
                <FormField label="Şirkət Adı" required error={errors.company_name}>
                    <input
                        type="text"
                        value={data.company_name}
                        onChange={(e) => setData('company_name', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                        required
                    />
                </FormField>

                <FormField label="Vergi Nömrəsi" error={errors.tax_number}>
                    <input
                        type="text"
                        value={data.tax_number}
                        onChange={(e) => setData('tax_number', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                    />
                </FormField>

                <FormField label="Varsayılan Dil" required error={errors.default_language}>
                    <select
                        value={data.default_language}
                        onChange={(e) => setData('default_language', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                        required
                    >
                        <option value="az">Azərbaycan dili</option>
                        <option value="en">English</option>
                        <option value="tr">Türkçe</option>
                    </select>
                </FormField>

                <FormField label="Telefon" error={errors.company_phone}>
                    <input
                        type="text"
                        value={data.company_phone}
                        onChange={(e) => setData('company_phone', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                    />
                </FormField>

                <FormField label="E-mail" error={errors.company_email}>
                    <input
                        type="email"
                        value={data.company_email}
                        onChange={(e) => setData('company_email', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                    />
                </FormField>

                <FormField label="Website" error={errors.company_website} className="md:col-span-2">
                    <input
                        type="url"
                        value={data.company_website}
                        onChange={(e) => setData('company_website', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                        placeholder="https://example.com"
                    />
                </FormField>

                <FormField label="Ünvan" error={errors.company_address} className="md:col-span-2">
                    <textarea
                        rows={3}
                        value={data.company_address}
                        onChange={(e) => setData('company_address', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                    />
                </FormField>
            </FormGrid>
        </SettingsSection>
    );
}