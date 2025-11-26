import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    BellIcon,
    DevicePhoneMobileIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    Cog6ToothIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

interface Props {
    notification_settings: any;
    account_phone: string;
    sms_configured: boolean;
    telegram_configured: boolean;
    shopEnabled: boolean;
}

export default function NotificationSettingsSection({
    notification_settings,
    account_phone,
    sms_configured,
    telegram_configured,
    shopEnabled,
}: Props) {
    const form: any = useForm({
        notification_settings: notification_settings || {},
    });

    // Helper function to get merchant new order settings
    const getMerchantNewOrderSetting = (key: string, defaultValue: any = false): any => {
        const settings = form.data.notification_settings as any;
        if (!settings || !settings['merchant.new_order']) return defaultValue;
        const keys = key.split('.');
        let value: any = settings['merchant.new_order'];
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        return value !== undefined ? value : defaultValue;
    };

    // Helper function to get customer order confirmation settings
    const getCustomerOrderSetting = (key: string, defaultValue: any = false): any => {
        const settings = form.data.notification_settings as any;
        if (!settings || !settings['customer.order_confirmation']) return defaultValue;
        const keys = key.split('.');
        let value: any = settings['customer.order_confirmation'];
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        return value !== undefined ? value : defaultValue;
    };

    // Helper to update notification settings
    const updateNotificationSetting = (eventKey: string, path: string, value: any): void => {
        const settings: Record<string, any> = JSON.parse(
            JSON.stringify(form.data.notification_settings || {})
        );
        if (!settings[eventKey]) {
            settings[eventKey] = { enabled: false, channels: [], recipients: {} };
        }
        const keys = path.split('.');
        let current: any = settings[eventKey];
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        form.setData('notification_settings', settings);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('shop-settings.update-notifications'), {
            preserveScroll: true,
        });
    };

    if (!shopEnabled) {
        return null;
    }

    return (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <BellIcon className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Bildiriş Parametrləri (Ətraflı)
                            </h3>
                            <p className="text-sm text-gray-500">
                                Sifariş bildirişlərini ətraflı konfiqurasiya edin
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Configuration Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div
                        className={`rounded-lg p-4 border-2 ${
                            sms_configured
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <DevicePhoneMobileIcon
                                    className={`w-5 h-5 ${
                                        sms_configured ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                />
                                <div className="ml-3">
                                    <h4
                                        className={`text-sm font-semibold ${
                                            sms_configured ? 'text-green-900' : 'text-gray-700'
                                        }`}
                                    >
                                        SMS
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {sms_configured ? 'Konfiqurasiya edilib' : 'Quraşdırılmayıb'}
                                    </p>
                                </div>
                            </div>
                            {!sms_configured && (
                                <Link
                                    href="/integrations/sms"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                                >
                                    <Cog6ToothIcon className="w-3 h-3 mr-1" />
                                    Quraşdır
                                </Link>
                            )}
                        </div>
                    </div>

                    <div
                        className={`rounded-lg p-4 border-2 ${
                            telegram_configured
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <ChatBubbleLeftRightIcon
                                    className={`w-5 h-5 ${
                                        telegram_configured ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                />
                                <div className="ml-3">
                                    <h4
                                        className={`text-sm font-semibold ${
                                            telegram_configured ? 'text-green-900' : 'text-gray-700'
                                        }`}
                                    >
                                        Telegram
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {telegram_configured
                                            ? 'Konfiqurasiya edilib'
                                            : 'Quraşdırılmayıb'}
                                    </p>
                                </div>
                            </div>
                            {!telegram_configured && (
                                <Link
                                    href="/integrations/telegram"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                                >
                                    <Cog6ToothIcon className="w-3 h-3 mr-1" />
                                    Quraşdır
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Merchant Notifications */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center mb-4">
                            <BellIcon className="w-5 h-5 text-indigo-600 mr-2" />
                            <div>
                                <h4 className="text-base font-semibold text-gray-900">
                                    Yeni Sifariş Bildirişi
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Mağaza sahibinə göndəriləcək bildirişlər
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="merchant_new_order_enabled_shop"
                                    checked={getMerchantNewOrderSetting('enabled', false)}
                                    onChange={(e) =>
                                        updateNotificationSetting(
                                            'merchant.new_order',
                                            'enabled',
                                            e.target.checked
                                        )
                                    }
                                />
                                <label
                                    htmlFor="merchant_new_order_enabled_shop"
                                    className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                    Yeni sifariş bildirişlərini aktiv et
                                </label>
                            </div>

                            {getMerchantNewOrderSetting('enabled', false) && (
                                <div className="ml-6 space-y-4 mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                    <div className="text-sm font-medium text-gray-700 mb-3">
                                        Bildiriş Kanalları:
                                    </div>

                                    {/* SMS Channel */}
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <Checkbox
                                                id="merchant_sms_channel_shop"
                                                checked={(
                                                    getMerchantNewOrderSetting('channels', []) as string[]
                                                ).includes('sms')}
                                                onChange={(e) => {
                                                    const currentChannels = getMerchantNewOrderSetting(
                                                        'channels',
                                                        []
                                                    ) as string[];
                                                    const newChannels = e.target.checked
                                                        ? [
                                                              ...currentChannels.filter(
                                                                  (c) => c !== 'sms'
                                                              ),
                                                              'sms',
                                                          ]
                                                        : currentChannels.filter((c) => c !== 'sms');
                                                    updateNotificationSetting(
                                                        'merchant.new_order',
                                                        'channels',
                                                        newChannels
                                                    );
                                                }}
                                                disabled={!sms_configured}
                                            />
                                            <label
                                                htmlFor="merchant_sms_channel_shop"
                                                className="flex items-center ml-3 cursor-pointer"
                                            >
                                                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500 mr-2" />
                                                <span
                                                    className={`text-sm ${
                                                        sms_configured
                                                            ? 'text-gray-700'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    SMS
                                                    {!sms_configured && (
                                                        <span className="text-xs text-amber-600 ml-2">
                                                            (konfigurasiya edilməyib)
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        </div>
                                        {sms_configured &&
                                            (
                                                getMerchantNewOrderSetting('channels', []) as string[]
                                            ).includes('sms') && (
                                                <div className="ml-10">
                                                    <InputLabel htmlFor="sms_recipient_shop">
                                                        Telefon nömrəsi
                                                    </InputLabel>
                                                    <TextInput
                                                        id="sms_recipient_shop"
                                                        value={getMerchantNewOrderSetting(
                                                            'recipients.sms',
                                                            account_phone
                                                        )}
                                                        onChange={(e) =>
                                                            updateNotificationSetting(
                                                                'merchant.new_order',
                                                                'recipients.sms',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="+994501234567"
                                                        className="mt-1 block w-full"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Boş buraxsanız, hesab telefonunuz istifadə ediləcək
                                                    </p>
                                                </div>
                                            )}
                                    </div>

                                    {/* Telegram Channel */}
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <Checkbox
                                                id="merchant_telegram_channel_shop"
                                                checked={(
                                                    getMerchantNewOrderSetting('channels', []) as string[]
                                                ).includes('telegram')}
                                                onChange={(e) => {
                                                    const currentChannels = getMerchantNewOrderSetting(
                                                        'channels',
                                                        []
                                                    ) as string[];
                                                    const newChannels = e.target.checked
                                                        ? [
                                                              ...currentChannels.filter(
                                                                  (c) => c !== 'telegram'
                                                              ),
                                                              'telegram',
                                                          ]
                                                        : currentChannels.filter((c) => c !== 'telegram');
                                                    updateNotificationSetting(
                                                        'merchant.new_order',
                                                        'channels',
                                                        newChannels
                                                    );
                                                }}
                                                disabled={!telegram_configured}
                                            />
                                            <label
                                                htmlFor="merchant_telegram_channel_shop"
                                                className="flex items-center ml-3 cursor-pointer"
                                            >
                                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500 mr-2" />
                                                <span
                                                    className={`text-sm ${
                                                        telegram_configured
                                                            ? 'text-gray-700'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    Telegram
                                                    {!telegram_configured && (
                                                        <span className="text-xs text-amber-600 ml-2">
                                                            (konfigurasiya edilməyib)
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        </div>
                                        {telegram_configured &&
                                            (
                                                getMerchantNewOrderSetting('channels', []) as string[]
                                            ).includes('telegram') && (
                                                <div className="ml-10">
                                                    <InputLabel htmlFor="telegram_recipient_shop">
                                                        Chat ID
                                                    </InputLabel>
                                                    <TextInput
                                                        id="telegram_recipient_shop"
                                                        value={getMerchantNewOrderSetting(
                                                            'recipients.telegram',
                                                            ''
                                                        )}
                                                        onChange={(e) =>
                                                            updateNotificationSetting(
                                                                'merchant.new_order',
                                                                'recipients.telegram',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="123456789"
                                                        className="mt-1 block w-full"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Telegram bot konfiqurasiyasından default chat ID
                                                        istifadə ediləcək
                                                    </p>
                                                </div>
                                            )}
                                    </div>

                                    {!sms_configured && !telegram_configured && (
                                        <div className="flex items-start p-3 bg-amber-50 rounded-md">
                                            <InformationCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                                            <div className="text-sm text-amber-700">
                                                Heç bir kanal konfigurasiya edilməyib. Bildiriş göndərmək
                                                üçün SMS və ya Telegram xidmətlərindən ən azı birini
                                                quraşdırmalısınız.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Notifications */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center mb-4">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                            <div>
                                <h4 className="text-base font-semibold text-gray-900">
                                    Müştəri Təsdiq Bildirişi
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Müştəriyə göndəriləcək təsdiq mesajı
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Checkbox
                                    id="customer_order_enabled_shop"
                                    checked={getCustomerOrderSetting('enabled', false)}
                                    onChange={(e) =>
                                        updateNotificationSetting(
                                            'customer.order_confirmation',
                                            'enabled',
                                            e.target.checked
                                        )
                                    }
                                />
                                <label
                                    htmlFor="customer_order_enabled_shop"
                                    className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                    Müştəriyə təsdiq bildirişi göndər
                                </label>
                            </div>

                            {getCustomerOrderSetting('enabled', false) && (
                                <div className="ml-6 space-y-3 mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                    <div className="text-sm font-medium text-gray-700 mb-3">
                                        Bildiriş Kanalları:
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="customer_sms_channel_shop"
                                            checked={(
                                                getCustomerOrderSetting('channels', []) as string[]
                                            ).includes('sms')}
                                            onChange={(e) => {
                                                const currentChannels = getCustomerOrderSetting(
                                                    'channels',
                                                    []
                                                ) as string[];
                                                const newChannels = e.target.checked
                                                    ? [
                                                          ...currentChannels.filter((c) => c !== 'sms'),
                                                          'sms',
                                                      ]
                                                    : currentChannels.filter((c) => c !== 'sms');
                                                updateNotificationSetting(
                                                    'customer.order_confirmation',
                                                    'channels',
                                                    newChannels
                                                );
                                            }}
                                            disabled={!sms_configured}
                                        />
                                        <label
                                            htmlFor="customer_sms_channel_shop"
                                            className="flex items-center ml-3 cursor-pointer"
                                        >
                                            <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500 mr-2" />
                                            <span
                                                className={`text-sm ${
                                                    sms_configured ? 'text-gray-700' : 'text-gray-400'
                                                }`}
                                            >
                                                SMS (müştərinin telefon nömrəsinə göndəriləcək)
                                                {!sms_configured && (
                                                    <span className="block text-xs text-amber-600 mt-1">
                                                        SMS konfigurasiyası tələb olunur
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                        {form.recentlySuccessful && (
                            <p className="text-sm text-green-600">Bildiriş parametrləri yadda saxlanıldı</p>
                        )}
                        <PrimaryButton type="submit" disabled={form.processing}>
                            {form.processing ? 'Yadda saxlanılır...' : 'Bildiriş parametrlərini yadda saxla'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
