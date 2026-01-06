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
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowTopRightOnSquareIcon,
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
            enabled: true
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

            <div className="min-h-screen bg-gray-50/50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header Section */}
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Online Mağaza & Çatdırılma
                        </h1>
                        <p className="mt-2 text-base text-gray-600">
                            Online mağaza və çatdırılma platformalarını konfiqurasiya edin
                        </p>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 mb-8">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            {availableTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                            ${isActive
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }
                                        `}
                                    >
                                        {tab.label}
                                        {isActive && (
                                            <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-medium text-emerald-700">Aktiv</span>
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'ecommerce' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* SMS Warning Banner */}
                            {!sms_configured && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                    <div className="flex gap-3">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-amber-900 mb-1">
                                                SMS xidməti konfiqurasiya edilməyib
                                            </h3>
                                            <p className="text-sm text-amber-800">
                                                Online mağaza funksiyasını aktivləşdirmək üçün əvvəlcə{' '}
                                                <a
                                                    href="/integrations/sms"
                                                    className="font-semibold underline hover:text-amber-900"
                                                >
                                                    SMS parametrlərini
                                                </a>{' '}
                                                quraşdırmalısınız.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Shop Status Card */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <ShoppingBagIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Mağaza Statusu
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Online mağazanızı aktivləşdirin və ya deaktiv edin
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={data.shop_enabled}
                                            onChange={(e) => setData('shop_enabled', e.target.checked)}
                                            disabled={!sms_configured}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-gray-900 block mb-1">
                                                Online mağazanı aktivləşdir
                                            </label>
                                            <p className="text-sm text-gray-600">
                                                Müştərilər məhsullarınızı onlayn görə və sifariş verə biləcək
                                            </p>
                                        </div>
                                    </div>

                                    {errors.shop_enabled && (
                                        <p className="mt-3 text-sm text-red-600">{errors.shop_enabled}</p>
                                    )}

                                    {data.shop_enabled && (
                                        <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                                                <p className="text-sm font-medium text-emerald-900">
                                                    Online mağaza aktivdir və işləyir
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shop Configuration Card */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Mağaza Konfigurasiyası
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Mağaza URL və anbar parametrləri
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Shop Slug */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            Mağaza Slug (URL)
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
                                            className="w-full"
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            Yalnız kiçik hərflər, rəqəmlər və tire işarəsi istifadə edin
                                        </p>
                                        {errors.shop_slug && (
                                            <p className="mt-2 text-sm text-red-600">{errors.shop_slug}</p>
                                        )}

                                        {/* Shop URL Display */}
                                        {data.shop_slug && data.shop_enabled && shop_settings.shop_url && (
                                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-blue-700 mb-1">
                                                            Mağaza URL
                                                        </p>
                                                        <a
                                                            href={shop_settings.shop_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-800 font-mono truncate block"
                                                        >
                                                            {shop_settings.shop_url}
                                                        </a>
                                                    </div>
                                                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Warehouse Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            <BuildingStorefrontIcon className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                                            Anbar seçimi
                                        </label>
                                        <select
                                            value={data.shop_warehouse_id}
                                            onChange={(e) => setData('shop_warehouse_id', e.target.value)}
                                            disabled={!data.shop_enabled}
                                            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="">Bütün anbarlar</option>
                                            {warehouses.map((warehouse) => (
                                                <option key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            Online mağazada göstəriləcək məhsulların anbarı
                                        </p>
                                        {errors.shop_warehouse_id && (
                                            <p className="mt-2 text-sm text-red-600">{errors.shop_warehouse_id}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notification Settings Card */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <BellIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Bildiriş Parametrləri
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                SMS bildirişləri və şablonlar
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {!sms_configured && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex gap-3">
                                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-amber-900">
                                                        SMS bildirişləri üçün{' '}
                                                        <a
                                                            href="/integrations/sms"
                                                            className="font-semibold underline hover:text-amber-950"
                                                        >
                                                            SMS parametrlərini
                                                        </a>{' '}
                                                        quraşdırın
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Merchant Notifications */}
                                    <div>
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                            <Checkbox
                                                checked={data.shop_sms_merchant_notifications}
                                                onChange={(e) =>
                                                    setData('shop_sms_merchant_notifications', e.target.checked)
                                                }
                                                disabled={!data.shop_enabled || !sms_configured}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <label className="text-sm font-medium text-gray-900 block mb-1">
                                                    Satıcı bildirişləri
                                                </label>
                                                <p className="text-xs text-gray-600">
                                                    Yeni sifariş daxil olduqda SMS bildirişi alın
                                                </p>
                                            </div>
                                        </div>

                                        {data.shop_sms_merchant_notifications && (
                                            <div className="mt-4 ml-11">
                                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                                    <DevicePhoneMobileIcon className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                                                    Bildiriş telefon nömrəsi
                                                </label>
                                                <TextInput
                                                    value={data.shop_notification_phone}
                                                    onChange={(e) =>
                                                        setData('shop_notification_phone', e.target.value)
                                                    }
                                                    placeholder="+994501234567"
                                                    disabled={!data.shop_enabled || !sms_configured}
                                                    className="w-full"
                                                />
                                                <p className="mt-1.5 text-xs text-gray-500">
                                                    Beynəlxalq formatda daxil edin (+994...)
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Customer Notifications */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                            <Checkbox
                                                checked={data.shop_sms_customer_notifications}
                                                onChange={(e) =>
                                                    setData('shop_sms_customer_notifications', e.target.checked)
                                                }
                                                disabled={!data.shop_enabled || !sms_configured}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <label className="text-sm font-medium text-gray-900 block mb-1">
                                                    Müştəri bildirişləri
                                                </label>
                                                <p className="text-xs text-gray-600">
                                                    Sifariş təsdiqləndikdə müştəriyə SMS göndərin
                                                </p>
                                            </div>
                                        </div>

                                        {data.shop_sms_customer_notifications && (
                                            <div className="mt-4 ml-11">
                                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                                    SMS şablonu
                                                </label>
                                                <textarea
                                                    value={data.shop_customer_sms_template}
                                                    onChange={(e) =>
                                                        setData('shop_customer_sms_template', e.target.value)
                                                    }
                                                    rows={4}
                                                    disabled={!data.shop_enabled || !sms_configured}
                                                    className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                    placeholder="Sizin sifarişiniz qəbul edildi. Sifariş nömrəsi: {order_number}"
                                                />
                                                <p className="mt-1.5 text-xs text-gray-500">
                                                    İstifadə edə biləcəyiniz dəyişənlər: <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{'{order_number}'}</code>,{' '}
                                                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{'{customer_name}'}</code>,{' '}
                                                    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{'{total}'}</code>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex items-center justify-between pt-4">
                                {recentlySuccessful && (
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <CheckCircleIcon className="w-5 h-5" />
                                        <span className="text-sm font-medium">Dəyişikliklər yadda saxlanıldı</span>
                                    </div>
                                )}
                                <div className="ml-auto">
                                    <PrimaryButton
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm"
                                    >
                                        {processing ? 'Yadda saxlanılır...' : 'Dəyişiklikləri saxla'}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Wolt Tab */}
                    {activeTab === 'wolt' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12">
                            <div className="text-center max-w-md mx-auto">
                                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <TruckIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Wolt Parametrləri
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Wolt platforması üçün parametrlər tezliklə əlavə ediləcək
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Yango Tab */}
                    {activeTab === 'yango' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12">
                            <div className="text-center max-w-md mx-auto">
                                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <TruckIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Yango Parametrləri
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Yango platforması üçün parametrlər tezliklə əlavə ediləcək
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Bolt Tab */}
                    {activeTab === 'bolt' && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12">
                            <div className="text-center max-w-md mx-auto">
                                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <TruckIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Bolt Food Parametrləri
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Bolt Food platforması üçün parametrlər tezliklə əlavə ediləcək
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
