import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    CogIcon,
    BellIcon,
    ClockIcon,
    BuildingOffice2Icon,
    PrinterIcon,
    DocumentDuplicateIcon,
    KeyIcon,
    ChartBarIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { AdminLayout, SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import { useAdminState } from '@/Hooks/Admin/useAdminState';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';
import { InformationCircleIcon, PhoneIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Company } from '@/types';

interface Props {
    company?: Company;
    pos_settings?: {
        auto_print_receipt: boolean;
    };
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

export default function Index({ company, pos_settings }: Props) {
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

    const { data: posData, setData: setPosData, post: postPos, processing: processingPos } = useForm({
        auto_print_receipt: pos_settings?.auto_print_receipt || false,
    });

    const submitCompanyForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (company) {
            put(route('companies.update', company.id));
        }
    };

    const submitPOSForm = (e: React.FormEvent) => {
        e.preventDefault();
        postPos(route('settings.pos.update'));
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
            id: 'pos',
            name: 'POS Parametrləri',
            icon: ComputerDesktopIcon,
            current: activeTab === 'pos',
            onClick: () => setActiveTab('pos')
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
            case 'pos':
                return (
                    <form onSubmit={submitPOSForm} className="space-y-6">
                        <SettingsSection
                            title="POS Parametrləri"
                            icon={ComputerDesktopIcon}
                            iconColor="text-indigo-600"
                        >
                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="auto_print_receipt"
                                        checked={posData.auto_print_receipt}
                                        onChange={(e) => setPosData('auto_print_receipt', e.target.checked)}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Qəbzi avtomatik çap et
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500">
                                    Aktiv olduqda, satış tamamlandıqdan sonra qəbz avtomatik olaraq çap ediləcək.
                                </p>
                            </div>
                        </SettingsSection>
                        <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                            <PrimaryButton disabled={processingPos}>
                                {processingPos ? 'Yadda saxlanır...' : 'Dəyişiklikləri Saxla'}
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

            {/* System Configuration Section */}
            <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Sistem Konfiqurasiyası</h3>
                    <p className="mt-1 text-sm text-gray-500">Printer, qəbz, inteqrasiya və log parametrləri</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Printer Configuration */}
                        <Link
                            href="/printer-configs"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <PrinterIcon className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Printer</h4>
                                    <p className="text-xs text-gray-500">Konfiqurasiya</p>
                                </div>
                            </div>
                        </Link>

                        {/* Receipt Templates */}
                        <Link
                            href="/receipt-templates"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <DocumentDuplicateIcon className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Qəbz</h4>
                                    <p className="text-xs text-gray-500">Şablonları</p>
                                </div>
                            </div>
                        </Link>

                        {/* Bridge Tokens */}
                        <Link
                            href="/bridge-tokens"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <KeyIcon className="h-8 w-8 text-purple-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Bridge</h4>
                                    <p className="text-xs text-gray-500">Tokenlər</p>
                                </div>
                            </div>
                        </Link>

                        {/* Notification Channels */}
                        <Link
                            href="/notification-channels"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <BellIcon className="h-8 w-8 text-yellow-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Bildiriş</h4>
                                    <p className="text-xs text-gray-500">Kanalları</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* System Logs Section */}
            <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Sistem Logları</h3>
                    <p className="mt-1 text-sm text-gray-500">SMS, Telegram, Audit və Fiskal Printer logları</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* SMS Logs */}
                        <Link
                            href="/sms/logs"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">SMS</h4>
                                    <p className="text-xs text-gray-500">Logları</p>
                                </div>
                            </div>
                        </Link>

                        {/* Telegram Logs */}
                        <Link
                            href="/telegram/logs"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <ChartBarIcon className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Telegram</h4>
                                    <p className="text-xs text-gray-500">Logları</p>
                                </div>
                            </div>
                        </Link>

                        {/* Audit Logs */}
                        <Link
                            href="/audit-logs"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <ClockIcon className="h-8 w-8 text-gray-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Audit</h4>
                                    <p className="text-xs text-gray-500">Logları</p>
                                </div>
                            </div>
                        </Link>

                        {/* Fiscal Printer Queue */}
                        <Link
                            href="/fiscal-printer-jobs"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <PrinterIcon className="h-8 w-8 text-red-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Fiskal Printer</h4>
                                    <p className="text-xs text-gray-500">Növbəsi</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}