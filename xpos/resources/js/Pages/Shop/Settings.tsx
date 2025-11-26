import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ShoppingBagIcon,
    GlobeAltIcon,
    BuildingStorefrontIcon,
    BellIcon,
    DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';
import { PageProps } from '@/types';

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
}

export default function ShopSettings({
    auth,
    shop_settings,
    warehouses,
    sms_configured,
}: ShopSettingsProps) {
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center">
                    <ShoppingBagIcon className="w-8 h-8 mr-3 text-blue-600" />
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Online Mağaza
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Online mağazanızı konfiqurasiya edin və idarə edin
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Online Mağaza" />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Shop Status Card */}
                        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center">
                                    <ShoppingBagIcon className="w-6 h-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Mağaza Statusu
                                    </h3>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        checked={data.shop_enabled}
                                        onChange={(e) => setData('shop_enabled', e.target.checked)}
                                    />
                                    <label className="text-sm font-medium text-gray-700">
                                        Online mağazanı aktiv et
                                    </label>
                                </div>

                                {data.shop_enabled && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
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
                                                <p className="text-sm text-green-800">
                                                    Mağaza aktiv və işlək vəziyyətdədir
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shop Configuration Card */}
                        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center">
                                    <GlobeAltIcon className="w-6 h-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Mağaza Konfiqurasiyası
                                    </h3>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Shop Slug */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mağaza URL (slug)
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
                                        <p className="mt-1 text-sm text-red-600">{errors.shop_slug}</p>
                                    )}
                                    {data.shop_slug && data.shop_enabled && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <div className="flex items-center">
                                                <GlobeAltIcon className="w-5 h-5 text-blue-600 mr-2" />
                                                <div>
                                                    <p className="text-sm text-blue-800 font-medium">
                                                        Mağaza URL:
                                                    </p>
                                                    <a
                                                        href={`${window.location.origin}/shop/${data.shop_slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <BuildingStorefrontIcon className="w-5 h-5 inline mr-1" />
                                        Anbar / Filial
                                    </label>
                                    <select
                                        value={data.shop_warehouse_id}
                                        onChange={(e) => setData('shop_warehouse_id', e.target.value)}
                                        disabled={!data.shop_enabled}
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    >
                                        <option value="">Bütün anbarlar</option>
                                        {warehouses.map((warehouse) => (
                                            <option key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Seçilmiş anbardan məhsullar online mağazada göstəriləcək. Boş
                                        buraxdıqda bütün anbarlardan məhsullar göstərilir.
                                    </p>
                                    {errors.shop_warehouse_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.shop_warehouse_id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notification Settings Card */}
                        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center">
                                    <BellIcon className="w-6 h-6 text-blue-600 mr-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Bildiriş Parametrləri
                                    </h3>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {!sms_configured && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                                                <p className="text-sm text-yellow-800">
                                                    SMS xidməti konfiqurasiya edilməyib. Bildirişlər göndərmək
                                                    üçün əvvəlcə{' '}
                                                    <a
                                                        href="/integrations/sms"
                                                        className="font-medium underline hover:text-yellow-900"
                                                    >
                                                        SMS parametrlərini
                                                    </a>{' '}
                                                    quraşdırın.
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
                                        <label className="text-sm font-medium text-gray-700">
                                            Yeni sifariş bildirişləri (Satıcı)
                                        </label>
                                    </div>

                                    {data.shop_sms_merchant_notifications && (
                                        <div className="ml-7">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <DevicePhoneMobileIcon className="w-4 h-4 inline mr-1" />
                                                Bildiriş telefonu
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
                                            <p className="mt-1 text-xs text-gray-500">
                                                Yeni sifariş haqqında SMS bu nömrəyə göndəriləcək
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Customer Notifications */}
                                <div className="space-y-4 pt-4 border-t border-gray-200">
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
                                        <label className="text-sm font-medium text-gray-700">
                                            Sifariş təsdiq bildirişləri (Müştəri)
                                        </label>
                                    </div>

                                    {data.shop_sms_customer_notifications && (
                                        <div className="ml-7">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                SMS Şablon
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
                                            <p className="mt-1 text-xs text-gray-500">
                                                İstifadə edə biləcəyiniz dəyişənlər: {'{order_number}'},{' '}
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
                                    Parametrlər yadda saxlanıldı
                                </p>
                            )}
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
