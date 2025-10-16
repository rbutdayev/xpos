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
        connection_type: 'network',
        ip_address: '',
        port: 9100,
        connection_timeout: 5000,
        settings: {
            encoding: 'UTF-8',
            line_spacing: 1.0,
            margin_top: 0,
            margin_bottom: 0,
            margin_left: 0,
            margin_right: 0
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

    return (
        <AuthenticatedLayout>
            <Head title="Yeni Printer Konfiqurasiyası" />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Yeni Printer Konfiqurasiyası
                            </h2>
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
                                    <option value="network">Şəbəkə</option>
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
                                {processing ? 'Saxlanılır...' : 'Saxla'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}