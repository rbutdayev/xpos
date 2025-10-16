import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    CogIcon, 
    BellIcon,
    ClockIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { AdminLayout, SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import { useAdminState } from '@/Hooks/Admin/useAdminState';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { InformationCircleIcon, PhoneIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Company } from '@/types';

interface Props {
    company?: Company;
}

interface CompanyFormData {
    name: string;
    address: string;
    tax_number: string;
    phone: string;
    email: string;
    website: string;
    description: string;
    default_language: string;
}

export default function Index({ company }: Props) {
    const { activeTab, setActiveTab } = useAdminState('company');
    
    const { data, setData, put, processing, errors } = useForm<CompanyFormData>({
        name: company?.name || '',
        address: company?.address || '',
        tax_number: company?.tax_number || '',
        phone: company?.phone || '',
        email: company?.email || '',
        website: company?.website || '',
        description: company?.description || '',
        default_language: company?.default_language || 'az',
    });

    const submitCompanyForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (company) {
            put(route('companies.update', company.id));
        }
    };

    const tabs = [
        { 
            id: 'company', 
            name: 'Şirkət Məlumatları', 
            icon: BuildingOffice2Icon,
            current: activeTab === 'company',
            onClick: () => setActiveTab('company')
        },
        { 
            id: 'preferences', 
            name: 'Tənzimləmələr', 
            icon: CogIcon,
            current: activeTab === 'preferences',
            onClick: () => setActiveTab('preferences')
        },
        { 
            id: 'notifications', 
            name: 'Bildirişlər', 
            icon: BellIcon,
            current: activeTab === 'notifications',
            onClick: () => setActiveTab('notifications')
        },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'company':
                return (
                    <form onSubmit={submitCompanyForm} className="space-y-6">
                        <SettingsSection
                            title="Əsas Məlumatlar"
                            icon={InformationCircleIcon}
                            iconColor="text-blue-600"
                        >
                            <FormGrid>
                                <FormField label="Şirkət Adı" required error={errors.name} className="md:col-span-2">
                                    <TextInput
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="block w-full"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </FormField>
                                <FormField label="Vergi Nömrəsi" error={errors.tax_number}>
                                    <TextInput
                                        type="text"
                                        name="tax_number"
                                        value={data.tax_number}
                                        className="block w-full"
                                        onChange={(e) => setData('tax_number', e.target.value)}
                                    />
                                </FormField>
                            </FormGrid>
                        </SettingsSection>
                        <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Yadda saxlanır...' : 'Dəyişiklikləri Saxla'}
                            </PrimaryButton>
                        </div>
                    </form>
                );
            case 'preferences':
                return <div>Tənzimləmələr</div>;
            case 'notifications':
                return <div>Bildirişlər</div>;
            default:
                return null;
        }
    };

    return (
        <AdminLayout 
            title="Şirkət Məlumatları"
            description="Şirkətinizin məlumatlarını və sistem ayarlarını idarə edin"
            tabs={tabs}
        >
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    {renderTabContent()}

                </div>
            </div>
            
            {/* Audit Logs Section - Always visible at bottom */}
            <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Fəaliyyət Logları</h3>
                        <Link 
                            href="/audit-logs" 
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Hamısını gör
                        </Link>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Son fəaliyyətlər</h3>
                            <p className="mt-1 text-sm text-gray-500 mb-4">
                                Hesabınızın fəaliyyət loglarını görmək üçün audit logs bölməsinə keçin.
                            </p>
                            <Link
                                href="/audit-logs"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <ClockIcon className="-ml-1 mr-2 h-5 w-5" />
                                Fəaliyyət Logları
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}