import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Warehouse } from '@/types';
import { 
    BuildingStorefrontIcon,
    MapPinIcon,
    PencilIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    UserGroupIcon,
    CogIcon
} from '@heroicons/react/24/outline';

interface Props {
    warehouse: Warehouse;
}

export default function Show({ warehouse }: Props) {
    const getWarehouseTypeText = (type: string) => {
        const types: Record<string, string> = {
            'main': 'Əsas Anbar',
            'auxiliary': 'Köməkçi Anbar',
            'mobile': 'Mobil Anbar'
        };
        return types[type] || type;
    };

    const getWarehouseTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'main': 'bg-blue-100 text-blue-800',
            'auxiliary': 'bg-green-100 text-green-800',
            'mobile': 'bg-purple-100 text-purple-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Anbar: ${warehouse.name}`} />

            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div className="flex items-center">
                        <div>
                            <div className="flex items-center mb-2">
                                <BuildingStorefrontIcon className="w-8 h-8 text-blue-600 mr-3" />
                                <h1 className="text-3xl font-bold text-gray-900">{warehouse.name}</h1>
                                <div className="ml-3 flex space-x-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getWarehouseTypeColor(warehouse.type)}`}>
                                        {getWarehouseTypeText(warehouse.type)}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        warehouse.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {warehouse.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-600">Anbar məlumatları və təfərrüatları</p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-2">
                        <Link
                            href={route('warehouses.edit', warehouse.id)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Düzəlt
                        </Link>
                    </div>
                </div>

                {/* Warehouse Details */}
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
                                        <BuildingStorefrontIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Anbar Adı</dt>
                                            <dd className="text-sm text-gray-900">{warehouse.name}</dd>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <CogIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Anbar Növü</dt>
                                            <dd className="text-sm text-gray-900">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getWarehouseTypeColor(warehouse.type)}`}>
                                                    {getWarehouseTypeText(warehouse.type)}
                                                </span>
                                            </dd>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <CheckBadgeIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="text-sm text-gray-900">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    warehouse.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {warehouse.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                                </span>
                                            </dd>
                                        </div>
                                    </div>

                                    {warehouse.location && (
                                        <div className="flex items-start">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Yer/Ünvan</dt>
                                                <dd className="text-sm text-gray-900">{warehouse.location}</dd>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Tənzimləmələr
                                </h3>
                                
                                <div className="space-y-3">

                                    {warehouse.settings && Object.keys(warehouse.settings).length > 0 && (
                                        <div className="flex items-start">
                                            <CogIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Əlavə Tənzimləmələr</dt>
                                                <dd className="text-sm text-gray-900">
                                                    <pre className="text-xs bg-gray-50 p-2 rounded">
                                                        {JSON.stringify(warehouse.settings, null, 2)}
                                                    </pre>
                                                </dd>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {warehouse.description && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Təsvir</h3>
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-600 leading-relaxed">
                                        {warehouse.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Branch Access */}
                        {warehouse.branch_access && warehouse.branch_access.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center mb-3">
                                    <UserGroupIcon className="w-6 h-6 text-gray-400 mr-2" />
                                    <h3 className="text-lg font-medium text-gray-900">Filial İcazələri</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {warehouse.branch_access.map((access) => (
                                        <div key={access.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900">
                                                    {access.branch?.name}
                                                </h4>
                                                {access.branch?.is_main && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Əsas
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Görüntülə:</span>
                                                    <span className={access.can_view_stock ? 'text-green-600' : 'text-red-600'}>
                                                        {access.can_view_stock ? 'Bəli' : 'Xeyr'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Dəyişdir:</span>
                                                    <span className={access.can_modify_stock ? 'text-green-600' : 'text-red-600'}>
                                                        {access.can_modify_stock ? 'Bəli' : 'Xeyr'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Transfer:</span>
                                                    <span className={access.can_transfer ? 'text-green-600' : 'text-red-600'}>
                                                        {access.can_transfer ? 'Bəli' : 'Xeyr'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Qəbul:</span>
                                                    <span className={access.can_receive_stock ? 'text-green-600' : 'text-red-600'}>
                                                        {access.can_receive_stock ? 'Bəli' : 'Xeyr'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between col-span-2">
                                                    <span className="text-gray-600">Buraxma:</span>
                                                    <span className={access.can_issue_stock ? 'text-green-600' : 'text-red-600'}>
                                                        {access.can_issue_stock ? 'Bəli' : 'Xeyr'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        {(warehouse.created_at || warehouse.updated_at) && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                    {warehouse.created_at && (
                                        <div>
                                            <span className="font-medium">Yaradıldı:</span> {new Date(warehouse.created_at).toLocaleDateString('az-AZ')}
                                        </div>
                                    )}
                                    {warehouse.updated_at && (
                                        <div>
                                            <span className="font-medium">Yeniləndi:</span> {new Date(warehouse.updated_at).toLocaleDateString('az-AZ')}
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
                            href={route('warehouses.index')}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Bütün Anbarlar
                        </Link>
                        <Link
                            href={route('warehouses.edit', warehouse.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Anbarı Düzəlt
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}