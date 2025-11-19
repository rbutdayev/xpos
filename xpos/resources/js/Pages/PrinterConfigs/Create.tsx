import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface FormData {
    branch_id: string;
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
    branches: Branch[];
}

export default function Create({ branches }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        branch_id: '',
        name: '',
        printer_type: 'thermal',
        paper_size: '80mm',
        connection_type: 'usb',
        ip_address: '',
        port: 9100,
        connection_timeout: 5000,
        settings: {
            encoding: 'UTF-8',
            line_spacing: 1.0,
            margin_top: 0,
            margin_bottom: 0,
            margin_left: 0,
            margin_right: 0,
            // Barcode label settings defaults
            label_size_preset: '3x2',  // Most common size
            custom_label_width: 76,
            custom_label_height: 51,
            custom_label_gap: 5
        },
        is_default: false,
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/printer-configs');
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
         { value: '50x30', label: '50×30mm - Kiçik', description: 'Kiçik məhsul etiketləri' },
         { value: '2x1', label: '2×1 düym (51×25mm) - Çox kiçik', description: 'Qiymət etiketləri' },
         { value: '60x40', label: '60×40mm - Orta', description: 'Orta məhsul etiketləri' },
         { value: '70x50', label: '70×50mm - Böyük', description: 'Böyük məhsul etiketləri (80mm printer üçün maks)' },
         { value: 'custom', label: 'Fərdi ölçü', description: 'Öz ölçünüzü daxil edin' }
     ];

     // Gap values for each preset (matching barcodePrinter.ts)
     const presetGaps: Record<string, number> = {
         '3x2': 5,
         '50x30': 2,
         '2x1': 3,
         '60x40': 3,
         '70x50': 4,
     };

     const getGapForPreset = (preset: string): number => {
         return presetGaps[preset] || 5;
     };

    return (
        <AuthenticatedLayout>
            <Head title="Yeni Printer Konfiqurasiyası" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                Yeni Printer Konfiqurasiyası
                            </h2>
                            <Link
                                href="/printer-configs"
                                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                                Siyahıya Qayıt
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filial *
                                </label>
                                <select
                                    value={data.branch_id}
                                    onChange={e => setData('branch_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Filial seçin</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.branch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Printer Adı *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Məsələn: Kassa Printeri 1"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bağlantı Növü *
                                </label>
                                <select
                                    value={data.connection_type}
                                    onChange={e => setData('connection_type', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    <option value="usb">USB</option>
                                    <option value="bluetooth">Bluetooth</option>
                                    <option value="serial">Serial</option>
                                </select>
                                {errors.connection_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.connection_type}</p>
                                )}
                            </div>
                        </div>

                        {/* Connection Settings */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Bağlantı Parametrləri</h3>

                            {/* USB Connection */}
                            {data.connection_type === 'usb' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-blue-800">USB Bağlantısı</h4>
                                            <p className="mt-1 text-sm text-blue-700">
                                                USB printeri kompüterinizə qoşun. Sistem avtomatik olaraq USB cihazlarını aşkar edəcək.
                                                Çap zamanı brauzerdən USB cihaz seçməlisiniz.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bluetooth Connection */}
                            {data.connection_type === 'bluetooth' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-blue-800">Bluetooth Bağlantısı</h4>
                                            <p className="mt-1 text-sm text-blue-700">
                                                Bluetooth printeri cihazınızla əvvəlcədən cütləşdirin. Çap zamanı brauzerdən Bluetooth cihaz seçməlisiniz.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Serial Connection */}
                            {data.connection_type === 'serial' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-blue-800">Serial Port Bağlantısı</h4>
                                            <p className="mt-1 text-sm text-blue-700">
                                                Serial printeri kompüterinizə qoşun (COM port). Çap zamanı brauzerdən serial port seçməlisiniz.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kağız Ölçüsü
                                </label>
                                <select
                                    value={data.paper_size}
                                    onChange={e => setData('paper_size', e.target.value)}
                                    className="w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    {paperSizes.map(size => (
                                        <option key={size.value} value={size.value}>
                                            {size.label}
                                        </option>
                                    ))}
                                </select>
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
                                                Aralıq/Gap (mm) *
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

                                {/* Gap Information - Always visible */}
                                {data.settings.label_size_preset !== 'custom' && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Aralıq/Gap (mm)
                                        </label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="text"
                                                value={getGapForPreset(data.settings.label_size_preset || '3x2')}
                                                readOnly
                                                className="w-24 rounded-md border-gray-300 bg-gray-100 shadow-sm text-gray-600 cursor-not-allowed"
                                            />
                                            <span className="text-sm text-gray-600">
                                                (Bu ölçü üçün avtomatik təyin olunub)
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            ℹ️ Fərdi gap təyin etmək üçün "Fərdi ölçü" seçin
                                        </p>
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
                        <div className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                            <Link
                                href="/printer-configs"
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Ləğv Et
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {processing ? 'Saxlanılır...' : 'Saxla'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}