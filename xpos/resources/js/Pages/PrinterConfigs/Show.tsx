import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon, 
    PencilIcon, 
    PrinterIcon, 
    TrashIcon,
    WifiIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface PrinterConfig {
    id: number;
    name: string;
    printer_type: string;
    connection_type: string;
    ip_address: string;
    port: number;
    paper_size: string;
    connection_timeout: number;
    is_default: boolean;
    is_active: boolean;
    settings: {
        encoding: string;
        line_spacing: number;
        margin_top: number;
        margin_bottom: number;
        margin_left: number;
        margin_right: number;
        label_size_preset?: string;
        custom_label_width?: number;
        custom_label_height?: number;
        custom_label_gap?: number;
    };
    branch?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface Props {
    printerConfig: PrinterConfig;
}

export default function Show({ printerConfig }: Props) {
    const [testing, setTesting] = useState(false);

    const handleTestPrint = () => {
        setTesting(true);
        router.post(`/printer-configs/${printerConfig.id}/test`, {}, {
            preserveState: true,
            onFinish: () => setTesting(false),
            onSuccess: () => {
                // Test print success handled by flash message
            },
            onError: () => {
                // Test print error handled by flash message
            }
        });
    };

    const handleDelete = () => {
        if (confirm('Bu printer konfiqurasiyasını silmək istədiyinizə əminsiniz?')) {
            router.delete(`/printer-configs/${printerConfig.id}`, {
                onSuccess: () => router.get('/printer-configs')
            });
        }
    };

     const getTypeLabel = (printer_type: string) => {
         const types: Record<string, string> = {
         'thermal': 'Termal',
         'inkjet': 'Mürəkkəb Püskürdən',
         'laser': 'Lazer',
         'impact': 'Zərbəli',
         'dot_matrix': 'Nöqtə Matrisi'
         };
         return types[printer_type] || printer_type;
     };

     const getEncodingLabel = (encoding: string) => {
         const encodings: Record<string, string> = {
         'UTF-8': 'UTF-8',
         'CP1254': 'CP1254 (Türk)',
         'ISO-8859-9': 'ISO-8859-9'
         };
         return encodings[encoding] || encoding;
     };

    return (
        <AuthenticatedLayout>
            <Head title={printerConfig.name} />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Link
                                    href="/printer-configs"
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                                        <PrinterIcon className="w-6 h-6 mr-3 text-gray-400" />
                                        {printerConfig.name}
                                        {printerConfig.is_default && (
                                            <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                Standart Printer
                                            </span>
                                        )}
                                    </h1>
                                     <p className="mt-1 text-sm text-gray-600">
                                         {getTypeLabel(printerConfig.printer_type)} • {printerConfig.paper_size}
                                     </p>
                                </div>
                            </div>

                             <div className="flex items-center space-x-3">
                                 <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                     printerConfig.is_active 
                                         ? 'bg-green-100 text-green-800' 
                                         : 'bg-red-100 text-red-800'
                                 }`}>
                                                 {printerConfig.is_active ? 'Aktiv' : 'Deaktiv'}
                                 </span>
                                 
                                 {printerConfig.is_active && (
                                    <button
                                        onClick={handleTestPrint}
                                        disabled={testing}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        <PrinterIcon className="w-4 h-4 mr-2" />
                                        {testing ? 'Test Edilir...' : 'Test Çap'}
                                    </button>
                                )}

                                <Link
                                    href={`/printer-configs/${printerConfig.id}/edit`}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Redaktə Et
                                </Link>

                                {!printerConfig.is_default && (
                                    <button
                                        onClick={handleDelete}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <TrashIcon className="w-4 h-4 mr-2" />
                                        Sil
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <div className="lg:col-span-2">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-400" />
                                    Əsas Məlumatlar
                                </h3>
                                
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Printer Adı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{printerConfig.name}</dd>
                                    </div>
                                    
                                     <div>
                                         <dt className="text-sm font-medium text-gray-500">Printer Növü</dt>
                                         <dd className="mt-1 text-sm text-gray-900">{getTypeLabel(printerConfig.printer_type)}</dd>
                                     </div>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Kağız Ölçüsü</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{printerConfig.paper_size}</dd>
                                    </div>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                         <dd className="mt-1">
                                             <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                 printerConfig.is_active 
                                                     ? 'bg-green-100 text-green-800' 
                                                     : 'bg-red-100 text-red-800'
                                             }`}>
                                     {printerConfig.is_active ? 'Aktiv' : 'Deaktiv'}
                                             </span>
                                         </dd>
                                    </div>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Yaradılma Tarixi</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(printerConfig.created_at).toLocaleDateString('az-AZ', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </dd>
                                    </div>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Son Yeniləmə</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(printerConfig.updated_at).toLocaleDateString('az-AZ', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Print Settings */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Çap Parametrləri</h3>
                                
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Kodlaşdırma</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{getEncodingLabel(printerConfig.settings.encoding)}</dd>
                                    </div>
                                    
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Sətir Aralığı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{printerConfig.settings.line_spacing}x</dd>
                                    </div>
                                </dl>

                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-500 mb-3">Kənarlar</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div>
                                            <dt className="text-xs text-gray-500">Üst</dt>
                                            <dd className="text-sm text-gray-900">{printerConfig.settings.margin_top}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Alt</dt>
                                            <dd className="text-sm text-gray-900">{printerConfig.settings.margin_bottom}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Sol</dt>
                                            <dd className="text-sm text-gray-900">{printerConfig.settings.margin_left}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Sağ</dt>
                                            <dd className="text-sm text-gray-900">{printerConfig.settings.margin_right}</dd>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Barcode Label Settings */}
                        {printerConfig.settings.label_size_preset && (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Barkod Etiket Parametrləri</h3>

                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Etiket Ölçüsü</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {printerConfig.settings.label_size_preset === '3x2' && '3×2 düym (76×51mm) - Standart'}
                                                {printerConfig.settings.label_size_preset === '50x30' && '50×30mm - Kiçik'}
                                                {printerConfig.settings.label_size_preset === '2x1' && '2×1 düym (51×25mm) - Çox kiçik'}
                                                {printerConfig.settings.label_size_preset === '60x40' && '60×40mm - Orta'}
                                                {printerConfig.settings.label_size_preset === '70x50' && '70×50mm - Böyük'}
                                                {printerConfig.settings.label_size_preset === 'custom' && 'Fərdi ölçü'}
                                            </dd>
                                        </div>

                                        {printerConfig.settings.label_size_preset === 'custom' && (
                                            <>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">En (mm)</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                                                        {printerConfig.settings.custom_label_width}mm
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Hündürlük (mm)</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                                                        {printerConfig.settings.custom_label_height}mm
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Aralıq/Gap (mm)</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                                                        {printerConfig.settings.custom_label_gap}mm
                                                    </dd>
                                                </div>
                                            </>
                                        )}

                                        {printerConfig.settings.label_size_preset !== 'custom' && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Aralıq/Gap (mm)</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                                                    {printerConfig.settings.label_size_preset === '3x2' && '5mm'}
                                                    {printerConfig.settings.label_size_preset === '50x30' && '2mm'}
                                                    {printerConfig.settings.label_size_preset === '2x1' && '3mm'}
                                                    {printerConfig.settings.label_size_preset === '60x40' && '3mm'}
                                                    {printerConfig.settings.label_size_preset === '70x50' && '4mm'}
                                                    <span className="ml-2 text-xs text-gray-500">(avtomatik)</span>
                                                </dd>
                                            </div>
                                        )}
                                    </dl>

                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-sm text-yellow-800">
                                            ⚠️ Gap (aralıq) düzgün təyin etmək çox vacibdir - yanlış gap etiketlərin düzgün çıxmamasına səbəb olar
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Connection Information */}
                    <div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <WifiIcon className="w-5 h-5 mr-2 text-gray-400" />
                                    Bağlantı Məlumatları
                                </h3>

                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Bağlantı Növü</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded">
                                            {printerConfig.connection_type === 'usb' && 'USB'}
                                            {printerConfig.connection_type === 'bluetooth' && 'Bluetooth'}
                                            {printerConfig.connection_type === 'serial' && 'Serial'}
                                            {printerConfig.connection_type === 'network' && 'Şəbəkə'}
                                        </dd>
                                    </div>

                                    {printerConfig.connection_type === 'network' && printerConfig.ip_address && (
                                        <>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">IP Ünvanı</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                                                    {printerConfig.ip_address}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Port</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                                                    {printerConfig.port}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Tam Ünvan</dt>
                                                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded break-all">
                                                    {printerConfig.ip_address}:{printerConfig.port}
                                                </dd>
                                            </div>
                                        </>
                                    )}

                                    {printerConfig.connection_type === 'usb' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                            <p className="text-sm text-blue-800">
                                                USB printer - brauzerdə çap zamanı USB cihaz seçilməlidir
                                            </p>
                                        </div>
                                    )}

                                    {printerConfig.connection_type === 'bluetooth' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                            <p className="text-sm text-blue-800">
                                                Bluetooth printer - brauzerdə çap zamanı Bluetooth cihaz seçilməlidir
                                            </p>
                                        </div>
                                    )}

                                    {printerConfig.connection_type === 'serial' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                            <p className="text-sm text-blue-800">
                                                Serial (COM port) printer - brauzerdə çap zamanı serial port seçilməlidir
                                            </p>
                                        </div>
                                    )}
                                </dl>

                                {printerConfig.is_default && (
                                    <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex items-center">
                                            <PrinterIcon className="w-5 h-5 text-blue-600 mr-2" />
                                            <span className="text-sm text-blue-800 font-medium">
                                                Bu printer sistemin standart printeri olaraq təyin edilib.
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-blue-600">
                                            Bütün çap əməliyyatları avtomatik olaraq bu printerə göndəriləcək.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}