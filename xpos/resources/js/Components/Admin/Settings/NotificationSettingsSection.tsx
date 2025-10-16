import { BellIcon } from '@heroicons/react/24/outline';
import { SettingsSection } from '../SettingsSection';
import FormGrid from '../FormGrid';
import FormField from '../FormField';

interface NotificationData {
    email_notifications: boolean;
    sms_notifications: boolean;
    notification_email: string;
    notification_phone: string;
}

interface NotificationSettingsSectionProps {
    data: NotificationData;
    setData: (key: keyof NotificationData, value: boolean | string) => void;
    errors: Partial<Record<keyof NotificationData, string>>;
    saving?: boolean;
}

export default function NotificationSettingsSection({ 
    data, 
    setData, 
    errors, 
    saving 
}: NotificationSettingsSectionProps) {
    return (
        <SettingsSection
            title="Bildiriş Ayarları"
            icon={BellIcon}
            iconColor="text-red-600"
            saving={saving}
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={data.email_notifications}
                            onChange={(e) => setData('email_notifications', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-3 text-sm text-gray-900">
                            E-mail bildirişləri aktivdir
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={data.sms_notifications}
                            onChange={(e) => setData('sms_notifications', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-3 text-sm text-gray-900">
                            SMS bildirişləri aktivdir
                        </label>
                    </div>
                </div>

                <FormGrid>
                    <FormField label="Bildiriş E-mail" error={errors.notification_email}>
                        <input
                            type="email"
                            value={data.notification_email}
                            onChange={(e) => setData('notification_email', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            disabled={!data.email_notifications}
                        />
                    </FormField>

                    <FormField label="Bildiriş Telefonu" error={errors.notification_phone}>
                        <input
                            type="text"
                            value={data.notification_phone}
                            onChange={(e) => setData('notification_phone', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            disabled={!data.sms_notifications}
                        />
                    </FormField>
                </FormGrid>
            </div>
        </SettingsSection>
    );
}