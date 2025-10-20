import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Customer, CustomerItem, TailorService } from '@/types';
import {
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    ShoppingBagIcon,
    ScissorsIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { SERVICE_TYPES, ServiceType } from '@/config/serviceTypes';

interface Props {
    customer: Customer;
    customerItems: CustomerItem[];
    serviceHistory: TailorService[];
    serviceCounts: Record<ServiceType, number>;
}

export default function Show({ customer, customerItems, serviceHistory, serviceCounts }: Props) {
    const handleDelete = () => {
        if (confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) {
            router.delete(`/customers/${customer.id}`);
        }
    };

    const handleDeleteItem = (item: CustomerItem) => {
        if (confirm('Bu geyimi silmək istədiyinizə əminsiniz?')) {
            router.delete(`/customer-items/${item.id}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Müştəri: {customer.name}
                    </h2>
                    <div className="flex space-x-4">
                        <Link
                            href={`/customers/${customer.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Düzəliş et
                        </Link>
                        <Link
                            href="/customers"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            ← Müştərilərə qayıt
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Müştəri: ${customer.name}`} />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center">
                                    <UserIcon className="w-12 h-12 text-gray-400 mr-4" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                                        <p className="text-sm text-gray-500">{customer.customer_type_text}</p>
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                                            customer.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {customer.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDelete}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {customer.phone && (
                                        <div className="flex items-center">
                                            <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                                            <span className="text-gray-900">{customer.formatted_phone}</span>
                                        </div>
                                    )}
                                    {customer.email && (
                                        <div className="flex items-center">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                                            <span className="text-gray-900">{customer.email}</span>
                                        </div>
                                    )}
                                    {customer.address && (
                                        <div className="flex items-start">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                            <span className="text-gray-900">{customer.address}</span>
                                        </div>
                                    )}
                                    {customer.tax_number && (
                                        <div className="flex items-center">
                                            <span className="text-gray-500 mr-3">VÖEN:</span>
                                            <span className="text-gray-900">{customer.tax_number}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {customer.active_customerItems_count || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">Məhsul/Cihaz</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {Object.values(serviceCounts).reduce((sum, count) => sum + count, 0) || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">Ümumi xidmətlər</div>
                                    </div>
                                </div>
                            </div>

                            {customer.notes && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Qeydlər</h4>
                                    <p className="text-gray-700">{customer.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Items */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">Məhsullar/Cihazlar</h3>
                                <Link
                                    href={`/customer-items/create?customer_id=${customer.id}`}
                                    className="inline-flex items-center px-3 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Əlavə et
                                </Link>
                            </div>

                            {customerItems.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {customerItems.map((item) => {
                                        const serviceConfig = SERVICE_TYPES[item.service_type as ServiceType];
                                        const ItemIcon = serviceConfig?.icon || ShoppingBagIcon;

                                        return (
                                            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center">
                                                        <ItemIcon className="w-6 h-6 text-gray-400 mr-3" />
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {item.full_description || item.description}
                                                            </h4>
                                                            <p className="text-sm text-gray-500">
                                                                {item.reference_number}
                                                            </p>
                                                            {serviceConfig && (
                                                                <p className="text-xs text-blue-600 mt-1">
                                                                    {serviceConfig.nameSingular}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={`/customer-items/${item.id}`}
                                                            className="text-blue-600 hover:text-blue-900 text-xs"
                                                        >
                                                            Bax
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteItem(item)}
                                                            className="text-red-600 hover:text-red-900 text-xs"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-gray-500 space-y-1">
                                                    {item.fabric_type && (
                                                        <div>Parça: {item.fabric_type}</div>
                                                    )}
                                                    {item.size && (
                                                        <div>Ölçü: {item.size}</div>
                                                    )}
                                                    <div>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${item.status_color}-100 text-${item.status_color}-800`}>
                                                            {item.status_text}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Hələ məhsul/cihaz əlavə edilməyib</p>
                                    <Link
                                        href={`/customer-items/create?customer_id=${customer.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 mt-4"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        İlk məhsulu əlavə et
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Service History */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">Xidmətlər tarixçəsi</h3>
                                <Link
                                    href={`/tailor-services/create?customer_id=${customer.id}`}
                                    className="inline-flex items-center px-3 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Yeni xidmət
                                </Link>
                            </div>

                            {serviceHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {serviceHistory.map((service) => {
                                        const serviceConfig = SERVICE_TYPES[service.service_type as ServiceType];
                                        const ServiceIcon = serviceConfig?.icon || ScissorsIcon;

                                        return (
                                            <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <ServiceIcon className="w-5 h-5 text-gray-400" />
                                                            <span className="font-medium text-gray-900">
                                                                {service.service_number}
                                                            </span>
                                                            {serviceConfig && (
                                                                <span className="text-xs text-blue-600">
                                                                    {serviceConfig.nameSingular}
                                                                </span>
                                                            )}
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                                                                {service.status_text}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {service.description}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/tailor-services/${service.id}`}
                                                        className="text-blue-600 hover:text-blue-900 text-sm"
                                                    >
                                                        Bax
                                                    </Link>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                                                    <div>
                                                        <span className="block">Tarix:</span>
                                                        <span className="text-gray-900">
                                                            {new Date(service.received_date).toLocaleDateString('az-AZ')}
                                                        </span>
                                                    </div>
                                                    {service.customer_item && (
                                                        <div>
                                                            <span className="block">Məhsul:</span>
                                                            <span className="text-gray-900">
                                                                {service.customer_item.description}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="block">Məbləğ:</span>
                                                        <span className="text-gray-900">
                                                            {service.formatted_total_cost}
                                                        </span>
                                                    </div>
                                                    {service.employee && (
                                                        <div>
                                                            <span className="block">İşçi:</span>
                                                            <span className="text-gray-900">
                                                                {service.employee.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {serviceHistory.length >= 10 && (
                                        <div className="text-center">
                                            <Link
                                                href={`/tailor-services?customer_id=${customer.id}`}
                                                className="text-blue-600 hover:text-blue-900 text-sm"
                                            >
                                                Bütün xidmət qeydlərini gör →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <ScissorsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Hələ xidmət qeydi yoxdur</p>
                                    <Link
                                        href={`/tailor-services/create?customer_id=${customer.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 mt-4"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        İlk xidməti əlavə et
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}