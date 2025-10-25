import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    BuildingOffice2Icon,
    ShoppingBagIcon,
    BellIcon,
    CogIcon,
} from '@heroicons/react/24/outline';
import { AdminLayout } from '@/Components/Admin';

// Import tab components (we'll create lightweight versions)
import CompanyTab from './Tabs/CompanyTab';
import ShopTab from './Tabs/ShopTab';
import NotificationsTab from './Tabs/NotificationsTab';

interface Props {
    company: any;
    system_settings: any;
    shop_settings: any;
    sms: any;
    telegram: any;
    notification_settings: any;
    account_phone: string;
    active_tab?: string;
}

export default function UnifiedSettings({
    company,
    system_settings,
    shop_settings,
    sms,
    telegram,
    notification_settings,
    account_phone,
    active_tab = 'company',
}: Props) {
    const [activeTab, setActiveTab] = useState(active_tab);

    // Update URL when tab changes (optional, for bookmarking)
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        // Optionally update URL without reloading
        window.history.replaceState(null, '', `/settings?tab=${tab}`);
    };

    const tabs = [
        {
            id: 'company',
            name: 'Şirkət',
            icon: BuildingOffice2Icon,
            description: 'Şirkət məlumatları və sistem parametrləri',
        },
        {
            id: 'shop',
            name: 'Mağaza',
            icon: ShoppingBagIcon,
            description: 'Online mağaza parametrləri',
        },
        {
            id: 'notifications',
            name: 'Bildirişlər',
            icon: BellIcon,
            description: 'SMS və Telegram bildirişləri',
        },
    ];

    return (
        <AdminLayout title="Parametrlər">
            <Head title="Parametrlər" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <CogIcon className="w-8 h-8 mr-3 text-indigo-600" />
                            Parametrlər
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Sistem, mağaza və bildiriş parametrlərini idarə edin
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-6">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleTabChange(tab.id)}
                                            className={`
                                                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                                                ${
                                                    isActive
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                }
                                            `}
                                        >
                                            <Icon
                                                className={`
                                                    -ml-0.5 mr-2 h-5 w-5
                                                    ${
                                                        isActive
                                                            ? 'text-indigo-500'
                                                            : 'text-gray-400 group-hover:text-gray-500'
                                                    }
                                                `}
                                            />
                                            <span>{tab.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Description */}
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {tabs.find((t) => t.id === activeTab)?.description}
                            </p>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-6">
                        {activeTab === 'company' && (
                            <CompanyTab
                                company={company}
                                settings={system_settings}
                            />
                        )}

                        {activeTab === 'shop' && (
                            <ShopTab settings={shop_settings} />
                        )}

                        {activeTab === 'notifications' && (
                            <NotificationsTab
                                sms={sms}
                                telegram={telegram}
                                notification_settings={notification_settings}
                                account_phone={account_phone}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
