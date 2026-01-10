import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeftIcon,
    PencilIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    PhotoIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface RentalTemplate {
    id: number;
    name: string;
    rental_category: string;
    terms_and_conditions_az: string;
    terms_and_conditions_en: string;
    damage_liability_terms_az: string;
    damage_liability_terms_en: string;
    condition_checklist: any[];
    is_active: boolean;
    is_default: boolean;
    require_photos: boolean;
    min_photos: number;
    notes: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    template: RentalTemplate;
    categoryName: string;
}

export default function Show({ template, categoryName }: Props) {
    const [activeTab, setActiveTab] = useState<'az' | 'en'>('az');

    return (
        <AuthenticatedLayout>
            <Head title={`Şablon: ${template.name}`} />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.get('/rental-templates')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Geri
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <DocumentTextIcon className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {template.name}
                                    </h1>
                                    {template.is_default && (
                                        <div className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                            <StarSolidIcon className="w-3 h-3 mr-1" />
                                            Default
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">
                                    {categoryName}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => router.get(`/rental-templates/${template.id}/preview`)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                                <EyeIcon className="w-4 h-4 mr-2" />
                                Preview
                            </button>
                            <button
                                onClick={() => router.get(`/rental-templates/${template.id}/edit`)}
                                className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-slate-600 flex items-center"
                            >
                                <PencilIcon className="w-4 h-4 mr-2" />
                                Düzəlt
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">Status</div>
                        <div className="flex items-center">
                            {template.is_active ? (
                                <>
                                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                                    <span className="font-medium text-green-600">Aktiv</span>
                                </>
                            ) : (
                                <>
                                    <XCircleIcon className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="font-medium text-gray-600">Qeyri-aktiv</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">Kateqoriya</div>
                        <div className="font-medium text-gray-900">
                            {categoryName}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">Foto Tələbləri</div>
                        <div className="flex items-center">
                            {template.require_photos ? (
                                <>
                                    <PhotoIcon className="w-5 h-5 text-blue-600 mr-2" />
                                    <span className="font-medium text-gray-900">
                                        Min: {template.min_photos}
                                    </span>
                                </>
                            ) : (
                                <span className="font-medium text-gray-600">Tələb olunmur</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="text-sm text-gray-600 mb-1">Yenilənmə</div>
                        <div className="font-medium text-gray-900">
                            {new Date(template.updated_at).toLocaleDateString('az-AZ')}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {template.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-medium text-blue-900 mb-1">Qeydlər</h3>
                        <p className="text-sm text-blue-800">{template.notes}</p>
                    </div>
                )}

                {/* Language Tabs */}
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('az')}
                                className={`px-6 py-3 text-sm font-medium ${
                                    activeTab === 'az'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Azərbaycan dili
                            </button>
                            <button
                                onClick={() => setActiveTab('en')}
                                className={`px-6 py-3 text-sm font-medium ${
                                    activeTab === 'en'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                English
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'az' ? (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Şərtlər və Qaydalar
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                                            {template.terms_and_conditions_az}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Zərər Məsuliyyəti Şərtləri
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                                            {template.damage_liability_terms_az}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Terms and Conditions
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        {template.terms_and_conditions_en ? (
                                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                                                {template.terms_and_conditions_en}
                                            </pre>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                English version not available
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Damage Liability Terms
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        {template.damage_liability_terms_en ? (
                                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                                                {template.damage_liability_terms_en}
                                            </pre>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                English version not available
                                            </p>
                                        )}
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
