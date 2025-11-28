import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    BellIcon,
    DevicePhoneMobileIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { AdminLayout, SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';

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

interface Props {
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

export default function NotificationSettings({ sms, telegram, notification_settings, account_phone }: Props) {
    const [activeTab, setActiveTab] = useState<'channels' | 'sms' | 'telegram'>('channels');

    // Notification settings form
    const notificationForm = useForm({
        notification_settings: notification_settings || {
            merchant: {
                new_order: {
                    enabled: false,
                    channels: [],
                    recipients: {},
                    templates: {},
                },
            },
            customer: {
                order_confirmation: {
                    enabled: false,
                    channels: [],
                    templates: {},
                },
            },
        },
    });

    // SMS credentials form
    const smsForm = useForm({
        login: sms.credential?.login || '',
        password: '',
        sender_name: sms.credential?.sender_name || '',
        gateway_url: 'https://api.lsim.az/sendsms.php',
        is_active: sms.credential?.is_active ?? true,
    });

    // Telegram credentials form
    const telegramForm = useForm({
        bot_token: '',
        bot_username: telegram.credential?.bot_username || '',
        default_chat_id: telegram.credential?.default_chat_id || '',
        is_active: telegram.credential?.is_active ?? true,
    });

    const handleNotificationSubmit = (e: FormEvent) => {
        e.preventDefault();
        notificationForm.patch(route('settings.notifications.update'));
    };

    const handleSmsSubmit = (e: FormEvent) => {
        e.preventDefault();
        smsForm.post(route('settings.notifications.sms.update'));
    };

    const handleTelegramSubmit = (e: FormEvent) => {
        e.preventDefault();
        telegramForm.post(route('settings.notifications.telegram.update'));
    };

    const handleTestTelegram = () => {
        telegramForm.post(route('settings.notifications.telegram.test'), {
            preserveScroll: true,
        });
    };

    const toggleChannel = (event: 'merchant.new_order' | 'customer.order_confirmation', channel: 'sms' | 'telegram') => {
        const [section, eventName] = event.split('.');
        const currentSettings: any = JSON.parse(JSON.stringify(notificationForm.data.notification_settings));

        if (!currentSettings[section]) currentSettings[section] = {};
        if (!currentSettings[section][eventName]) {
            currentSettings[section][eventName] = { enabled: false, channels: [], recipients: {}, templates: {} };
        }

        const channels = currentSettings[section][eventName].channels || [];
        if (channels.includes(channel)) {
            currentSettings[section][eventName].channels = channels.filter((c: string) => c !== channel);
        } else {
            currentSettings[section][eventName].channels = [...channels, channel];
        }

        (notificationForm.setData as any)('notification_settings', currentSettings);
    };

    const toggleNotificationEnabled = (event: 'merchant.new_order' | 'customer.order_confirmation') => {
        const [section, eventName] = event.split('.');
        const currentSettings: any = JSON.parse(JSON.stringify(notificationForm.data.notification_settings));

        if (!currentSettings[section]) currentSettings[section] = {};
        if (!currentSettings[section][eventName]) {
            currentSettings[section][eventName] = { enabled: false, channels: [], recipients: {}, templates: {} };
        }

        currentSettings[section][eventName].enabled = !currentSettings[section][eventName].enabled;

        (notificationForm.setData as any)('notification_settings', currentSettings);
    };

    const updateRecipient = (event: 'merchant.new_order' | 'customer.order_confirmation', channel: 'sms' | 'telegram', value: string) => {
        const [section, eventName] = event.split('.');
        const currentSettings: any = JSON.parse(JSON.stringify(notificationForm.data.notification_settings));

        if (!currentSettings[section]) currentSettings[section] = {};
        if (!currentSettings[section][eventName]) {
            currentSettings[section][eventName] = { enabled: false, channels: [], recipients: {}, templates: {} };
        }
        if (!currentSettings[section][eventName].recipients) {
            currentSettings[section][eventName].recipients = {};
        }

        currentSettings[section][eventName].recipients[channel] = value;

        (notificationForm.setData as any)('notification_settings', currentSettings);
    };

    const merchantSettings = notificationForm.data.notification_settings.merchant?.new_order || { enabled: false, channels: [], recipients: {} };
    const customerSettings = notificationForm.data.notification_settings.customer?.order_confirmation || { enabled: false, channels: [], recipients: {} };

    return (
        <AdminLayout title="Bildirişlər">
            <Head title="Bildirişlər" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Bildirişlər
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            SMS və Telegram bildirişlərini idarə edin
                        </p>
                    </div>

                    {/* Tabs - Enterprise Style */}
                    <div className="mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
                            <nav className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setActiveTab('channels')}
                                    className={`
                                        relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                        font-medium text-sm transition-all duration-200 ease-in-out
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                                        ${activeTab === 'channels'
                                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 transform scale-[1.02]'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-600'
                                        }
                                    `}
                                >
                                    <BellIcon className={`w-5 h-5 ${activeTab === 'channels' ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="font-semibold">Bildiriş Kanalları</span>
                                    {activeTab === 'channels' && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('sms')}
                                    className={`
                                        relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                        font-medium text-sm transition-all duration-200 ease-in-out
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                                        ${activeTab === 'sms'
                                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 transform scale-[1.02]'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-600'
                                        }
                                    `}
                                >
                                    <DevicePhoneMobileIcon className={`w-5 h-5 ${activeTab === 'sms' ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="font-semibold">SMS Parametrləri</span>
                                    {activeTab === 'sms' && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('telegram')}
                                    className={`
                                        relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                        font-medium text-sm transition-all duration-200 ease-in-out
                                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                                        ${activeTab === 'telegram'
                                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 transform scale-[1.02]'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-600'
                                        }
                                    `}
                                >
                                    <ChatBubbleLeftRightIcon className={`w-5 h-5 ${activeTab === 'telegram' ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="font-semibold">Telegram Parametrləri</span>
                                    {activeTab === 'telegram' && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Notification Channels Tab */}
                    {activeTab === 'channels' && (
                        <form onSubmit={handleNotificationSubmit} className="space-y-6">
                            {/* Merchant Notifications */}
                            <SettingsSection
                                title="Tacir Bildirişləri"
                                description="Yeni sifariş daxil olduqda sizə göndəriləcək bildirişlər"
                                icon={BellIcon}
                            >
                                <FormGrid>
                                    <div className="sm:col-span-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={merchantSettings.enabled}
                                                onChange={() => toggleNotificationEnabled('merchant.new_order')}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                Yeni sifariş bildirişlərini aktiv et
                                            </span>
                                        </label>
                                    </div>

                                    {merchantSettings.enabled && (
                                        <>
                                            <div className="sm:col-span-6">
                                                <InputLabel value="Bildiriş Kanalları" />
                                                <div className="mt-2 space-y-2">
                                                    {sms.configured && (
                                                        <label className="flex items-center space-x-3">
                                                            <Checkbox
                                                                checked={merchantSettings.channels?.includes('sms')}
                                                                onChange={() => toggleChannel('merchant.new_order', 'sms')}
                                                            />
                                                            <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500" />
                                                            <span className="text-sm text-gray-900">SMS</span>
                                                            <span className="text-xs text-gray-500">
                                                                ({sms.stats.sent} göndərildi)
                                                            </span>
                                                        </label>
                                                    )}
                                                    {telegram.configured && (
                                                        <label className="flex items-center space-x-3">
                                                            <Checkbox
                                                                checked={merchantSettings.channels?.includes('telegram')}
                                                                onChange={() => toggleChannel('merchant.new_order', 'telegram')}
                                                            />
                                                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500" />
                                                            <span className="text-sm text-gray-900">Telegram</span>
                                                            <span className="text-xs text-gray-500">
                                                                ({telegram.stats.sent} göndərildi)
                                                            </span>
                                                        </label>
                                                    )}
                                                    {!sms.configured && !telegram.configured && (
                                                        <p className="text-sm text-yellow-600">
                                                            Heç bir kanal konfiqurasiya edilməyib. Zəhmət olmasa SMS və ya Telegram parametrlərini konfiqurasiya edin.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {merchantSettings.channels?.includes('sms') && (
                                                <FormField label="SMS Alıcı Telefon" className="sm:col-span-6">
                                                    <TextInput
                                                        value={merchantSettings.recipients?.sms || ''}
                                                        onChange={(e) => updateRecipient('merchant.new_order', 'sms', e.target.value)}
                                                        placeholder={account_phone}
                                                        className="mt-1 block w-full"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Boş buraxsanız, hesab telefonunuz istifadə ediləcək
                                                    </p>
                                                </FormField>
                                            )}

                                            {merchantSettings.channels?.includes('telegram') && (
                                                <FormField label="Telegram Chat ID" className="sm:col-span-6">
                                                    <TextInput
                                                        value={merchantSettings.recipients?.telegram || ''}
                                                        onChange={(e) => updateRecipient('merchant.new_order', 'telegram', e.target.value)}
                                                        placeholder={telegram.credential?.default_chat_id || ''}
                                                        className="mt-1 block w-full"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Boş buraxsanız, default chat ID istifadə ediləcək
                                                    </p>
                                                </FormField>
                                            )}
                                        </>
                                    )}
                                </FormGrid>
                            </SettingsSection>

                            {/* Customer Notifications */}
                            <SettingsSection
                                title="Müştəri Bildirişləri"
                                description="Müştərilərə göndəriləcək təsdiq bildirişləri"
                                icon={BellIcon}
                            >
                                <FormGrid>
                                    <div className="sm:col-span-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={customerSettings.enabled}
                                                onChange={() => toggleNotificationEnabled('customer.order_confirmation')}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                Müştəri təsdiq bildirişlərini aktiv et
                                            </span>
                                        </label>
                                    </div>

                                    {customerSettings.enabled && (
                                        <div className="sm:col-span-6">
                                            <InputLabel value="Bildiriş Kanalları" />
                                            <div className="mt-2 space-y-2">
                                                {sms.configured && (
                                                    <label className="flex items-center space-x-3">
                                                        <Checkbox
                                                            checked={customerSettings.channels?.includes('sms')}
                                                            onChange={() => toggleChannel('customer.order_confirmation', 'sms')}
                                                        />
                                                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500" />
                                                        <span className="text-sm text-gray-900">SMS (Tövsiyə olunur)</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </FormGrid>
                            </SettingsSection>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {notificationForm.recentlySuccessful && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        Parametrlər yadda saxlanıldı
                                    </p>
                                )}
                                <PrimaryButton type="submit" disabled={notificationForm.processing}>
                                    {notificationForm.processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    )}

                    {/* SMS Settings Tab */}
                    {activeTab === 'sms' && (
                        <form onSubmit={handleSmsSubmit} className="space-y-6">
                            <SettingsSection
                                title="LSim SMS Parametrləri"
                                description="LSim SMS gateway məlumatlarınızı daxil edin"
                                icon={DevicePhoneMobileIcon}
                            >
                                <FormGrid>
                                    {sms.configured && (
                                        <div className="sm:col-span-6 bg-green-50 border border-green-200 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                                                <span className="text-sm font-medium text-green-900">
                                                    SMS konfiqurasiya edilib
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-green-700">
                                                <p>Göndərilən: {sms.stats.sent} | Uğursuz: {sms.stats.failed}</p>
                                            </div>
                                        </div>
                                    )}

                                    <FormField label="Login" className="sm:col-span-3">
                                        <TextInput
                                            value={smsForm.data.login}
                                            onChange={(e) => smsForm.setData('login', e.target.value)}
                                            required
                                            className="mt-1 block w-full"
                                        />
                                    </FormField>

                                    <FormField label="Password" className="sm:col-span-3">
                                        <TextInput
                                            type="password"
                                            value={smsForm.data.password}
                                            onChange={(e) => smsForm.setData('password', e.target.value)}
                                            required={!sms.configured}
                                            placeholder={sms.configured ? '••••••••' : ''}
                                            className="mt-1 block w-full"
                                        />
                                    </FormField>

                                    <FormField label="Göndərən Adı (Sender Name)" className="sm:col-span-3">
                                        <TextInput
                                            value={smsForm.data.sender_name}
                                            onChange={(e) => smsForm.setData('sender_name', e.target.value)}
                                            required
                                            maxLength={11}
                                            className="mt-1 block w-full"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Maksimum 11 simvol
                                        </p>
                                    </FormField>

                                    <FormField label="Gateway URL" className="sm:col-span-3">
                                        <TextInput
                                            value={smsForm.data.gateway_url}
                                            onChange={(e) => smsForm.setData('gateway_url', e.target.value)}
                                            required
                                            className="mt-1 block w-full"
                                        />
                                    </FormField>

                                    <div className="sm:col-span-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={smsForm.data.is_active}
                                                onChange={(e) => smsForm.setData('is_active', e.target.checked)}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                SMS xidmətini aktiv et
                                            </span>
                                        </label>
                                    </div>
                                </FormGrid>
                            </SettingsSection>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {smsForm.recentlySuccessful && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        SMS parametrləri yadda saxlanıldı
                                    </p>
                                )}
                                <PrimaryButton type="submit" disabled={smsForm.processing}>
                                    {smsForm.processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    )}

                    {/* Telegram Settings Tab */}
                    {activeTab === 'telegram' && (
                        <form onSubmit={handleTelegramSubmit} className="space-y-6">
                            <SettingsSection
                                title="Telegram Bot Parametrləri"
                                description="Telegram bot məlumatlarınızı daxil edin"
                                icon={ChatBubbleLeftRightIcon}
                            >
                                <FormGrid>
                                    {telegram.configured && (
                                        <div className="sm:col-span-6">
                                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                                <div className="flex items-center">
                                                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                                                    <span className="text-sm font-medium text-green-900">
                                                        Telegram konfiqurasiya edilib
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-xs text-green-700">
                                                    <p>Bot: @{telegram.credential?.bot_username || 'N/A'}</p>
                                                    <p>Göndərilən: {telegram.stats.sent} | Uğursuz: {telegram.stats.failed}</p>
                                                    {telegram.credential?.last_tested_at && (
                                                        <p>Son test: {new Date(telegram.credential.last_tested_at).toLocaleString('az')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="sm:col-span-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-blue-900 mb-2">Telegram Bot Yaratma Təlimatı:</h4>
                                        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                                            <li>Telegram-da @BotFather botunu tapın</li>
                                            <li>/newbot əmrini göndərin</li>
                                            <li>Bot adını və username-ni təyin edin</li>
                                            <li>Aldığınız Bot Token-i aşağıya daxil edin</li>
                                            <li>Chat ID əldə etmək üçün: botunuza mesaj göndərin və @userinfobot-dan öyrənin</li>
                                        </ol>
                                    </div>

                                    <FormField label="Bot Token" className="sm:col-span-6">
                                        <TextInput
                                            value={telegramForm.data.bot_token}
                                            onChange={(e) => telegramForm.setData('bot_token', e.target.value)}
                                            required={!telegram.configured}
                                            placeholder={telegram.configured ? '••••••••:••••••••' : '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz'}
                                            className="mt-1 block w-full"
                                        />
                                    </FormField>

                                    <FormField label="Bot Username (İstəyə bağlı)" className="sm:col-span-3">
                                        <TextInput
                                            value={telegramForm.data.bot_username}
                                            onChange={(e) => telegramForm.setData('bot_username', e.target.value)}
                                            placeholder="@mybot"
                                            className="mt-1 block w-full"
                                        />
                                    </FormField>

                                    <FormField label="Default Chat ID" className="sm:col-span-3">
                                        <TextInput
                                            value={telegramForm.data.default_chat_id}
                                            onChange={(e) => telegramForm.setData('default_chat_id', e.target.value)}
                                            placeholder="123456789"
                                            className="mt-1 block w-full"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Bildirişlərin göndəriləcəyi default chat
                                        </p>
                                    </FormField>

                                    <div className="sm:col-span-6">
                                        <label className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={telegramForm.data.is_active}
                                                onChange={(e) => telegramForm.setData('is_active', e.target.checked)}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                Telegram xidmətini aktiv et
                                            </span>
                                        </label>
                                    </div>
                                </FormGrid>
                            </SettingsSection>

                            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {telegram.configured && (
                                    <SecondaryButton
                                        type="button"
                                        onClick={handleTestTelegram}
                                        disabled={telegramForm.processing}
                                    >
                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                        Bağlantını Test Et
                                    </SecondaryButton>
                                )}
                                {telegramForm.recentlySuccessful && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        Telegram parametrləri yadda saxlanıldı
                                    </p>
                                )}
                                <PrimaryButton type="submit" disabled={telegramForm.processing}>
                                    {telegramForm.processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
