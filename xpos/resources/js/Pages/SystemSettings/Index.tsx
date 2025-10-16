import { Head, useForm } from '@inertiajs/react';
import { 
    CogIcon, 
    BuildingOfficeIcon, 
    PrinterIcon, 
    GlobeAltIcon, 
    ClockIcon,
    BellIcon
} from '@heroicons/react/24/outline';
import { AdminLayout, ConfigurationForm } from '@/Components/Admin';
import CompanyInformationSection from '@/Components/Admin/Settings/CompanyInformationSection';
import ReceiptSettingsSection from '@/Components/Admin/Settings/ReceiptSettingsSection';
import RegionalSettingsSection from '@/Components/Admin/Settings/RegionalSettingsSection';
import BusinessHoursSection from '@/Components/Admin/Settings/BusinessHoursSection';
import NotificationSettingsSection from '@/Components/Admin/Settings/NotificationSettingsSection';
import { useSettings } from '@/Hooks/Admin/useSettings';

interface SystemSettings {
    // Company Information
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    tax_number: string;
    default_language: string;
    
    // Receipt Settings
    receipt_header_text: string;
    receipt_footer_text: string;
    default_paper_size: string;
    default_width_chars: number;
    
    // Regional Settings
    currency_code: string;
    currency_symbol: string;
    date_format: string;
    time_format: string;
    timezone: string;
    
    // Business Settings
    business_hours_start: string;
    business_hours_end: string;
    business_days: string[];
    
    // Notification Settings
    email_notifications: boolean;
    sms_notifications: boolean;
    notification_email: string;
    notification_phone: string;
}

interface Props {
    settings: SystemSettings;
}

export default function Index({ settings }: Props) {
    const { 
        data, 
        setData,
        updateSetting, 
        saveAllSettings, 
        processing, 
        errors 
    } = useSettings<SystemSettings>({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_website: settings.company_website || '',
        tax_number: settings.tax_number || '',
        default_language: settings.default_language || 'az',
        receipt_header_text: settings.receipt_header_text || '',
        receipt_footer_text: settings.receipt_footer_text || '',
        default_paper_size: settings.default_paper_size || '80mm',
        default_width_chars: settings.default_width_chars || 32,
        currency_code: settings.currency_code || 'AZN',
        currency_symbol: settings.currency_symbol || 'AZN',
        date_format: settings.date_format || 'd.m.Y',
        time_format: settings.time_format || 'H:i',
        timezone: settings.timezone || 'Asia/Baku',
        business_hours_start: settings.business_hours_start || '09:00',
        business_hours_end: settings.business_hours_end || '18:00',
        business_days: settings.business_days || ['1', '2', '3', '4', '5'],
        email_notifications: settings.email_notifications ?? true,
        sms_notifications: settings.sms_notifications ?? false,
        notification_email: settings.notification_email || '',
        notification_phone: settings.notification_phone || '',
    }, '/settings');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveAllSettings();
    };

    const paperSizes = [
        { value: '58mm', label: '58mm (Kiçik qəbzlər)' },
        { value: '80mm', label: '80mm (Standart)' },
        { value: 'A4', label: 'A4 (Böyük kağız)' },
        { value: 'letter', label: 'Letter' }
    ];


    const handleBusinessDayChange = (dayValue: string, checked: boolean) => {
        if (checked) {
            setData('business_days', [...data.business_days, dayValue]);
        } else {
            setData('business_days', data.business_days.filter(day => day !== dayValue));
        }
    };

    return (
        <AdminLayout 
            title="Sistem Ayarları" 
            description="Şirkət məlumatları və sistem ayarlarını konfiqurasiya edin"
        >

            <ConfigurationForm onSubmit={handleSubmit} processing={processing}>
                {/* Company Information */}
                <CompanyInformationSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    saving={processing}
                />

                {/* Receipt Settings */}
                <ReceiptSettingsSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    saving={processing}
                />

                {/* Regional Settings */}
                <RegionalSettingsSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    saving={processing}
                />

                {/* Business Hours */}
                <BusinessHoursSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    onBusinessDayChange={handleBusinessDayChange}
                    saving={processing}
                />

                {/* Notification Settings */}
                <NotificationSettingsSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    saving={processing}
                />
            </ConfigurationForm>
        </AdminLayout>
    );
}