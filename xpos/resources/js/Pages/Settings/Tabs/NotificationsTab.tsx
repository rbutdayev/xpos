import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    BellIcon,
    DevicePhoneMobileIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';

interface Props {
    sms: any;
    telegram: any;
    notification_settings: any;
    account_phone: string;
}

export default function NotificationsTab({ sms, telegram, notification_settings, account_phone }: Props) {
    const [activeSubTab, setActiveSubTab] = useState<'channels' | 'sms' | 'telegram'>('channels');

    // Initialize notification settings with proper defaults
    const initialSettings = notification_settings || {};

    // Notification channels form
    const notificationForm: any = useForm({
        notification_settings: initialSettings,
    });

    // Helper function to get merchant new order settings
    const getMerchantNewOrderSetting = (key: string, defaultValue: any = false) => {
        const settings = notificationForm.data.notification_settings as any;
        if (!settings || !settings['merchant.new_order']) return defaultValue;
        const keys = key.split('.');
        let value = settings['merchant.new_order'];
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
    const getCustomerOrderSetting = (key: string, defaultValue: any = false) => {
        const settings = notificationForm.data.notification_settings as any;
        if (!settings || !settings['customer.order_confirmation']) return defaultValue;
        const keys = key.split('.');
        let value = settings['customer.order_confirmation'];
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
    const updateNotificationSetting = (eventKey: string, path: string, value: any) => {
        const settings: Record<string, any> = JSON.parse(JSON.stringify(notificationForm.data.notification_settings || {}));
        if (!settings[eventKey]) {
            settings[eventKey] = { enabled: false, channels: [], recipients: {} };
        }
        const keys = path.split('.');
        let current = settings[eventKey];
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        notificationForm.setData('notification_settings', settings);
    };

    // SMS form
    const smsForm: any = useForm({
        login: sms.credential?.login || '',
        password: '',
        sender_name: sms.credential?.sender_name || '',
        gateway_url: 'https://api.lsim.az/sendsms.php',
        is_active: sms.credential?.is_active ?? true,
    });

    // Telegram form
    const telegramForm: any = useForm({
        bot_token: '',
        bot_username: telegram.credential?.bot_username || '',
        default_chat_id: telegram.credential?.default_chat_id || '',
        is_active: telegram.credential?.is_active ?? true,
    });

    const handleNotificationSubmit = (e: FormEvent) => {
        e.preventDefault();
        notificationForm.post(route('settings.notifications.update'));
    };

    const handleSmsSubmit = (e: FormEvent) => {
        e.preventDefault();
        smsForm.post(route('settings.sms.update'));
    };

    const handleTelegramSubmit = (e: FormEvent) => {
        e.preventDefault();
        telegramForm.post(route('settings.telegram.update'));
    };

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveSubTab('channels')}
                        className={`${
                            activeSubTab === 'channels'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        <BellIcon className="inline-block w-5 h-5 mr-2" />
                        Bildiriş Kanalları
                    </button>
                    <button
                        onClick={() => setActiveSubTab('sms')}
                        className={`${
                            activeSubTab === 'sms'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        <DevicePhoneMobileIcon className="inline-block w-5 h-5 mr-2" />
                        LSim SMS
                    </button>
                    <button
                        onClick={() => setActiveSubTab('telegram')}
                        className={`${
                            activeSubTab === 'telegram'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        <ChatBubbleLeftRightIcon className="inline-block w-5 h-5 mr-2" />
                        Telegram
                    </button>
                </nav>
            </div>

            {/* Channels Sub-tab */}
            {activeSubTab === 'channels' && (
                <form onSubmit={handleNotificationSubmit}>
                    <SettingsSection
                        title="Bildiriş Kanalları"
                        description="Hansı kanallardan bildiriş almaq istədiyinizi seçin"
                        icon={BellIcon}
                    >
                        <FormGrid>
                            <div className="sm:col-span-6">
                                <p className="text-sm text-gray-600 mb-4">
                                    Bildiriş kanallarını konfiqurasiya etmək üçün əvvəlcə SMS və ya Telegram parametrlərini quraşdırın.
                                </p>
                                {sms.configured && (
                                    <div className="mt-2 bg-green-50 p-3 rounded">
                                        <CheckCircleIcon className="inline-block w-5 h-5 text-green-600 mr-2" />
                                        SMS konfiqurasiya edilib ({sms.stats.sent} göndərildi)
                                    </div>
                                )}
                                {telegram.configured && (
                                    <div className="mt-2 bg-green-50 p-3 rounded">
                                        <CheckCircleIcon className="inline-block w-5 h-5 text-green-600 mr-2" />
                                        Telegram konfiqurasiya edilib ({telegram.stats.sent} göndərildi)
                                    </div>
                                )}
                            </div>

                            {/* Merchant New Order Notification */}
                            <div className="sm:col-span-6 border-t pt-4 mt-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Yeni Sifariş Bildirişi (Mağaza sahibinə)
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Checkbox
                                            checked={getMerchantNewOrderSetting('enabled', false)}
                                            onChange={(e) => updateNotificationSetting('merchant.new_order', 'enabled', e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Yeni sifariş bildirişlərini aktiv et</span>
                                    </div>

                                    {getMerchantNewOrderSetting('enabled', false) && (
                                        <div className="ml-6 space-y-3">
                                            <div className="text-sm font-medium text-gray-700">Kanallar:</div>

                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        checked={(getMerchantNewOrderSetting('channels', []) as string[]).includes('sms')}
                                                        onChange={(e) => {
                                                            const currentChannels = getMerchantNewOrderSetting('channels', []) as string[];
                                                            const newChannels = e.target.checked
                                                                ? [...currentChannels.filter(c => c !== 'sms'), 'sms']
                                                                : currentChannels.filter(c => c !== 'sms');
                                                            updateNotificationSetting('merchant.new_order', 'channels', newChannels);
                                                        }}
                                                        disabled={!sms.configured}
                                                    />
                                                    <span className={`ml-2 text-sm ${sms.configured ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        SMS
                                                        {!sms.configured && <span className="text-xs text-amber-600 ml-2">(konfiqurasiya edilməyib)</span>}
                                                    </span>
                                                </div>
                                                {sms.configured && (getMerchantNewOrderSetting('channels', []) as string[]).includes('sms') && (
                                                    <div className="ml-6">
                                                        <InputLabel htmlFor="sms_recipient">Telefon nömrəsi</InputLabel>
                                                        <TextInput
                                                            id="sms_recipient"
                                                            value={getMerchantNewOrderSetting('recipients.sms', account_phone)}
                                                            onChange={(e) => updateNotificationSetting('merchant.new_order', 'recipients.sms', e.target.value)}
                                                            placeholder="+994501234567"
                                                            className="mt-1 block w-full"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        checked={(getMerchantNewOrderSetting('channels', []) as string[]).includes('telegram')}
                                                        onChange={(e) => {
                                                            const currentChannels = getMerchantNewOrderSetting('channels', []) as string[];
                                                            const newChannels = e.target.checked
                                                                ? [...currentChannels.filter(c => c !== 'telegram'), 'telegram']
                                                                : currentChannels.filter(c => c !== 'telegram');
                                                            updateNotificationSetting('merchant.new_order', 'channels', newChannels);

                                                            // Auto-populate chat ID from DB if checking the box and no value exists
                                                            if (e.target.checked && !getMerchantNewOrderSetting('recipients.telegram', '')) {
                                                                const defaultChatId = telegram.credential?.default_chat_id || '';
                                                                if (defaultChatId) {
                                                                    updateNotificationSetting('merchant.new_order', 'recipients.telegram', defaultChatId);
                                                                }
                                                            }
                                                        }}
                                                        disabled={!telegram.configured}
                                                    />
                                                    <span className={`ml-2 text-sm ${telegram.configured ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        Telegram
                                                        {!telegram.configured && <span className="text-xs text-amber-600 ml-2">(konfiqurasiya edilməyib)</span>}
                                                    </span>
                                                </div>
                                                {telegram.configured && (getMerchantNewOrderSetting('channels', []) as string[]).includes('telegram') && (
                                                    <div className="ml-6">
                                                        <InputLabel htmlFor="telegram_recipient">Chat ID</InputLabel>
                                                        <TextInput
                                                            id="telegram_recipient"
                                                            value={getMerchantNewOrderSetting('recipients.telegram', telegram.credential?.default_chat_id || '')}
                                                            onChange={(e) => updateNotificationSetting('merchant.new_order', 'recipients.telegram', e.target.value)}
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
                                                <div className="text-sm text-amber-600">
                                                    Heç bir kanal konfiqurasiya edilməyib. Zəhmət olmasa əvvəlcə SMS və ya Telegram parametrlərini quraşdırın.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Order Confirmation */}
                            <div className="sm:col-span-6 border-t pt-4 mt-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Müştəri Təsdiq Bildirişi
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Checkbox
                                            checked={getCustomerOrderSetting('enabled', false)}
                                            onChange={(e) => updateNotificationSetting('customer.order_confirmation', 'enabled', e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Müştəriyə təsdiq bildirişi göndər</span>
                                    </div>

                                    {getCustomerOrderSetting('enabled', false) && (
                                        <div className="ml-6 space-y-3">
                                            <div className="text-sm font-medium text-gray-700">Kanallar:</div>

                                            <div className="flex items-center">
                                                <Checkbox
                                                    checked={(getCustomerOrderSetting('channels', []) as string[]).includes('sms')}
                                                    onChange={(e) => {
                                                        const currentChannels = getCustomerOrderSetting('channels', []) as string[];
                                                        const newChannels = e.target.checked
                                                            ? [...currentChannels.filter(c => c !== 'sms'), 'sms']
                                                            : currentChannels.filter(c => c !== 'sms');
                                                        updateNotificationSetting('customer.order_confirmation', 'channels', newChannels);
                                                    }}
                                                    disabled={!sms.configured}
                                                />
                                                <span className={`ml-2 text-sm ${sms.configured ? 'text-gray-700' : 'text-gray-400'}`}>
                                                    SMS (müştərinin telefon nömrəsinə göndəriləcək)
                                                    {!sms.configured && <span className="block text-xs text-amber-600 mt-1">SMS konfiqurasiyası tələb olunur</span>}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FormGrid>
                    </SettingsSection>

                    <div className="flex justify-end mt-4">
                        <PrimaryButton type="submit" disabled={notificationForm.processing}>
                            {notificationForm.processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                        </PrimaryButton>
                    </div>
                </form>
            )}

            {/* SMS Sub-tab */}
            {activeSubTab === 'sms' && (
                <form onSubmit={handleSmsSubmit}>
                    <SettingsSection
                        title="LSim SMS Parametrləri"
                        description="LSim SMS gateway məlumatlarınızı daxil edin"
                        icon={DevicePhoneMobileIcon}
                    >
                        <FormGrid>
                            {sms.configured && (
                                <div className="sm:col-span-6 bg-green-50 border border-green-200 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <CheckCircleIcon className="inline-block w-5 h-5 text-green-600 mr-2" />
                                        <span className="font-medium text-green-900">SMS konfiqurasiya edilib</span>
                                    </div>
                                    <div className="mt-2 text-xs text-green-800 space-y-1">
                                        <p><strong>Login:</strong> {sms.credential?.login || 'N/A'}</p>
                                        <p><strong>Sender Name:</strong> {sms.credential?.sender_name || 'N/A'}</p>
                                        <p><strong>Gateway:</strong> {sms.credential?.gateway_url || 'N/A'}</p>
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
                                    className="mt-1 block w-full"
                                />
                            </FormField>

                            <FormField label="Göndərən Adı" className="sm:col-span-6">
                                <TextInput
                                    value={smsForm.data.sender_name}
                                    onChange={(e) => smsForm.setData('sender_name', e.target.value)}
                                    required
                                    maxLength={11}
                                    className="mt-1 block w-full"
                                />
                            </FormField>
                        </FormGrid>
                    </SettingsSection>

                    <div className="flex justify-end gap-2 mt-4">
                        {sms.configured && (
                            <SecondaryButton
                                type="button"
                                onClick={() => {
                                    if (confirm('Test SMS göndərilsin?')) {
                                        const phone = prompt('Telefon nömrəsi:', account_phone);
                                        if (phone) {
                                            const form = document.createElement('form');
                                            form.method = 'POST';
                                            form.action = route('settings.test-notification');

                                            const csrfInput = document.createElement('input');
                                            csrfInput.type = 'hidden';
                                            csrfInput.name = '_token';
                                            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                                            form.appendChild(csrfInput);

                                            const channelInput = document.createElement('input');
                                            channelInput.type = 'hidden';
                                            channelInput.name = 'channel';
                                            channelInput.value = 'sms';
                                            form.appendChild(channelInput);

                                            const recipientInput = document.createElement('input');
                                            recipientInput.type = 'hidden';
                                            recipientInput.name = 'recipient';
                                            recipientInput.value = phone;
                                            form.appendChild(recipientInput);

                                            document.body.appendChild(form);
                                            form.submit();
                                        }
                                    }
                                }}
                            >
                                Test göndər
                            </SecondaryButton>
                        )}
                        <PrimaryButton type="submit" disabled={smsForm.processing}>
                            {smsForm.processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                        </PrimaryButton>
                    </div>
                </form>
            )}

            {/* Telegram Sub-tab */}
            {activeSubTab === 'telegram' && (
                <form onSubmit={handleTelegramSubmit}>
                    <SettingsSection
                        title="Telegram Bot Parametrləri"
                        description="Telegram bot məlumatlarınızı daxil edin"
                        icon={ChatBubbleLeftRightIcon}
                    >
                        <FormGrid>
                            {telegram.configured && (
                                <div className="sm:col-span-6 bg-green-50 border border-green-200 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <CheckCircleIcon className="inline-block w-5 h-5 text-green-600 mr-2" />
                                        <span className="font-medium text-green-900">Telegram konfiqurasiya edilib</span>
                                    </div>
                                    <div className="mt-2 text-xs text-green-800 space-y-1">
                                        <p><strong>Bot Username:</strong> @{telegram.credential?.bot_username || 'N/A'}</p>
                                        <p><strong>Bot Token:</strong> {telegram.credential ? '••••••••' : 'N/A'}</p>
                                        <p><strong>Default Chat ID:</strong> {telegram.credential?.default_chat_id || <span className="text-red-600 font-medium">YOX - Zəhmət olmasa daxil edin!</span>}</p>
                                    </div>
                                </div>
                            )}

                            <FormField label="Bot Token" className="sm:col-span-6">
                                <TextInput
                                    value={telegramForm.data.bot_token}
                                    onChange={(e) => telegramForm.setData('bot_token', e.target.value)}
                                    required={!telegram.configured}
                                    placeholder={telegram.configured ? "Boş buraxsanız, mövcud token dəyişməz" : "1234567890:ABCdefGHI..."}
                                    className="mt-1 block w-full"
                                />
                                {telegram.configured && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Token konfiqurasiya olunub. Yalnız dəyişdirmək istəyirsinizsə yeni token daxil edin.
                                    </p>
                                )}
                            </FormField>

                            <FormField label="Bot Username" className="sm:col-span-3">
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
                            </FormField>
                        </FormGrid>
                    </SettingsSection>

                    <div className="flex justify-end gap-2 mt-4">
                        {telegram.configured && (
                            <SecondaryButton
                                type="button"
                                onClick={() => {
                                    if (confirm('Test Telegram mesajı göndərilsin?')) {
                                        const chatId = prompt('Chat ID:', telegram.credential?.default_chat_id || '');
                                        if (chatId) {
                                            const form = document.createElement('form');
                                            form.method = 'POST';
                                            form.action = route('settings.test-notification');

                                            const csrfInput = document.createElement('input');
                                            csrfInput.type = 'hidden';
                                            csrfInput.name = '_token';
                                            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                                            form.appendChild(csrfInput);

                                            const channelInput = document.createElement('input');
                                            channelInput.type = 'hidden';
                                            channelInput.name = 'channel';
                                            channelInput.value = 'telegram';
                                            form.appendChild(channelInput);

                                            const recipientInput = document.createElement('input');
                                            recipientInput.type = 'hidden';
                                            recipientInput.name = 'recipient';
                                            recipientInput.value = chatId;
                                            form.appendChild(recipientInput);

                                            document.body.appendChild(form);
                                            form.submit();
                                        }
                                    }
                                }}
                            >
                                Test göndər
                            </SecondaryButton>
                        )}
                        {telegram.configured && (
                            <SecondaryButton
                                type="button"
                                onClick={() => {
                                    if (confirm('Telegram bot əlaqəsi test edilsin?')) {
                                        const form = document.createElement('form');
                                        form.method = 'POST';
                                        form.action = route('settings.telegram.test');

                                        const csrfInput = document.createElement('input');
                                        csrfInput.type = 'hidden';
                                        csrfInput.name = '_token';
                                        csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                                        form.appendChild(csrfInput);

                                        document.body.appendChild(form);
                                        form.submit();
                                    }
                                }}
                            >
                                Botu Test Et
                            </SecondaryButton>
                        )}
                        <PrimaryButton type="submit" disabled={telegramForm.processing}>
                            {telegramForm.processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                        </PrimaryButton>
                    </div>
                </form>
            )}
        </div>
    );
}
