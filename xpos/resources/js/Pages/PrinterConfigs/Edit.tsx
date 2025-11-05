import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface PrinterConfig {
    id: number;
    branch_id: number;
    name: string;
    printer_type: string;
    paper_size: string;
    connection_type: string;
    ip_address: string;
    port: number;
    connection_timeout?: number;
    settings: {
        encoding?: string;
        line_spacing?: number;
        margin_top?: number;
        margin_bottom?: number;
        margin_left?: number;
        margin_right?: number;
        // Barcode label settings
        label_size_preset?: string;
        custom_label_width?: number;
        custom_label_height?: number;
        custom_label_gap?: number;
    };
    is_default: boolean;
    is_active: boolean;
}

interface Branch {
    id: number;
    name: string;
}

interface Props {
    printerConfig: PrinterConfig;
    branches: Branch[];
}

export default function Edit({ printerConfig, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        branch_id: printerConfig.branch_id,
        name: printerConfig.name,
        printer_type: printerConfig.printer_type,
        paper_size: printerConfig.paper_size,
        connection_type: printerConfig.connection_type,
        ip_address: printerConfig.ip_address,
        port: printerConfig.port,
        connection_timeout: printerConfig.connection_timeout || 5000,
        settings: {
            encoding: printerConfig.settings?.encoding || 'UTF-8',
            line_spacing: printerConfig.settings?.line_spacing || 1.0,
            margin_top: printerConfig.settings?.margin_top || 0,
            margin_bottom: printerConfig.settings?.margin_bottom || 0,
            margin_left: printerConfig.settings?.margin_left || 0,
            margin_right: printerConfig.settings?.margin_right || 0,
            // Barcode label settings with defaults
            label_size_preset: printerConfig.settings?.label_size_preset || '3x2',
            custom_label_width: printerConfig.settings?.custom_label_width || 76,
            custom_label_height: printerConfig.settings?.custom_label_height || 51,
            custom_label_gap: printerConfig.settings?.custom_label_gap || 20
        },
        is_default: printerConfig.is_default,
        is_active: printerConfig.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/printer-configs/${printerConfig.id}`);
    };

    const printerTypes = [
        { value: 'thermal', label: 'Termal' },
        { value: 'impact', label: 'Zərbəli' },
        { value: 'laser', label: 'Lazer' },
        { value: 'inkjet', label: 'Mürəkkəb Püskürdən' }
    ];

     const paperSizes = [
         { value: '58mm', label: '58mm' },
         { value: '80mm', label: '80mm' },
         { value: 'A4', label: 'A4' },
         { value: 'Letter', label: 'Letter' }
     ];

     const encodingOptions = [
         { value: 'UTF-8', label: 'UTF-8' },
         { value: 'CP1254', label: 'CP1254 (Türk)' },
         { value: 'ISO-8859-9', label: 'ISO-8859-9' }
     ];

     const labelSizePresets = [
         { value: '3x2', label: '3×2 düym (76×51mm) - Standart', description: 'Ən çox istifadə olunan ölçü' },
         { value: '50x30', label: '50×30mm - Kiçik', description: 'Kiçik məhsul etiketləri üçün' },
         { value: '4x6', label: '4×6 düym (102×152mm) - Göndərmə', description: 'Logistika etiketləri' },
         { value: '2x1', label: '2×1 düym (51×25mm) - Çox kiçik', description: 'Qiymət etiketləri' },
         { value: '4x3', label: '4×3 düym (102×76mm) - Böyük', description: 'Böyük məhsul etiketləri' },
         { value: 'custom', label: 'Fərdi ölçü', description: 'Öz ölçünüzü daxil edin' }
     ];

    return (
        <AuthenticatedLayout>
            <Head title={`${printerConfig.name} - Redaktə Et`} />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Printer Konfiqurasiyasını Redaktə Et
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {printerConfig.name}
                                </p>
                            </div>
                            <Link
                                href="/printer-configs"
                                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                                Siyahıya Qayıt
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Printer Adı *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Printer adını dəyişin"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Printer Növü *
                                </label>
                                <select
                                    value={data.printer_type}
                                    onChange={e => setData('printer_type', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    {printerTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.printer_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.printer_type}</p>
                                )}
                            </div>
                        </div>

                        {/* Connection Settings */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Bağlantı Parametrləri</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        IP Ünvanı *
                                    </label>
                                     <input
                                         type="text"
                                         value={data.ip_address}
                                         onChange={e => setData('ip_address', e.target.value)}
                                         className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                         placeholder="192.168.1.100"
                                         pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                                         required
                                     />
                                    {errors.ip_address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.ip_address}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Port *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.port}
                                        onChange={e => setData('port', parseInt(e.target.value))}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        min="1"
                                        max="65535"
                                        required
                                    />
                                    {errors.port && (
                                        <p className="mt-1 text-sm text-red-600">{errors.port}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kağız Ölçüsü
                                    </label>
                                    <select
                                        value={data.paper_size}
                                        onChange={e => setData('paper_size', e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        {paperSizes.map(size => (
                                            <option key={size.value} value={size.value}>
                                                {size.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bağlantı Vaxtı (ms)
                                    </label>
                                    <input
                                        type="number"
                                        value={data.connection_timeout}
                                        onChange={e => setData('connection_timeout', parseInt(e.target.value))}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        min="1000"
                                        max="30000"
                                        step="1000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Print Settings */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Çap Parametrləri</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kodlaşdırma
                                    </label>
                                    <select
                                        value={data.settings.encoding}
                                        onChange={e => setData('settings', { ...data.settings, encoding: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        {encodingOptions.map(encoding => (
                                            <option key={encoding.value} value={encoding.value}>
                                                {encoding.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sətir Aralığı
                                    </label>
                                    <input
                                        type="number"
                                        value={data.settings.line_spacing}
                                        onChange={e => setData('settings', { ...data.settings, line_spacing: parseFloat(e.target.value) })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Üst Kənar
                                    </label>
                                    <input
                                        type="number"
                                        value={data.settings.margin_top}
                                        onChange={e => setData('settings', { ...data.settings, margin_top: parseInt(e.target.value) })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        min="0"
                                        max="50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alt Kənar
                                    </label>
                                    <input
                                        type="number"
                                        value={data.settings.margin_bottom}
                                        onChange={e => setData('settings', { ...data.settings, margin_bottom: parseInt(e.target.value) })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        min="0"
                                        max="50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sol Kənar
                                    </label>
                                    <input
                                        type="number"
                                        value={data.settings.margin_left}
                                        onChange={e => setData('settings', { ...data.settings, margin_left: parseInt(e.target.value) })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        min="0"
                                        max="50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sağ Kənar
                                    </label>
                                    <input
                                        type="number"
                                        value={data.settings.margin_right}
                                        onChange={e => setData('settings', { ...data.settings, margin_right: parseInt(e.target.value) })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        min="0"
                                        max="50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Barcode Label Settings */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Barkod Etiket Parametrləri</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Bu parametrlər yalnız barkod çapı üçün istifadə olunur. Qəbz çapı üçün yuxarıdakı "Kağız Ölçüsü" istifadə olunur.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Etiket Ölçüsü
                                    </label>
                                    <select
                                        value={data.settings.label_size_preset}
                                        onChange={e => setData('settings', { ...data.settings, label_size_preset: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        {labelSizePresets.map(preset => (
                                            <option key={preset.value} value={preset.value}>
                                                {preset.label} - {preset.description}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Standart etiket ölçüsü 3×2 düym (76×51mm) təvsiyə olunur
                                    </p>
                                </div>

                                {data.settings.label_size_preset === 'custom' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                En (mm) *
                                            </label>
                                            <input
                                                type="number"
                                                value={data.settings.custom_label_width}
                                                onChange={e => setData('settings', { ...data.settings, custom_label_width: parseInt(e.target.value) || 0 })}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                min="20"
                                                max="200"
                                                placeholder="76"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Hündürlük (mm) *
                                            </label>
                                            <input
                                                type="number"
                                                value={data.settings.custom_label_height}
                                                onChange={e => setData('settings', { ...data.settings, custom_label_height: parseInt(e.target.value) || 0 })}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                min="10"
                                                max="300"
                                                placeholder="51"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Aralıq/Gap (mm)
                                            </label>
                                            <input
                                                type="number"
                                                value={data.settings.custom_label_gap}
                                                onChange={e => setData('settings', { ...data.settings, custom_label_gap: parseInt(e.target.value) || 0 })}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                min="0"
                                                max="50"
                                                placeholder="20"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Etiketlər arasındakı boşluq
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Məsləhət</h4>
                                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                        <li>3×2 düym (0.8 düym gap) ən çox istifadə olunan ölçüdür</li>
                                        <li>Printerinizdə olan etiket rulonunun ölçüsünü ölçün</li>
                                        <li>Gap (aralıq) düzgün təyin etmək çox vacibdir - yanlış gap etiketlərin düzgün çıxmamasına səbəb olar</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Status Settings */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Parametrləri</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={data.is_default}
                                        onChange={e => setData('is_default', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_default" className="ml-3 text-sm text-gray-700">
                                        Standart printer olaraq təyin et
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={data.is_active ? 'true' : 'false'}
                                        onChange={e => setData('is_active', e.target.value === 'true')}
                                        className="w-full md:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="true">Aktiv</option>
                                        <option value="false">Deaktiv</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="border-t pt-6 flex justify-end space-x-3">
                            <Link
                                href="/printer-configs"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Ləğv Et
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {processing ? 'Saxlanılır...' : 'Dəyişiklikləri Saxla'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}