import { PrinterIcon } from '@heroicons/react/24/outline';
import { SettingsSection } from '../SettingsSection';
import FormGrid from '../FormGrid';
import FormField from '../FormField';

interface ReceiptData {
    receipt_header_text: string;
    receipt_footer_text: string;
    default_paper_size: string;
    default_width_chars: number;
}

interface ReceiptSettingsSectionProps {
    data: ReceiptData;
    setData: (key: keyof ReceiptData, value: string | number) => void;
    errors: Partial<Record<keyof ReceiptData, string>>;
    saving?: boolean;
}

export default function ReceiptSettingsSection({ 
    data, 
    setData, 
    errors, 
    saving 
}: ReceiptSettingsSectionProps) {
    const paperSizes = [
        { value: '58mm', label: '58mm (Kiçik qəbzlər)' },
        { value: '80mm', label: '80mm (Standart)' },
        { value: 'A4', label: 'A4 (Böyük kağız)' },
        { value: 'letter', label: 'Letter' }
    ];

    return (
        <SettingsSection
            title="Qəbz Ayarları"
            icon={PrinterIcon}
            iconColor="text-green-600"
            saving={saving}
        >
            <FormGrid>
                <FormField 
                    label="Qəbz Başlıq Mətni" 
                    error={errors.receipt_header_text}
                    className="md:col-span-2"
                >
                    <input
                        type="text"
                        value={data.receipt_header_text}
                        onChange={(e) => setData('receipt_header_text', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Qəbz başlığında göstəriləcək mətn"
                    />
                </FormField>

                <FormField 
                    label="Qəbz Altbilgi Mətni" 
                    error={errors.receipt_footer_text}
                    className="md:col-span-2"
                >
                    <input
                        type="text"
                        value={data.receipt_footer_text}
                        onChange={(e) => setData('receipt_footer_text', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Qəbz altbilgisində göstəriləcək mətn"
                    />
                </FormField>

                <FormField label="Standart Kağız Ölçüsü" error={errors.default_paper_size}>
                    <select
                        value={data.default_paper_size}
                        onChange={(e) => setData('default_paper_size', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        {paperSizes.map((size) => (
                            <option key={size.value} value={size.value}>
                                {size.label}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Standart Simvol Sayı" error={errors.default_width_chars}>
                    <input
                        type="number"
                        min="20"
                        max="100"
                        value={data.default_width_chars}
                        onChange={(e) => setData('default_width_chars', parseInt(e.target.value))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </FormField>
            </FormGrid>
        </SettingsSection>
    );
}