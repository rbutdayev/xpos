import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon, 
    PencilIcon, 
    TrashIcon,
    DocumentDuplicateIcon,
    DocumentTextIcon,
    PrinterIcon,
    StarIcon,
    EyeIcon,
    CodeBracketIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ReceiptTemplate {
    template_id: number;
    name: string;
    type: string;
    template_content: string;
    variables: string[] | null;
    paper_size: string;
    width_chars: number;
    is_default: boolean;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface SystemSettings {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    tax_number: string;
    branch_name: string;
    branch_address: string;
    branch_phone: string;
    branch_email: string;
    divider: string;
    currency_symbol: string;
    currency_code: string;
}

interface Props {
    receiptTemplate: ReceiptTemplate;
    systemSettings: SystemSettings;
}

export default function Show({ receiptTemplate, systemSettings }: Props) {
    const [duplicating, setDuplicating] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    const handleDuplicate = () => {
        setDuplicating(true);
        router.post(`/receipt-templates/${receiptTemplate.template_id}/duplicate`, {}, {
            preserveState: true,
            onFinish: () => setDuplicating(false),
            onSuccess: () => {
                // Duplicate success handled by flash message
            }
        });
    };

    const handleDelete = () => {
        if (confirm('Bu qəbz şablonunu silmək istədiyinizdən əminsiniz?')) {
            router.delete(`/receipt-templates/${receiptTemplate.template_id}`, {
                onSuccess: () => router.get('/receipt-templates')
            });
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'sale': 'Satış Qəbzi',
            'service': 'Xidmət Qəbzi',
            'return': 'Geri Qaytarma',
            'payment': 'Ödəniş Qəbzi'
        };
        return labels[type] || type;
    };

    // Mock data for template preview
    const getMockData = () => {
        const baseData = {
            company_name: systemSettings.company_name || 'ONYX xPos',
            company_address: systemSettings.company_address || 'Nizami küç. 123, Bakı',
            company_phone: systemSettings.company_phone || '+994 12 555-0123',
            company_email: systemSettings.company_email || 'info@onyx.az',
            company_website: systemSettings.company_website || 'www.onyx.az',
            tax_number: systemSettings.tax_number || '1234567890',
            branch_name: systemSettings.branch_name || 'Mərkəzi Filial',
            branch_address: systemSettings.branch_address || 'Nizami küç. 123, Bakı',
            branch_phone: systemSettings.branch_phone || '+994 12 555-0123',
            branch_email: systemSettings.branch_email || 'filial@onyx.az',
            date: new Date().toLocaleDateString('az-AZ'),
            time: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
            receipt_number: 'QZ-2025-00001',
            divider: systemSettings.divider || '--------------------------------',
        };

        switch (receiptTemplate.type) {
            case 'sale':
                return {
                    ...baseData,
                    customer_name: 'Əli Məmmədov',
                    customer_phone: '+994 50 555-0123',
                    items: 'Motor yağı SAE 5W-30 4                25.00 AZN\nYağ filtri 1                         15.00 AZN\nƏyləc yağı 0.5                        6.00 AZN',
                    subtotal: `46.00 ${systemSettings.currency_symbol || 'AZN'}`,
                    tax_amount: `8.28 ${systemSettings.currency_symbol || 'AZN'}`,
                    discount_amount: `0.00 ${systemSettings.currency_symbol || 'AZN'}`,
                    total: `54.28 ${systemSettings.currency_symbol || 'AZN'}`,
                    payment_method: 'Nəğd',
                };
            case 'service':
                return {
                    ...baseData,
                    customer_name: 'Vəli Həsənov',
                    customer_vehicle: 'BMW X5 2020',
                    vehicle_number: '10-AB-123',
                    vehicle_mileage: '85,000 km',
                    vehicle_plate: '10-AB-123',
                    vehicle_brand: 'BMW X5 2020',
                    service_description: 'Motor yağı dəyişdirilməsi\nYağ filtri dəyişdirilməsi\nDiaqnostika',
                    items: 'Yağ dəyişmə xidməti 1               20.00 AZN\nMotor yağı 5W-30 4                   25.00 AZN\nYağ filtiri 1                         8.00 AZN',
                    employee_name: 'Rəşad Əliyev',
                    labor_cost: `20.00 ${systemSettings.currency_symbol || 'AZN'}`,
                    parts_cost: `33.00 ${systemSettings.currency_symbol || 'AZN'}`,
                    total_cost: `53.00 ${systemSettings.currency_symbol || 'AZN'}`,
                };
            default:
                return baseData;
        }
    };

    // Replace template variables with mock data
    const renderTemplateWithMockData = () => {
        const mockData = getMockData();
        let renderedContent = receiptTemplate.template_content;

        Object.entries(mockData).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            renderedContent = renderedContent.replace(regex, value);
        });

        return renderedContent;
    };

    return (
        <AuthenticatedLayout>
            <Head title={receiptTemplate.name} />

            <div className="mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Link
                                    href="/receipt-templates"
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                                        <DocumentTextIcon className="w-6 h-6 mr-3 text-gray-400" />
                                        {receiptTemplate.name}
                                        {receiptTemplate.is_default && (
                                            <span className="ml-3 flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                                <StarIcon className="w-3 h-3 mr-1" />
                                                Əsas Şablon
                                            </span>
                                        )}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {getTypeLabel(receiptTemplate.type)} • {receiptTemplate.paper_size} • {receiptTemplate.width_chars} simvol
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    receiptTemplate.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {receiptTemplate.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Template Details */}
                    <div className="lg:col-span-1">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Şablon Məlumatları</h3>
                            </div>
                            <div className="p-6">
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Adı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{receiptTemplate.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Növ</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{getTypeLabel(receiptTemplate.type)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Kağız Ölçüsü</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{receiptTemplate.paper_size}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Simvol Sayı</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{receiptTemplate.width_chars}</dd>
                                    </div>
                                    {receiptTemplate.notes && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Qeydlər</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{receiptTemplate.notes}</dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Yaradılma Tarixi</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(receiptTemplate.created_at).toLocaleDateString('az-AZ')}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Əməliyyatlar</h3>
                            </div>
                            <div className="p-6 space-y-3">
                                <Link
                                    href={`/receipt-templates/${receiptTemplate.template_id}/edit`}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Redaktə et
                                </Link>
                                
                                <button
                                    onClick={handleDuplicate}
                                    disabled={duplicating}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                    {duplicating ? 'Kopyalanır...' : 'Kopyala'}
                                </button>

                                {!receiptTemplate.is_default && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                                    >
                                        <TrashIcon className="w-4 h-4 mr-2" />
                                        Sil
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Template Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {showRaw ? 'Şablon Məzmunu' : 'Şablon Önizləməsi'}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setShowRaw(false)}
                                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                !showRaw 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            <EyeIcon className="w-4 h-4 mr-1" />
                                            Önizləmə
                                        </button>
                                        <button
                                            onClick={() => setShowRaw(true)}
                                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                showRaw 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            <CodeBracketIcon className="w-4 h-4 mr-1" />
                                            Kod
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {showRaw ? (
                                    <div className="bg-gray-100 rounded-lg p-4">
                                        <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                                            {receiptTemplate.template_content}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-300 rounded-lg shadow-inner">
                                        {/* Receipt Paper Simulation */}
                                        <div 
                                            className="mx-auto bg-white p-6 font-mono text-sm leading-relaxed"
                                            style={{ 
                                                width: receiptTemplate.paper_size === '58mm' ? '220px' : 
                                                       receiptTemplate.paper_size === '80mm' ? '300px' : 
                                                       receiptTemplate.paper_size === 'A4' ? '600px' : '300px',
                                                fontSize: receiptTemplate.paper_size === '58mm' ? '10px' : 
                                                         receiptTemplate.paper_size === '80mm' ? '12px' : '14px'
                                            }}
                                        >
                                            <pre className="whitespace-pre-wrap text-gray-900">
                                                {renderTemplateWithMockData()}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                                
                                {!showRaw && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                        <p className="text-sm text-blue-700">
                                            <strong>Önizləmə:</strong> Bu, şablonun nümunə məlumatlarla necə görünəcəyini göstərir. 
                                            Həqiqi çap zamanı dəyişənlər faktiki məlumatlarla əvəz olunacaq.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Variables */}
                        {receiptTemplate.variables && receiptTemplate.variables.length > 0 && (
                            <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Mövcud Dəyişənlər</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-2">
                                        {receiptTemplate.variables.map((variable, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                                            >
                                                {variable}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}