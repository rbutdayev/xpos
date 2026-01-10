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
import { useTranslation } from 'react-i18next';

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
    shop_slug: string;
    shop_sms_merchant_notifications: boolean;
    shop_notification_phone: string;
    shop_sms_customer_notifications: boolean;
    shop_customer_sms_template: string;
}

export default function ShopSettings({ settings }: Props) {
    const { t } = useTranslation('settings');
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm<FormData>({
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
        <AdminLayout title={t('shop.title')}>
            <Head title={t('shop.title')} />

            <div className="py-6 px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('shop.title')}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {t('shop.description')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Shop Settings */}
                        <SettingsSection
                            title={t('shop.basicSettings')}
                            description={t('shop.basicDescription')}
                            icon={ShoppingBagIcon}
                        >
                            <FormGrid>
                                <FormField label={t('shop.businessName')} className="sm:col-span-6">
                                    <TextInput
                                        value={data.shop_slug}
                                        onChange={(e) => setData('shop_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        placeholder="menim-magazam"
                                        disabled={!settings.shop_enabled}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.shop_slug} className="mt-2" />
                                    {data.shop_slug && settings.shop_enabled && (
                                        <p className="mt-2 text-sm text-green-600">
                                            <GlobeAltIcon className="inline-block w-4 h-4 mr-1" />
                                            {t('shop.shopUrl')}: <strong>{window.location.origin}/shop/{data.shop_slug}</strong>
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t('shop.businessNameHint')}
                                    </p>
                                </FormField>
                            </FormGrid>
                        </SettingsSection>

                        {/* SMS Notifications */}
                        {settings.has_sms_configured ? (
                            <SettingsSection
                                title={t('shop.smsNotifications')}
                                description={t('shop.smsDescription')}
                                icon={BellIcon}
                            >
                                <FormGrid>
                                    {settings.sms_balance !== null && (
                                        <div className="sm:col-span-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <CurrencyDollarIcon className="w-5 h-5 text-blue-600 mr-2" />
                                                <span className="text-sm font-medium text-blue-900">
                                                    {t('shop.smsBalance')}: <strong>{settings.sms_balance}</strong> {t('shop.sms')}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="sm:col-span-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={data.shop_sms_merchant_notifications}
                                                onChange={(e) => setData('shop_sms_merchant_notifications', e.target.checked)}
                                                disabled={!settings.shop_enabled}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                {t('shop.merchantNotifications')}
                                            </span>
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('shop.merchantNotificationsHint')}
                                        </p>
                                    </div>

                                    <FormField label={t('shop.notificationPhone')} className="sm:col-span-6">
                                        <TextInput
                                            value={data.shop_notification_phone}
                                            onChange={(e) => setData('shop_notification_phone', e.target.value)}
                                            placeholder="+994XXXXXXXXX"
                                            disabled={!settings.shop_enabled || !data.shop_sms_merchant_notifications}
                                            className="mt-1 block w-full"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('shop.notificationPhoneHint')}
                                        </p>
                                    </FormField>

                                    <div className="sm:col-span-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={data.shop_sms_customer_notifications}
                                                onChange={(e) => setData('shop_sms_customer_notifications', e.target.checked)}
                                                disabled={!settings.shop_enabled}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                {t('shop.customerNotifications')}
                                            </span>
                                        </label>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('shop.customerNotificationsHint')}
                                        </p>
                                    </div>

                                    <FormField label={t('shop.customerTemplate')} className="sm:col-span-6">
                                        <textarea
                                            value={data.shop_customer_sms_template}
                                            onChange={(e) => setData('shop_customer_sms_template', e.target.value)}
                                            rows={6}
                                            disabled={!settings.shop_enabled || !data.shop_sms_customer_notifications}
                                            placeholder={defaultTemplate}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">
                                            <strong>{t('shop.templateVariables')}:</strong> {'{customer_name}'}, {'{order_number}'}, {'{total}'}, {'{shop_name}'}, {'{shop_phone}'}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('shop.customerTemplateHint')}
                                        </p>
                                    </FormField>
                                </FormGrid>
                            </SettingsSection>
                        ) : (
                            <SettingsSection
                                title={t('shop.smsNotifications')}
                                description={t('shop.smsDescription')}
                                icon={BellIcon}
                            >
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <div className="flex">
                                        <DevicePhoneMobileIcon className="w-5 h-5 text-yellow-600 mr-2" />
                                        <div>
                                            <h3 className="text-sm font-medium text-yellow-900">
                                                {t('shop.notConfiguredTitle')}
                                            </h3>
                                            <p className="mt-1 text-sm text-yellow-700">
                                                {t('shop.notConfiguredDescription')}
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
                                    {t('actions.saved')}
                                </p>
                            )}
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? t('actions.saving') : t('actions.saveChanges')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
        </AdminLayout>
    );
}
