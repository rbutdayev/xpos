import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeftIcon,
    PrinterIcon,
    LanguageIcon,
} from '@heroicons/react/24/outline';

interface RentalTemplate {
    id: number;
    name: string;
    rental_category: string;
    terms_and_conditions_az: string;
    terms_and_conditions_en: string;
    damage_liability_terms_az: string;
    damage_liability_terms_en: string;
}

interface SampleData {
    customer_name: string;
    customer_id: string;
    customer_phone: string;
    rental_date: string;
    return_date: string;
    items: Array<{
        name: string;
        price: string;
    }>;
    total_amount: string;
    deposit_amount: string;
}

interface Props {
    template: RentalTemplate;
    language: string;
    sampleData: SampleData;
}

export default function Preview({ template, language: initialLanguage, sampleData }: Props) {
    const [language, setLanguage] = useState<'az' | 'en'>(initialLanguage as 'az' | 'en');

    const handleLanguageChange = (lang: 'az' | 'en') => {
        setLanguage(lang);
        router.get(`/rental-templates/${template.id}/preview?lang=${lang}`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const terms = language === 'az' ? template.terms_and_conditions_az : template.terms_and_conditions_en;
    const damageTerms = language === 'az' ? template.damage_liability_terms_az : template.damage_liability_terms_en;

    return (
        <AuthenticatedLayout>
            <Head title={`Preview: ${template.name}`} />

            <div className="max-w-7xl mx-auto">
                {/* Header - Print Hidden */}
                <div className="mb-6 print:hidden">
                    <button
                        onClick={() => router.get('/rental-templates')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Geri
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Preview: {template.name}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Nümunə məlumatlarla şablonun görünüşü
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => handleLanguageChange('az')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded ${
                                        language === 'az'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    AZ
                                </button>
                                <button
                                    onClick={() => handleLanguageChange('en')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded ${
                                        language === 'en'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    EN
                                </button>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-slate-600 flex items-center"
                            >
                                <PrinterIcon className="w-4 h-4 mr-2" />
                                Çap Et
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Document */}
                <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto print:shadow-none">
                    {/* Agreement Header */}
                    <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {language === 'az' ? 'İCARƏ MÜQAVİLƏSİ' : 'RENTAL AGREEMENT'}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {language === 'az' ? 'Sənəd Nömrəsi' : 'Document Number'}: #2025-001
                        </p>
                    </div>

                    {/* Customer Information */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3">
                            {language === 'az' ? 'MÜŞTƏRİ MƏLUMATI' : 'CUSTOMER INFORMATION'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">
                                    {language === 'az' ? 'Ad Soyad:' : 'Name:'}
                                </span> {sampleData.customer_name}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {language === 'az' ? 'Şəxsiyyət vəsiqəsi:' : 'ID:'}
                                </span> {sampleData.customer_id}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {language === 'az' ? 'Telefon:' : 'Phone:'}
                                </span> {sampleData.customer_phone}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {language === 'az' ? 'Tarix:' : 'Date:'}
                                </span> {sampleData.rental_date}
                            </div>
                        </div>
                    </div>

                    {/* Rental Items */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">
                            {language === 'az' ? 'İCARƏ MƏHSULLARI' : 'RENTAL ITEMS'}
                        </h3>
                        <table className="w-full text-sm border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        {language === 'az' ? 'Məhsul' : 'Item'}
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-right">
                                        {language === 'az' ? 'Qiymət' : 'Price'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sampleData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right">{item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-semibold">
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {language === 'az' ? 'Cəmi:' : 'Total:'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                        {sampleData.total_amount}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {language === 'az' ? 'Depozit:' : 'Deposit:'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                        {sampleData.deposit_amount}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Rental Period */}
                    <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">
                                    {language === 'az' ? 'İcarə Tarixi:' : 'Rental Date:'}
                                </span> {sampleData.rental_date}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {language === 'az' ? 'Qaytarma Tarixi:' : 'Return Date:'}
                                </span> {sampleData.return_date}
                            </div>
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-blue-900">
                            {language === 'az' ? 'ŞƏRTLƏR VƏ QAYDALAR' : 'TERMS AND CONDITIONS'}
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-700">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{terms}</pre>
                        </div>
                    </div>

                    {/* Damage Liability */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3 text-red-900">
                            {language === 'az' ? 'ZƏRƏR MƏSULİYYƏTİ' : 'DAMAGE LIABILITY'}
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-700">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{damageTerms}</pre>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-300">
                        <div>
                            <p className="text-sm text-gray-600 mb-8">
                                {language === 'az' ? 'Müştəri İmzası:' : 'Customer Signature:'}
                            </p>
                            <div className="border-b border-gray-400 pb-1 mb-2"></div>
                            <p className="text-xs text-gray-500">
                                {sampleData.customer_name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-8">
                                {language === 'az' ? 'Şirkət İmzası:' : 'Company Signature:'}
                            </p>
                            <div className="border-b border-gray-400 pb-1 mb-2"></div>
                            <p className="text-xs text-gray-500">
                                {language === 'az' ? 'Səlahiyyətli şəxs' : 'Authorized Person'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 20px;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
