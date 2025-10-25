import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    ShoppingBagIcon,
    GlobeAltIcon,
    BellIcon,
    DevicePhoneMobileIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { AdminLayout, SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';

interface ShopSettings {
    shop_enabled: boolean;
    shop_slug: string | null;
    shop_url: string | null;
    shop_sms_merchant_notifications: boolean;
    shop_notification_phone: string | null;
    shop_sms_customer_notifications: boolean;
    shop_customer_sms_template: string | null;
    has_sms_configured: boolean;
    sms_balance: number | null;
}

interface Props {
    settings: ShopSettings;
}

interface FormData {
    shop_enabled: boolean;
    shop_slug: string;
    shop_sms_merchant_notifications: boolean;
    shop_notification_phone: string;
    shop_sms_customer_notifications: boolean;
    shop_customer_sms_template: string;
}

export default function ShopSettings({ settings }: Props) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm<FormData>({
        shop_enabled: settings.shop_enabled,
        shop_slug: settings.shop_slug || '',
        shop_sms_merchant_notifications: settings.shop_sms_merchant_notifications,
        shop_notification_phone: settings.shop_notification_phone || '',
        shop_sms_customer_notifications: settings.shop_sms_customer_notifications,
        shop_customer_sms_template: settings.shop_customer_sms_template || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('settings.shop.update'));
    };

    const defaultTemplate = `Hörmətli {customer_name}, sifarişiniz qəbul edildi!
Sifariş №: {order_number}
Məbləğ: {total} ₼
Əlaqə: {shop_phone}
{shop_name}`;

    return (
        <AdminLayout title="Mağaza Parametrləri">
            <Head title="Mağaza Parametrləri" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Mağaza Parametrləri
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Online mağazanızı idarə edin və parametrləri tənzimləyin
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Shop Settings */}
                        <SettingsSection
                            title="Əsas Parametrlər"
                            description="Online mağazanızın əsas parametrlərini konfiqurasiya edin"
                            icon={ShoppingBagIcon}
                        >
                            <FormGrid>
                                <div className="sm:col-span-6">
                                    <label className="flex items-center space-x-3">
                                        <Checkbox
                                            checked={data.shop_enabled}
                                            onChange={(e) => setData('shop_enabled', e.target.checked)}
                                        />
                                        <span className="text-sm font-medium text-gray-900">
                                            Online mağazanı aktiv et
                                        </span>
                                    </label>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Müştərilər online sifariş verə biləcək
                                    </p>
                                </div>

                                <FormField label="Biznes Adı (URL)" className="sm:col-span-6">
                                    <TextInput
                                        value={data.shop_slug}
                                        onChange={(e) => setData('shop_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        placeholder="menim-magazam"
                                        disabled={!data.shop_enabled}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.shop_slug} className="mt-2" />
                                    {data.shop_slug && data.shop_enabled && (
                                        <p className="mt-2 text-sm text-green-600">
                                            <GlobeAltIcon className="inline-block w-4 h-4 mr-1" />
                                            Mağaza URL: <strong>{window.location.origin}/shop/{data.shop_slug}</strong>
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Yalnız kiçik hərflər, rəqəmlər və tire istifadə edin (minimum 3 simvol)
                                    </p>
                                </FormField>
                            </FormGrid>
                        </SettingsSection>

                        {/* SMS Notifications */}
                        {settings.has_sms_configured ? (
                            <SettingsSection
                                title="SMS Bildirişləri"
                                description="Sifarişlər üzrə SMS bildirişlərini idarə edin"
                                icon={BellIcon}
                            >
                                <FormGrid>
                                    {settings.sms_balance !== null && (
                                        <div className="sm:col-span-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <CurrencyDollarIcon className="w-5 h-5 text-blue-600 mr-2" />
                                                <span className="text-sm font-medium text-blue-900">
                                                    SMS Balansınız: <strong>{settings.sms_balance}</strong> SMS
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="sm:col-span-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={data.shop_sms_merchant_notifications}
                                                onChange={(e) => setData('shop_sms_merchant_notifications', e.target.checked)}
                                                disabled={!data.shop_enabled}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                Mənə yeni sifarişlərdən SMS göndər
                                            </span>
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Hər yeni online sifariş haqqında SMS bildirişi alacaqsınız
                                        </p>
                                    </div>

                                    <FormField label="Bildiriş Telefonu (İstəyə bağlı)" className="sm:col-span-6">
                                        <TextInput
                                            value={data.shop_notification_phone}
                                            onChange={(e) => setData('shop_notification_phone', e.target.value)}
                                            placeholder="+994XXXXXXXXX"
                                            disabled={!data.shop_enabled || !data.shop_sms_merchant_notifications}
                                            className="mt-1 block w-full"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Boş buraxsanız, hesab telefonunuz istifadə ediləcək
                                        </p>
                                    </FormField>

                                    <div className="sm:col-span-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={data.shop_sms_customer_notifications}
                                                onChange={(e) => setData('shop_sms_customer_notifications', e.target.checked)}
                                                disabled={!data.shop_enabled}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                Müştərilərə təsdiq SMS-i göndər
                                            </span>
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Sifariş verdikdən sonra müştəriyə təsdiq SMS-i göndəriləcək
                                        </p>
                                    </div>

                                    <FormField label="Müştəri SMS Şablonu (İstəyə bağlı)" className="sm:col-span-6">
                                        <textarea
                                            value={data.shop_customer_sms_template}
                                            onChange={(e) => setData('shop_customer_sms_template', e.target.value)}
                                            rows={6}
                                            disabled={!data.shop_enabled || !data.shop_sms_customer_notifications}
                                            placeholder={defaultTemplate}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            <strong>Dəyişənlər:</strong> {'{customer_name}'}, {'{order_number}'}, {'{total}'}, {'{shop_name}'}, {'{shop_phone}'}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Boş buraxsanız, standart şablon istifadə ediləcək
                                        </p>
                                    </FormField>
                                </FormGrid>
                            </SettingsSection>
                        ) : (
                            <SettingsSection
                                title="SMS Bildirişləri"
                                description="SMS bildirişləri üçün SMS parametrlərini konfiqurasiya edin"
                                icon={BellIcon}
                            >
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <div className="flex">
                                        <DevicePhoneMobileIcon className="w-5 h-5 text-yellow-600 mr-2" />
                                        <div>
                                            <h3 className="text-sm font-medium text-yellow-900">
                                                SMS parametrləri konfiqurasiya edilməyib
                                            </h3>
                                            <p className="mt-1 text-sm text-yellow-700">
                                                SMS bildirişlərindən istifadə etmək üçün əvvəlcə SMS parametrlərini konfiqurasiya edin.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </SettingsSection>
                        )}

                        {/* Action Buttons */}
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
                </div>
            </div>
        </AdminLayout>
    );
}
