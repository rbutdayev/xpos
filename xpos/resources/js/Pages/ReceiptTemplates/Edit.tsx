import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeftIcon, EyeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

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

interface Props {
    receiptTemplate: ReceiptTemplate;
}

export default function Edit({ receiptTemplate }: Props) {
    
    const { data, setData, put, processing, errors } = useForm({
        name: receiptTemplate.name,
        type: receiptTemplate.type,
        template_content: receiptTemplate.template_content,
        paper_size: receiptTemplate.paper_size,
        width_chars: receiptTemplate.width_chars,
        is_default: receiptTemplate.is_default,
        is_active: receiptTemplate.is_active,
        notes: receiptTemplate.notes || ''
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/receipt-templates/${receiptTemplate.template_id}`);
    };

    const templateTypes = [
        { value: 'sale', label: 'Satış Qəbzi' },
        { value: 'service', label: 'Xidmət Qəbzi' },
        { value: 'customer_item', label: 'Müştəri Məhsulu Qəbzi' },
        { value: 'return', label: 'Geri Qaytarma Qəbzi' },
        { value: 'payment', label: 'Ödəniş Qəbzi' }
    ];

    const paperSizes = [
        { value: '58mm', label: '58mm' },
        { value: '80mm', label: '80mm' },
        { value: 'A4', label: 'A4' },
        { value: 'letter', label: 'Letter' }
    ];

    // Available variables based on template type
    const getAvailableVariables = () => {
        const baseVariables = {
            'company_name': 'Şirkət adı',
            'company_address': 'Şirkət ünvanı',
            'company_phone': 'Şirkət telefonu',
            'company_email': 'Şirkət email',
            'company_website': 'Şirkət veb saytı',
            'tax_number': 'Vergi nömrəsi',
            'branch_name': 'Filial adı',
            'branch_address': 'Filial ünvanı',
            'branch_phone': 'Filial telefonu',
            'branch_email': 'Filial email',
            'date': 'Tarix',
            'time': 'Vaxt',
            'receipt_number': 'Qəbz nömrəsi',
            'divider': 'Ayırıcı xətt (---)',
        };

        switch (data.type) {
            case 'sale':
                return {
                    ...baseVariables,
                    'customer_name': 'Müştəri adı',
                    'customer_phone': 'Müştəri telefonu',
                    'items': 'Məhsullar (Format: ad miqdar)',
                    'subtotal': 'Ara cəm',
                    'tax_amount': 'Vergi məbləği',
                    'discount_amount': 'Endirim məbləği',
                    'total': 'Ümumi məbləğ',
                    'payment_method': 'Ödəniş üsulu',
                };
            case 'service':
                return {
                    ...baseVariables,
                    'customer_name': 'Müştəri adı',
                    'customer_vehicle': 'Avtomobil məlumatları',
                    'vehicle_number': 'Avtomobil nömrəsi',
                    'vehicle_mileage': 'Avtomobil yürüşü',
                    'vehicle_plate': 'Avtomobil nömrəsi',
                    'vehicle_brand': 'Avtomobil markası',
                    'service_description': 'Xidmət təsviri',
                    'items': 'İstifadə olunan məhsul/xidmətlər (Format: ad miqdar)',
                    'employee_name': 'Texnik adı',
                    'labor_cost': 'İş haqqı',
                    'parts_cost': 'Hissələrin dəyəri',
                    'total_cost': 'Ümumi dəyər',
                };
            case 'customer_item':
                return {
                    ...baseVariables,
                    'customer_name': 'Müştəri adı',
                    'customer_phone': 'Müştəri telefonu',
                    'item_type': 'Məhsul növü',
                    'service_type': 'Xidmət növü',
                    'item_description': 'Məhsul təsviri',
                    'item_color': 'Rəng',
                    'fabric_type': 'Parça növü',
                    'reference_number': 'Referans nömrəsi',
                    'received_date': 'Qəbul tarixi',
                    'status': 'Status',
                    'measurements': 'Ölçülər',
                    'services_count': 'Xidmət sayı',
                    'services_summary': 'Xidmətlər siyahısı',
                    'subtotal': 'Ümumi məbləğ',
                    'paid_amount': 'Ödənilmiş',
                    'balance': 'Qalıq',
                    'payment_status': 'Ödəniş statusu',
                    'notes': 'Qeydlər',
                };
            default:
                return baseVariables;
        }
    };

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('template_content') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            const newText = before + `{{${variable}}}` + after;
            setData('template_content', newText);
            
            // Set cursor position after inserted variable
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
            }, 0);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${receiptTemplate.name} - Redaktə`} />

            <div className="mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Link
                                    href="/receipt-templates"
                                    className="mr-4 text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        Qəbz Şablonunu Redaktə Et
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {receiptTemplate.name} şablonunu redaktə edin
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Link
                                    href={`/receipt-templates/${receiptTemplate.template_id}`}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <EyeIcon className="w-4 h-4 mr-2" />
                                    Önizləmə
                                </Link>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Şablon Adı
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                            required
                                        />
                                        {errors.name && <div className="mt-2 text-sm text-red-600">{errors.name}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                            Şablon Növü
                                        </label>
                                        <select
                                            id="type"
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                            required
                                        >
                                            {templateTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.type && <div className="mt-2 text-sm text-red-600">{errors.type}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="paper_size" className="block text-sm font-medium text-gray-700">
                                            Kağız Ölçüsü
                                        </label>
                                        <select
                                            id="paper_size"
                                            value={data.paper_size}
                                            onChange={(e) => setData('paper_size', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                            required
                                        >
                                            {paperSizes.map((size) => (
                                                <option key={size.value} value={size.value}>
                                                    {size.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.paper_size && <div className="mt-2 text-sm text-red-600">{errors.paper_size}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="width_chars" className="block text-sm font-medium text-gray-700">
                                            Simvol Sayı
                                        </label>
                                        <input
                                            type="number"
                                            id="width_chars"
                                            min="20"
                                            max="100"
                                            value={data.width_chars}
                                            onChange={(e) => setData('width_chars', parseInt(e.target.value))}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                            required
                                        />
                                        {errors.width_chars && <div className="mt-2 text-sm text-red-600">{errors.width_chars}</div>}
                                    </div>
                                </div>

                                {/* Settings */}
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                            Qeydlər
                                        </label>
                                        <textarea
                                            id="notes"
                                            rows={4}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                            placeholder="Şablon haqqında əlavə məlumatlar..."
                                        />
                                        {errors.notes && <div className="mt-2 text-sm text-red-600">{errors.notes}</div>}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_default"
                                                checked={data.is_default}
                                                onChange={(e) => setData('is_default', e.target.checked)}
                                                className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                                                Bu növ üçün əsas şablon
                                            </label>
                                        </div>
                                        {errors.is_default && <div className="mt-2 text-sm text-red-600">{errors.is_default}</div>}

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                                Aktiv
                                            </label>
                                        </div>
                                        {errors.is_active && <div className="mt-2 text-sm text-red-600">{errors.is_active}</div>}
                                    </div>
                                </div>
                            </div>

            {/* Template Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Content Editor */}
                <div className="lg:col-span-2">
                    <label htmlFor="template_content" className="block text-sm font-medium text-gray-700">
                        Şablon Məzmunu
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="template_content"
                            rows={15}
                            value={data.template_content}
                            onChange={(e) => setData('template_content', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm font-mono"
                            placeholder="Şablon məzmununu daxil edin..."
                            required
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        Dəyişənlər üçün {'{'}{'{'}<em>dəyişən_adı</em>{'}'}{'}'}  formatından istifadə edin
                    </p>
                    {errors.template_content && <div className="mt-2 text-sm text-red-600">{errors.template_content}</div>}
                </div>

                {/* Available Variables */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Mövcud Dəyişənlər
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                            {Object.entries(getAvailableVariables()).map(([variable, description]) => (
                                <button
                                    key={variable}
                                    type="button"
                                    onClick={() => insertVariable(variable)}
                                    className="w-full text-left flex items-center justify-between p-2 text-xs bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                    title={`Klik edərək şablona əlavə edin: {{${variable}}}`}
                                >
                                    <div>
                                        <div className="font-mono text-blue-600">
                                            {'{'}{'{'}{variable}{'}'}{'}'}</div>
                                        <div className="text-gray-600 mt-1">
                                            {description}
                                        </div>
                                    </div>
                                    <ClipboardDocumentIcon className="w-4 h-4 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Dəyişənləri şablona əlavə etmək üçün üzərinə klik edin
                    </p>
                </div>
            </div>

                            {/* Form Actions */}
                            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                                <Link
                                    href="/receipt-templates"
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    Ləğv et
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                                >
                                    {processing ? 'Saxlanılır...' : 'Dəyişiklikləri Saxla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}