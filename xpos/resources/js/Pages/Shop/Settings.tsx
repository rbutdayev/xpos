import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ShoppingBagIcon,
    GlobeAltIcon,
    BuildingStorefrontIcon,
    BellIcon,
    DevicePhoneMobileIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';
import { PageProps } from '@/types';
import { useTranslation } from 'react-i18next';

interface Warehouse {
    id: number;
    name: string;
}

interface ShopSettingsProps extends PageProps {
    shop_settings: {
        shop_enabled: boolean;
        shop_slug: string;
        shop_warehouse_id: number | null;
        shop_url: string;
        shop_sms_merchant_notifications: boolean;
        shop_notification_phone: string | null;
        shop_sms_customer_notifications: boolean;
        shop_customer_sms_template: string | null;
    };
    warehouses: Warehouse[];
    sms_configured: boolean;
    platform_statuses: {
        wolt_enabled: boolean;
        yango_enabled: boolean;
        bolt_enabled: boolean;
    };
}

type TabType = 'ecommerce' | 'wolt' | 'yango' | 'bolt';

export default function ShopSettings({
    auth,
    shop_settings,
    warehouses,
    sms_configured,
    platform_statuses,
}: ShopSettingsProps) {
    const { t } = useTranslation('settings');
    const [activeTab, setActiveTab] = useState<TabType>('ecommerce');

    const form = useForm({
        shop_enabled: shop_settings.shop_enabled || false,
        shop_slug: shop_settings.shop_slug || '',
        shop_warehouse_id: shop_settings.shop_warehouse_id || '',
        shop_sms_merchant_notifications: shop_settings.shop_sms_merchant_notifications || false,
        shop_notification_phone: shop_settings.shop_notification_phone || '',
        shop_sms_customer_notifications: shop_settings.shop_sms_customer_notifications || false,
        shop_customer_sms_template: shop_settings.shop_customer_sms_template || '',
    });

    const { data, setData, post, processing, errors, recentlySuccessful } = form;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('shop-settings.update'), {
            preserveScroll: true,
        });
    };

    // Define available tabs based on what's enabled
    const availableTabs = [
        {
            id: 'ecommerce' as TabType,
            label: 'E-commerce',
            icon: ShoppingBagIcon,
            enabled: true // Always show e-commerce tab
        },
        {
            id: 'wolt' as TabType,
            label: 'Wolt',
            icon: TruckIcon,
            enabled: platform_statuses.wolt_enabled
        },
        {
            id: 'yango' as TabType,
            label: 'Yango',
            icon: TruckIcon,
            enabled: platform_statuses.yango_enabled
        },
        {
            id: 'bolt' as TabType,
            label: 'Bolt Food',
            icon: TruckIcon,
            enabled: platform_statuses.bolt_enabled
        },
    ].filter(tab => tab.enabled);

    return (
        <AuthenticatedLayout>
            <Head title={t('shop.onlineShop')} />

            <div className="py-6 sm:py-12">
                <div className="px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('shop.onlineShop')}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage your online shop and delivery platform integrations
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            {availableTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                                            ${isActive
                                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className={`
                                            -ml-0.5 mr-2 h-5 w-5
                                            ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500'}
                                        `} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'ecommerce' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* E-commerce Shop Settings */}

                            {/* Shop Status Card */}
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center">
                                        <ShoppingBagIcon className="w-6 h-6 text-blue-600 mr-3" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {t('shop.shopStatus')}
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    {!sms_configured && (
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-yellow-400"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                        {t('shop.smsNotConfigured')}{' '}
                                                        <a
                                                            href="/integrations/sms"
                                                            className="font-medium underline hover:text-yellow-900 dark:hover:text-yellow-100"
                                                        >
                                                            {t('shop.smsParameters')}
                                                        </a>{' '}
                                                        {t('shop.smsParametersLink')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            checked={data.shop_enabled}
                                            onChange={(e) => setData('shop_enabled', e.target.checked)}
                                            disabled={!sms_configured}
                                        />
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('shop.enableShop')}
                                        </label>
                                    </div>
                                    {errors.shop_enabled && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.shop_enabled}</p>
                                    )}

                                    {data.shop_enabled && (
                                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-green-400"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-green-800 dark:text-green-200">
                                                        {t('shop.shopActive')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shop Configuration Card */}
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center">
                                        <GlobeAltIcon className="w-6 h-6 text-blue-600 mr-3" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {t('shop.shopConfiguration')}
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Shop Slug */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('shop.shopSlug')}
                                        </label>
                                        <TextInput
                                            value={data.shop_slug}
                                            onChange={(e) =>
                                                setData(
                                                    'shop_slug',
                                                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                                )
                                            }
                                            placeholder="menim-magazam"
                                            disabled={!data.shop_enabled}
                                            className="mt-1 block w-full"
                                        />
                                        {errors.shop_slug && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.shop_slug}</p>
                                        )}
                                        {data.shop_slug && data.shop_enabled && (
                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                                <div className="flex items-center">
                                                    <GlobeAltIcon className="w-5 h-5 text-blue-600 mr-2" />
                                                    <div>
                                                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                                            {t('shop.shopUrlLabel')}
                                                        </p>
                                                        <a
                                                            href={`${window.location.origin}/shop/${data.shop_slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                                        >
                                                            {window.location.origin}/shop/{data.shop_slug}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Warehouse Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <BuildingStorefrontIcon className="w-5 h-5 inline mr-1" />
                                            {t('shop.warehouse')}
                                        </label>
                                        <select
                                            value={data.shop_warehouse_id}
                                            onChange={(e) => setData('shop_warehouse_id', e.target.value)}
                                            disabled={!data.shop_enabled}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                        >
                                            <option value="">{t('shop.warehouseAll')}</option>
                                            {warehouses.map((warehouse) => (
                                                <option key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {t('shop.warehouseHint')}
                                        </p>
                                        {errors.shop_warehouse_id && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {errors.shop_warehouse_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notification Settings Card */}
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center">
                                        <BellIcon className="w-6 h-6 text-blue-600 mr-3" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {t('shop.notificationSettings')}
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    {!sms_configured && (
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-yellow-400"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                        {t('shop.smsNotConfigured')}{' '}
                                                        <a
                                                            href="/integrations/sms"
                                                            className="font-medium underline hover:text-yellow-900 dark:hover:text-yellow-100"
                                                        >
                                                            {t('shop.smsParameters')}
                                                        </a>{' '}
                                                        {t('shop.smsParametersLink')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Merchant Notifications */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={data.shop_sms_merchant_notifications}
                                                onChange={(e) =>
                                                    setData(
                                                        'shop_sms_merchant_notifications',
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={!data.shop_enabled || !sms_configured}
                                            />
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('shop.merchantNotifications')}
                                            </label>
                                        </div>

                                        {data.shop_sms_merchant_notifications && (
                                            <div className="ml-7">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <DevicePhoneMobileIcon className="w-4 h-4 inline mr-1" />
                                                    {t('shop.notificationPhoneText')}
                                                </label>
                                                <TextInput
                                                    value={data.shop_notification_phone}
                                                    onChange={(e) =>
                                                        setData('shop_notification_phone', e.target.value)
                                                    }
                                                    placeholder="+994501234567"
                                                    disabled={!data.shop_enabled || !sms_configured}
                                                    className="mt-1 block w-full"
                                                />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {t('shop.notificationPhoneHintShort')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Customer Notifications */}
                                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={data.shop_sms_customer_notifications}
                                                onChange={(e) =>
                                                    setData(
                                                        'shop_sms_customer_notifications',
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={!data.shop_enabled || !sms_configured}
                                            />
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('shop.customerNotificationsAlt')}
                                            </label>
                                        </div>

                                        {data.shop_sms_customer_notifications && (
                                            <div className="ml-7">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t('shop.smsTemplate')}
                                                </label>
                                                <textarea
                                                    value={data.shop_customer_sms_template}
                                                    onChange={(e) =>
                                                        setData('shop_customer_sms_template', e.target.value)
                                                    }
                                                    rows={3}
                                                    disabled={!data.shop_enabled || !sms_configured}
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                                    placeholder="Sizin sifarişiniz qəbul edildi. Sifariş nömrəsi: {order_number}"
                                                />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {t('shop.templateVariablesYouCanUse')}: {'{order_number}'},{' '}
                                                    {'{customer_name}'}, {'{total}'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex items-center justify-end gap-4 pt-4">
                                {recentlySuccessful && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        {t('shop.saved')}
                                    </p>
                                )}
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? t('actions.saving') : t('actions.saveChanges')}
                                </PrimaryButton>
                            </div>
                        </form>
                    )}

                    {/* Wolt Tab */}
                    {activeTab === 'wolt' && (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-center py-12">
                                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Wolt Settings
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Wolt platform settings will be available here soon.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Yango Tab */}
                    {activeTab === 'yango' && (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-center py-12">
                                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Yango Settings
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Yango platform settings will be available here soon.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Bolt Tab */}
                    {activeTab === 'bolt' && (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-center py-12">
                                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Bolt Food Settings
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Bolt Food platform settings will be available here soon.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
