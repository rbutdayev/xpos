import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
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
    MagnifyingGlassIcon,
    ChevronRightIcon,
    ServerIcon,
    ShieldCheckIcon,
    ChatBubbleLeftRightIcon
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

interface SettingItem {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: any;
    iconColor: string;
    category: 'general' | 'hardware' | 'integrations' | 'monitoring';
}

export default function Index({ company, pos_settings }: Props) {
    const { t } = useTranslation('settings');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['hardware', 'integrations', 'monitoring']);

    const { data: posData, setData: setPosData, post: postPos, processing: processingPos } = useForm({
        auto_print_receipt: pos_settings?.auto_print_receipt || false,
    });

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Define all settings items
    const allSettings: SettingItem[] = [
        // General - removed inline settings, only links to actual pages
        {
            id: 'shop-settings',
            title: t('shop.title'),
            description: t('shop.description'),
            href: route('shop-settings.index'),
            icon: BuildingOffice2Icon,
            iconColor: 'text-blue-600',
            category: 'general'
        },
        // Hardware & Devices
        {
            id: 'printer-configs',
            title: t('system.printer.title'),
            description: t('system.printer.subtitle'),
            href: route('printer-configs.index'),
            icon: PrinterIcon,
            iconColor: 'text-blue-600',
            category: 'hardware'
        },
        {
            id: 'fiscal-printer',
            title: t('fiscalPrinter.title'),
            description: t('settings.fiscalPrinter.description'),
            href: route('fiscal-printer.index'),
            icon: PrinterIcon,
            iconColor: 'text-red-600',
            category: 'hardware'
        },
        // Integrations
        {
            id: 'receipt-templates',
            title: t('system.receipt.title'),
            description: t('system.receipt.subtitle'),
            href: route('receipt-templates.index'),
            icon: DocumentDuplicateIcon,
            iconColor: 'text-green-600',
            category: 'integrations'
        },
        {
            id: 'bridge-tokens',
            title: t('bridgeTokens.title'),
            description: t('bridgeTokens.description'),
            href: route('bridge-tokens.index'),
            icon: KeyIcon,
            iconColor: 'text-purple-600',
            category: 'integrations'
        },
        {
            id: 'kiosk-tokens',
            title: t('settings.kioskTokens.title'),
            description: t('settings.kioskTokens.description'),
            href: route('kiosk-tokens.index'),
            icon: ComputerDesktopIcon,
            iconColor: 'text-indigo-600',
            category: 'integrations'
        },
        {
            id: 'notification-channels',
            title: t('system.notification.title'),
            description: t('system.notification.subtitle'),
            href: route('notification-channels.index'),
            icon: BellIcon,
            iconColor: 'text-yellow-600',
            category: 'integrations'
        },
        // Monitoring & Logs
        {
            id: 'audit-logs',
            title: t('logs.audit'),
            description: t('settings.auditLogs.description'),
            href: route('audit-logs.index'),
            icon: ShieldCheckIcon,
            iconColor: 'text-gray-600',
            category: 'monitoring'
        },
        {
            id: 'sms-logs',
            title: t('logs.sms'),
            description: t('settings.smsLogs.description'),
            href: route('sms.logs'),
            icon: ChatBubbleLeftRightIcon,
            iconColor: 'text-indigo-600',
            category: 'monitoring'
        },
        {
            id: 'telegram-logs',
            title: t('logs.telegram'),
            description: t('settings.telegramLogs.description'),
            href: route('telegram.logs'),
            icon: ServerIcon,
            iconColor: 'text-blue-600',
            category: 'monitoring'
        },
        {
            id: 'fiscal-queue',
            title: t('logs.fiscalPrinter'),
            description: t('settings.fiscalQueue.description'),
            href: route('fiscal-printer-jobs.index'),
            icon: ClockIcon,
            iconColor: 'text-orange-600',
            category: 'monitoring'
        },
    ];

    // Filter settings based on search
    const filteredSettings = useMemo(() => {
        if (!searchQuery) return allSettings;
        const query = searchQuery.toLowerCase();
        return allSettings.filter(
            item =>
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
        );
    }, [searchQuery, allSettings]);

    // Group settings by category
    const groupedSettings = useMemo(() => {
        const groups: Record<string, SettingItem[]> = {
            general: [],
            hardware: [],
            integrations: [],
            monitoring: []
        };

        filteredSettings.forEach(item => {
            groups[item.category].push(item);
        });

        return groups;
    }, [filteredSettings]);

    // Quick access items (most frequently used)
    const quickAccessItems = [
        allSettings.find(s => s.id === 'shop-settings'),
        allSettings.find(s => s.id === 'printer-configs'),
        allSettings.find(s => s.id === 'notification-channels'),
    ].filter(Boolean) as SettingItem[];

    const renderSettingItem = (item: SettingItem) => {
        const Icon = item.icon;

        return (
            <Link
                key={item.id}
                href={item.href}
                className="block px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all`}>
                            <Icon className={`w-6 h-6 ${item.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                                {item.description}
                            </p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 ml-4" />
                </div>
            </Link>
        );
    };

    const categoryConfig = {
        general: { title: t('categories.general'), icon: CogIcon },
        hardware: { title: t('categories.hardware'), icon: PrinterIcon },
        integrations: { title: t('categories.integrations'), icon: ServerIcon },
        monitoring: { title: t('categories.monitoring'), icon: ChartBarIcon }
    };

    return (
        <AdminLayout
            title={t('company.title')}
            description={t('description')}
        >
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                            placeholder={t('search.placeholder')}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Access */}
            {!searchQuery && (
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{t('quickAccess.title')}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {quickAccessItems.map(item => renderSettingItem(item))}
                    </div>
                </div>
            )}

            {/* Categorized Settings */}
            <div className="space-y-6">
                {Object.entries(categoryConfig).map(([key, config]) => {
                    const items = groupedSettings[key as keyof typeof groupedSettings];
                    if (items.length === 0) return null;

                    const CategoryIcon = config.icon;
                    const isExpanded = expandedCategories.includes(key);

                    return (
                        <div key={key} className="bg-white rounded-lg shadow">
                            <button
                                onClick={() => toggleCategory(key)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                            >
                                <div className="flex items-center space-x-3">
                                    <CategoryIcon className="w-5 h-5 text-gray-500" />
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                        {config.title}
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {items.length}
                                    </span>
                                </div>
                                <ChevronRightIcon
                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                        isExpanded ? 'rotate-90' : ''
                                    }`}
                                />
                            </button>
                            {isExpanded && (
                                <div className="divide-y divide-gray-100">
                                    {items.map(item => renderSettingItem(item))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* No Results */}
            {searchQuery && filteredSettings.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('search.noResults')}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {t('search.tryAdjusting')}
                    </p>
                </div>
            )}
        </AdminLayout>
    );
}