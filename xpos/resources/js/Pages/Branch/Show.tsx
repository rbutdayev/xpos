import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Branch } from '@/types';
import { 
    BuildingOffice2Icon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    PencilIcon,
    CheckBadgeIcon,
    GlobeAltIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface Props {
    branch: Branch;
}

export default function Show({ branch }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title={`Filial: ${branch.name}`} />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div className="flex items-center">
                        <div>
                            <div className="flex items-center mb-2">
                                <BuildingOffice2Icon className="w-8 h-8 text-blue-600 mr-3" />
                                <h1 className="text-3xl font-bold text-gray-900">{branch.name}</h1>
                                <div className="ml-3 flex space-x-2">
                                    {branch.is_main && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            <CheckBadgeIcon className="w-4 h-4 mr-1" />
                                            Əsas Filial
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        branch.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {branch.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-600">Filial məlumatları və təfərrüatları</p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-2">
                        <Link
                            href={route('branches.edit', branch.id)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Düzəlt
                        </Link>
                    </div>
                </div>

                {/* Branch Details */}
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
                                            <dt className="text-sm font-medium text-gray-500">Filial Adı</dt>
                                            <dd className="text-sm text-gray-900">{branch.name}</dd>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <CheckBadgeIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="text-sm text-gray-900">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        branch.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {branch.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                                    </span>
                                                    {branch.is_main && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Əsas Filial
                                                        </span>
                                                    )}
                                                </div>
                                            </dd>
                                        </div>
                                    </div>

                                    {branch.address && (
                                        <div className="flex items-start">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Ünvan</dt>
                                                <dd className="text-sm text-gray-900">{branch.address}</dd>
                                            </div>
                                        </div>
                                    )}

                                    {(branch.latitude && branch.longitude) && (
                                        <div className="flex items-start">
                                            <GlobeAltIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Koordinatlar</dt>
                                                <dd className="text-sm text-gray-900">
                                                    {branch.latitude}, {branch.longitude}
                                                    <a 
                                                        href={`https://maps.google.com/?q=${branch.latitude},${branch.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-2 text-blue-600 hover:underline"
                                                    >
                                                        Xəritədə bax
                                                    </a>
                                                </dd>
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
                                    {branch.phone && (
                                        <div className="flex items-start">
                                            <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <a href={`tel:${branch.phone}`} className="text-blue-600 hover:underline">
                                                        {branch.phone}
                                                    </a>
                                                </dd>
                                            </div>
                                        </div>
                                    )}

                                    {branch.email && (
                                        <div className="flex items-start">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">E-poçt</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <a href={`mailto:${branch.email}`} className="text-blue-600 hover:underline">
                                                        {branch.email}
                                                    </a>
                                                </dd>
                                            </div>
                                        </div>
                                    )}

                                    {branch.working_hours && Object.keys(branch.working_hours).length > 0 && (
                                        <div className="flex items-start">
                                            <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">İş Saatları</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <div className="space-y-1">
                                                        {Object.entries(branch.working_hours).map(([day, hours]) => (
                                                            <div key={day} className="flex justify-between">
                                                                <span className="capitalize">{day}:</span>
                                                                <span>{JSON.stringify(hours)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </dd>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {branch.description && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Təsvir</h3>
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-600 leading-relaxed">
                                        {branch.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Warehouse Access */}
                        {branch.warehouse_access && branch.warehouse_access.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Anbar Girişi</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {branch.warehouse_access.map((access, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900 text-lg">
                                                    {access.warehouse?.name}
                                                </h4>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {access.warehouse?.type === 'main' ? 'Əsas' : 
                                                     access.warehouse?.type === 'auxiliary' ? 'Köməkçi' : 'Mobil'}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${access.can_view_stock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className="text-sm text-gray-700">Stok Görüntülə</span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${access.can_modify_stock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className="text-sm text-gray-700">Stok Dəyişdir</span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${access.can_receive_stock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className="text-sm text-gray-700">Stok Qəbul Et</span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${access.can_issue_stock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className="text-sm text-gray-700">Stok Çıxar</span>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${access.can_transfer ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className="text-sm text-gray-700">Transfer Et</span>
                                                </div>
                                            </div>
                                            
                                            {access.warehouse?.location && (
                                                <div className="mt-3 text-sm text-gray-600">
                                                    <strong>Yer:</strong> {access.warehouse.location}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        {(branch.created_at || branch.updated_at) && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                    {branch.created_at && (
                                        <div>
                                            <span className="font-medium">Yaradıldı:</span> {new Date(branch.created_at).toLocaleDateString('az-AZ')}
                                        </div>
                                    )}
                                    {branch.updated_at && (
                                        <div>
                                            <span className="font-medium">Yeniləndi:</span> {new Date(branch.updated_at).toLocaleDateString('az-AZ')}
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
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Bütün Filiallar
                        </Link>
                        <Link
                            href={route('branches.edit', branch.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Filialı Düzəlt
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}