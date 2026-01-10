import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Company } from '@/types';
import { 
    BuildingOffice2Icon,
    PhoneIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    PencilIcon,
    MapPinIcon,
    TagIcon,
    LanguageIcon
} from '@heroicons/react/24/outline';

interface Props {
    company: Company;
}

export default function Index({ company }: Props) {
    const getLanguageName = (lang: string) => {
        const languages: Record<string, string> = {
            'az': 'Azərbaycan dili',
            'en': 'English',
            'tr': 'Türkçe'
        };
        return languages[lang] || lang.toUpperCase();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Şirkət Məlumatları" />

            <div className="px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div className="flex items-center">
                        <div>
                            <div className="flex items-center mb-2">
                                <BuildingOffice2Icon className="w-8 h-8 text-blue-600 mr-3" />
                                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                                <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    company.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {company.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                </span>
                            </div>
                            <p className="text-gray-600">Şirkət məlumatları və təfərrüatları</p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-2">
                        <Link
                            href={route('companies.edit', company.id)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Düzəlt
                        </Link>
                    </div>
                </div>

                {/* Company Details */}
                <div className="bg-white shadow-sm sm:rounded-lg">
                    <div className="px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Əsas Məlumatlar
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <BuildingOffice2Icon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Şirkət Adı</dt>
                                            <dd className="text-sm text-gray-900">{company.name}</dd>
                                        </div>
                                    </div>

                                    {company.tax_number && (
                                        <div className="flex items-start">
                                            <TagIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Vergi Nömrəsi</dt>
                                                <dd className="text-sm text-gray-900">{company.tax_number}</dd>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start">
                                        <LanguageIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Varsayılan Dil</dt>
                                            <dd className="text-sm text-gray-900">{getLanguageName(company.default_language)}</dd>
                                        </div>
                                    </div>

                                    {company.address && (
                                        <div className="flex items-start">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Ünvan</dt>
                                                <dd className="text-sm text-gray-900">{company.address}</dd>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Əlaqə Məlumatları
                                </h3>
                                
                                <div className="space-y-3">
                                    {company.phone && (
                                        <div className="flex items-start">
                                            <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                                                        {company.phone}
                                                    </a>
                                                </dd>
                                            </div>
                                        </div>
                                    )}

                                    {company.email && (
                                        <div className="flex items-start">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">E-poçt</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                                                        {company.email}
                                                    </a>
                                                </dd>
                                            </div>
                                        </div>
                                    )}

                                    {company.website && (
                                        <div className="flex items-start">
                                            <GlobeAltIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Veb Sayt</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <a 
                                                        href={company.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {company.website}
                                                    </a>
                                                </dd>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {company.description && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Təsvir</h3>
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-600 leading-relaxed">
                                        {company.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        {(company.created_at || company.updated_at) && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                    {company.created_at && (
                                        <div>
                                            <span className="font-medium">Yaradıldı:</span> {new Date(company.created_at).toLocaleDateString('az-AZ')}
                                        </div>
                                    )}
                                    {company.updated_at && (
                                        <div>
                                            <span className="font-medium">Yeniləndi:</span> {new Date(company.updated_at).toLocaleDateString('az-AZ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Əlaqəli Əməliyyatlar</h3>
                    <div className="flex space-x-3">
                        <Link
                            href={route('branches.index')}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            Filialları İdarə Et
                        </Link>
                        <Link
                            href={route('warehouses.index')}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            Anbarları İdarə Et
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}