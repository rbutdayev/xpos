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
    ComputerDesktopIcon,
    LanguageIcon
} from '@heroicons/react/24/outline';
import { AdminLayout, SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import { useAdminState } from '@/Hooks/Admin/useAdminState';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { InformationCircleIcon, PhoneIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Company } from '@/types';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('settings');
    const { activeTab, setActiveTab } = useAdminState('preferences');

    const { data: posData, setData: setPosData, post: postPos, processing: processingPos } = useForm({
        auto_print_receipt: pos_settings?.auto_print_receipt || false,
    });

    const submitPOSForm = (e: React.FormEvent) => {
        e.preventDefault();
        postPos(route('settings.pos.update'));
    };

    const tabs = [
        {
            id: 'preferences',
            name: t('tabs.preferences'),
            icon: CogIcon,
            current: activeTab === 'preferences',
            onClick: () => setActiveTab('preferences')
        },
        {
            id: 'pos',
            name: t('tabs.pos'),
            icon: ComputerDesktopIcon,
            current: activeTab === 'pos',
            onClick: () => setActiveTab('pos')
        },
        {
            id: 'notifications',
            name: t('tabs.notifications'),
            icon: BellIcon,
            current: activeTab === 'notifications',
            onClick: () => setActiveTab('notifications')
        },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'preferences':
                return (
                    <div className="space-y-6">
                        <SettingsSection
                            title={t('preferences.languageSettings')}
                            icon={LanguageIcon}
                            iconColor="text-purple-600"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('preferences.changeLanguage')}
                                    </label>
                                    <LanguageSwitcher />
                                    <p className="mt-2 text-sm text-gray-500">
                                        {t('preferences.languageHint')}
                                    </p>
                                </div>
                            </div>
                        </SettingsSection>
                    </div>
                );
            case 'pos':
                return (
                    <form onSubmit={submitPOSForm} className="space-y-6">
                        <SettingsSection
                            title={t('pos.title')}
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
                                        {t('pos.autoPrintReceipt')}
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500">
                                    {t('pos.autoPrintDescription')}
                                </p>
                            </div>
                        </SettingsSection>
                        <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                            <PrimaryButton disabled={processingPos}>
                                {processingPos ? t('actions.saving') : t('actions.saveChanges')}
                            </PrimaryButton>
                        </div>
                    </form>
                );
            case 'notifications':
                return <div>{t('tabs.notifications')}</div>;
            default:
                return null;
        }
    };

    return (
        <AdminLayout
            title={t('company.title')}
            description={t('description')}
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
                    <h3 className="text-lg font-medium text-gray-900">{t('system.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('system.description')}</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('system.printer.title')}</h4>
                                    <p className="text-xs text-gray-500">{t('system.printer.subtitle')}</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('system.receipt.title')}</h4>
                                    <p className="text-xs text-gray-500">{t('system.receipt.subtitle')}</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('system.bridge.title')}</h4>
                                    <p className="text-xs text-gray-500">{t('system.bridge.subtitle')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Kiosk Tokens */}
                        <Link
                            href="/settings/kiosk-tokens"
                            className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center">
                                <ComputerDesktopIcon className="h-8 w-8 text-indigo-600" />
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">Kiosk Tokenlər</h4>
                                    <p className="text-xs text-gray-500">Kiosk cihazları üçün giriş tokenlərini idarə edin</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('system.notification.title')}</h4>
                                    <p className="text-xs text-gray-500">{t('system.notification.subtitle')}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* System Logs Section */}
            <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{t('logs.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('logs.description')}</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('logs.sms')}</h4>
                                    <p className="text-xs text-gray-500">{t('logs.logsLabel')}</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('logs.telegram')}</h4>
                                    <p className="text-xs text-gray-500">{t('logs.logsLabel')}</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('logs.audit')}</h4>
                                    <p className="text-xs text-gray-500">{t('logs.logsLabel')}</p>
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
                                    <h4 className="text-sm font-medium text-gray-900">{t('logs.fiscalPrinter')}</h4>
                                    <p className="text-xs text-gray-500">{t('logs.queue')}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}