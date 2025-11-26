import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import {
    BellIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { SettingsSection, FormGrid } from '@/Components/Admin';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

interface Props {
    sms: any;
    telegram: any;
    notification_settings: any;
    account_phone: string;
}

export default function NotificationsTab({ sms, telegram, notification_settings, account_phone }: Props) {
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

    const handleNotificationSubmit = (e: FormEvent) => {
        e.preventDefault();
        notificationForm.post(route('settings.notifications.update'));
    };

    return (
        <div className="space-y-6">
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
        </div>
    );
}
