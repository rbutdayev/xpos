import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
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

interface SmsCredential {
    id: number;
    login: string;
    sender_name: string;
    is_active: boolean;
}

interface TelegramCredential {
    id: number;
    bot_username: string | null;
    default_chat_id: string | null;
    is_active: boolean;
    last_tested_at: string | null;
    last_test_status: string | null;
}

interface Stats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
}

interface Props extends PageProps {
    sms: {
        configured: boolean;
        credential: SmsCredential | null;
        stats: Stats;
    };
    telegram: {
        configured: boolean;
        credential: TelegramCredential | null;
        stats: Stats;
    };
    notification_settings: any;
    account_phone: string;
}

export default function Index({ auth, sms, telegram, notification_settings, account_phone }: Props) {
    // Merchant new order settings
    const merchantSettings = notification_settings?.['merchant.new_order'] || {};
    const [merchantEnabled, setMerchantEnabled] = useState(merchantSettings.enabled || false);
    const [merchantSmsEnabled, setMerchantSmsEnabled] = useState(
        (merchantSettings.channels || []).includes('sms')
    );
    const [merchantTelegramEnabled, setMerchantTelegramEnabled] = useState(
        (merchantSettings.channels || []).includes('telegram')
    );
    const [merchantSmsPhone, setMerchantSmsPhone] = useState(
        merchantSettings.recipients?.sms || account_phone || ''
    );
    const [merchantTelegramChatId, setMerchantTelegramChatId] = useState(
        merchantSettings.recipients?.telegram || telegram.credential?.default_chat_id || ''
    );

    // Customer order confirmation settings
    const customerSettings = notification_settings?.['customer.order_confirmation'] || {};
    const [customerEnabled, setCustomerEnabled] = useState(customerSettings.enabled || false);
    const [customerSmsEnabled, setCustomerSmsEnabled] = useState(
        (customerSettings.channels || []).includes('sms')
    );

    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Build merchant channels array
        const merchantChannels = [];
        if (merchantSmsEnabled) merchantChannels.push('sms');
        if (merchantTelegramEnabled) merchantChannels.push('telegram');

        // Build customer channels array
        const customerChannels = [];
        if (customerSmsEnabled) customerChannels.push('sms');

        // Build notification settings object
        const settings = {
            'merchant.new_order': {
                enabled: merchantEnabled,
                channels: merchantChannels,
                recipients: {
                    sms: merchantSmsPhone,
                    telegram: merchantTelegramChatId,
                },
            },
            'customer.order_confirmation': {
                enabled: customerEnabled,
                channels: customerChannels,
            },
        };

        // Use Inertia router to submit and reload
        router.post(
            route('settings.notifications.update'),
            { notification_settings: settings },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRecentlySuccessful(true);
                    setTimeout(() => setRecentlySuccessful(false), 2000);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout
        >
            <Head title="Bildiriş Kanalları" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                    {/* Configuration Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* SMS Status */}
                        <div
                            className={`rounded-lg p-4 border-2 ${
                                sms.configured ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center">
                                    <DevicePhoneMobileIcon
                                        className={`w-6 h-6 ${sms.configured ? 'text-green-600' : 'text-gray-400'}`}
                                    />
                                    <div className="ml-3">
                                        <h3
                                            className={`text-sm font-semibold ${
                                                sms.configured ? 'text-green-900' : 'text-gray-700'
                                            }`}
                                        >
                                            SMS Xidməti
                                        </h3>
                                        {sms.configured ? (
                                            <p className="text-xs text-green-700 mt-1">
                                                Göndərilən: {sms.stats.sent}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500 mt-1">Konfigurasiya edilməyib</p>
                                        )}
                                    </div>
                                </div>
                                {!sms.configured && (
                                    <Link
                                        href="/integrations/sms"
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                                    >
                                        <Cog6ToothIcon className="w-4 h-4 mr-1" />
                                        Quraşdır
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Telegram Status */}
                        <div
                            className={`rounded-lg p-4 border-2 ${
                                telegram.configured ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center">
                                    <ChatBubbleLeftRightIcon
                                        className={`w-6 h-6 ${telegram.configured ? 'text-green-600' : 'text-gray-400'}`}
                                    />
                                    <div className="ml-3">
                                        <h3
                                            className={`text-sm font-semibold ${
                                                telegram.configured ? 'text-green-900' : 'text-gray-700'
                                            }`}
                                        >
                                            Telegram
                                        </h3>
                                        {telegram.configured ? (
                                            <p className="text-xs text-green-700 mt-1">
                                                Göndərilən: {telegram.stats.sent}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500 mt-1">Konfigurasiya edilməyib</p>
                                        )}
                                    </div>
                                </div>
                                {!telegram.configured && (
                                    <Link
                                        href="/integrations/telegram"
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                                    >
                                        <Cog6ToothIcon className="w-4 h-4 mr-1" />
                                        Quraşdır
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                            {/* Merchant Notifications */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center mb-4">
                                    <BellIcon className="w-6 h-6 text-indigo-600 mr-3" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Yeni Sifariş Bildirişi
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Mağaza sahibinə göndəriləcək bildirişlər
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="merchant_enabled"
                                            checked={merchantEnabled}
                                            onChange={(e) => setMerchantEnabled(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500"
                                        />
                                        <label htmlFor="merchant_enabled" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                                            Yeni sifariş bildirişlərini aktiv et
                                        </label>
                                    </div>

                                    {merchantEnabled && (
                                        <div className="ml-6 space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="text-sm font-medium text-gray-700 mb-3">
                                                Bildiriş Kanalları:
                                            </div>

                                            {/* SMS Channel */}
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="merchant_sms"
                                                        checked={merchantSmsEnabled}
                                                        onChange={(e) => setMerchantSmsEnabled(e.target.checked)}
                                                        disabled={!sms.configured}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500 disabled:opacity-50"
                                                    />
                                                    <label
                                                        htmlFor="merchant_sms"
                                                        className="ml-3 flex items-center cursor-pointer"
                                                    >
                                                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500 mr-2" />
                                                        <span className={`text-sm ${sms.configured ? 'text-gray-700' : 'text-gray-400'}`}>
                                                            SMS
                                                            {!sms.configured && (
                                                                <span className="text-xs text-amber-600 ml-2">
                                                                    (konfigurasiya edilməyib)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </label>
                                                </div>
                                                {sms.configured && merchantSmsEnabled && (
                                                    <div className="ml-10 mt-2">
                                                        <InputLabel htmlFor="merchant_sms_phone">
                                                            Telefon nömrəsi
                                                        </InputLabel>
                                                        <TextInput
                                                            id="merchant_sms_phone"
                                                            value={merchantSmsPhone}
                                                            onChange={(e) => setMerchantSmsPhone(e.target.value)}
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
                                                    <input
                                                        type="checkbox"
                                                        id="merchant_telegram"
                                                        checked={merchantTelegramEnabled}
                                                        onChange={(e) => setMerchantTelegramEnabled(e.target.checked)}
                                                        disabled={!telegram.configured}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500 disabled:opacity-50"
                                                    />
                                                    <label
                                                        htmlFor="merchant_telegram"
                                                        className="ml-3 flex items-center cursor-pointer"
                                                    >
                                                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500 mr-2" />
                                                        <span className={`text-sm ${telegram.configured ? 'text-gray-700' : 'text-gray-400'}`}>
                                                            Telegram
                                                            {!telegram.configured && (
                                                                <span className="text-xs text-amber-600 ml-2">
                                                                    (konfigurasiya edilməyib)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </label>
                                                </div>
                                                {telegram.configured && merchantTelegramEnabled && (
                                                    <div className="ml-10 mt-2">
                                                        <InputLabel htmlFor="merchant_telegram_chat">
                                                            Chat ID
                                                        </InputLabel>
                                                        <TextInput
                                                            id="merchant_telegram_chat"
                                                            value={merchantTelegramChatId}
                                                            onChange={(e) => setMerchantTelegramChatId(e.target.value)}
                                                            placeholder={telegram.credential?.default_chat_id || '123456789'}
                                                            className="mt-1 block w-full"
                                                        />
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Boş buraxsanız, default chat ID istifadə ediləcək
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {!sms.configured && !telegram.configured && (
                                                <div className="flex items-start p-3 bg-amber-50 rounded-md">
                                                    <InformationCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                                                    <div className="text-sm text-amber-700">
                                                        Heç bir kanal konfigurasiya edilməyib. Bildiriş göndərmək üçün
                                                        SMS və ya Telegram xidmətlərindən ən azı birini quraşdırmalısınız.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Notifications */}
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Müştəri Təsdiq Bildirişi
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Müştəriyə göndəriləcək təsdiq mesajı
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="customer_enabled"
                                            checked={customerEnabled}
                                            onChange={(e) => setCustomerEnabled(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500"
                                        />
                                        <label htmlFor="customer_enabled" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                                            Müştəriyə təsdiq bildirişi göndər
                                        </label>
                                    </div>

                                    {customerEnabled && (
                                        <div className="ml-6 space-y-3 mt-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="text-sm font-medium text-gray-700 mb-3">
                                                Bildiriş Kanalları:
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="customer_sms"
                                                    checked={customerSmsEnabled}
                                                    onChange={(e) => setCustomerSmsEnabled(e.target.checked)}
                                                    disabled={!sms.configured}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-slate-500 disabled:opacity-50"
                                                />
                                                <label
                                                    htmlFor="customer_sms"
                                                    className="ml-3 flex items-center cursor-pointer"
                                                >
                                                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500 mr-2" />
                                                    <span className={`text-sm ${sms.configured ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        SMS (müştərinin telefon nömrəsinə göndəriləcək)
                                                        {!sms.configured && (
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
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-4">
                                {recentlySuccessful && (
                                    <p className="text-sm text-green-600">Parametrlər yadda saxlanıldı</p>
                                )}
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>
        </AuthenticatedLayout>
    );
}
