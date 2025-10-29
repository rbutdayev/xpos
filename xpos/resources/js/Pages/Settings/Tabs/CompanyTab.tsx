import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import { BuildingOffice2Icon, PrinterIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

interface Props {
    company: any;
    settings: any;
}

export default function CompanyTab({ company, settings }: Props) {
    const form: any = useForm({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
        tax_number: settings.tax_number || '',
        default_language: settings.default_language || 'az',
        business_hours_start: settings.business_hours_start || '09:00',
        business_hours_end: settings.business_hours_end || '18:00',
    });

    const { data, setData, post, processing, errors, recentlySuccessful } = form;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('settings.company.update'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <SettingsSection
                title="Şirkət Məlumatları"
                description="Şirkətinizin əsas məlumatları"
                icon={BuildingOffice2Icon}
            >
                <FormGrid>
                    <FormField label="Şirkət Adı" className="sm:col-span-3">
                        <TextInput
                            value={data.company_name}
                            onChange={(e) => setData('company_name', e.target.value)}
                            required
                            className="mt-1 block w-full"
                        />
                    </FormField>

                    <FormField label="Vergi Nömrəsi" className="sm:col-span-3">
                        <TextInput
                            value={data.tax_number}
                            onChange={(e) => setData('tax_number', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </FormField>

                    <FormField label="Telefon" className="sm:col-span-3">
                        <TextInput
                            value={data.company_phone}
                            onChange={(e) => setData('company_phone', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </FormField>

                    <FormField label="Email" className="sm:col-span-3">
                        <TextInput
                            type="email"
                            value={data.company_email}
                            onChange={(e) => setData('company_email', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </FormField>

                    <FormField label="Ünvan" className="sm:col-span-6">
                        <textarea
                            value={data.company_address}
                            onChange={(e) => setData('company_address', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </FormField>

                    <FormField label="Website" className="sm:col-span-6">
                        <TextInput
                            type="url"
                            value={data.company_website}
                            onChange={(e) => setData('company_website', e.target.value)}
                            className="mt-1 block w-full"
                        />
                    </FormField>
                </FormGrid>
            </SettingsSection>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {recentlySuccessful && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                        Parametrlər yadda saxlanıldı
                    </p>
                )}
                <PrimaryButton type="submit" disabled={processing}>
                    {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                </PrimaryButton>
            </div>
        </form>
    );
}
