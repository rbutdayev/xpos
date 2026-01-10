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
    TrashIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import { SERVICE_TYPES, ServiceType } from '@/config/serviceTypes';
import { useTranslation } from 'react-i18next';

interface Props {
    customer: Customer;
    customerItems: CustomerItem[];
    serviceHistory: TailorService[];
    serviceCounts: Record<ServiceType, number>;
}

export default function Show({ customer, customerItems, serviceHistory, serviceCounts }: Props) {
    const { t } = useTranslation('customers');

    const handleDelete = () => {
        if (confirm(t('messages.confirmDelete'))) {
            router.delete(`/customers/${customer.id}`);
        }
    };

    const handleDeleteItem = (item: CustomerItem) => {
        if (confirm(t('messages.confirmDeleteItem'))) {
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
        <AuthenticatedLayout>
            <Head title={customer.name} />

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
                                            {customer.is_active ? t('status.active') : t('status.inactive')}
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
                                    {customer.loyalty_card && (
                                        <div className="flex items-center">
                                            <CreditCardIcon className="w-5 h-5 text-gray-400 mr-3" />
                                            <div>
                                                <span className="text-gray-500 text-sm">{t('fields.loyaltyCard')}: </span>
                                                <span className="font-mono font-semibold text-indigo-600">{customer.loyalty_card.card_number}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {customer.active_customerItems_count || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">{t('stats.items')}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {Object.values(serviceCounts).reduce((sum, count) => sum + count, 0) || 0}
                                        </div>
                                        <div className="text-sm text-gray-500">{t('serviceHistory.totalServices')}</div>
                                    </div>
                                    <div className={`p-4 rounded-lg text-center ${
                                        (customer.total_credit_amount || 0) > 0
                                            ? 'bg-red-50'
                                            : 'bg-gray-50'
                                    }`}>
                                        <div className="flex items-center justify-center mb-1">
                                            <CreditCardIcon className={`w-5 h-5 mr-2 ${
                                                (customer.total_credit_amount || 0) > 0
                                                    ? 'text-red-600'
                                                    : 'text-gray-400'
                                            }`} />
                                        </div>
                                        <div className={`text-2xl font-bold ${
                                            (customer.total_credit_amount || 0) > 0
                                                ? 'text-red-600'
                                                : 'text-gray-900'
                                        }`}>
                                            {(customer.total_credit_amount || 0).toLocaleString('az-AZ', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })} ₼
                                        </div>
                                        <div className="text-sm text-gray-500">{t('stats.debt')}</div>
                                    </div>
                                </div>

                                {/* Loyalty Points Card */}
                                {((customer.current_points || 0) > 0 || (customer.lifetime_points || 0) > 0) && (
                                    <div className="mt-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-slate-700 p-3 rounded-full">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-blue-900">{t('fields.bonusPoints')}</div>
                                                        <div className="text-3xl font-bold text-blue-900 mt-1">
                                                            {customer.current_points || 0}
                                                        </div>
                                                        <div className="text-xs text-blue-700 mt-1">
                                                            {t('fields.currentPoints')}
                                                        </div>
                                                    </div>
                                                </div>
                                                {customer.lifetime_points && customer.lifetime_points > 0 && (
                                                    <div className="text-right">
                                                        <div className="text-xs text-blue-700">{t('fields.lifetimePoints')}</div>
                                                        <div className="text-2xl font-bold text-blue-900">
                                                            {customer.lifetime_points}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {customer.notes && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('fields.notes')}</h4>
                                    <p className="text-gray-700">{customer.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Items */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">{t('itemsDevices.title')}</h3>
                                <Link
                                    href={`/customer-items/create?customer_id=${customer.id}`}
                                    className="inline-flex items-center px-3 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600"
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
                                                            className="text-slate-600 hover:text-slate-900 text-xs"
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
                                    <p className="text-gray-500">{t('emptyState.noItems')}</p>
                                    <Link
                                        href={`/customer-items/create?customer_id=${customer.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600 mt-4"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        {t('emptyState.addFirstItem')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Service History */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">{t('serviceDetails.title')}</h3>
                                <Link
                                    href={`/tailor-services/create?customer_id=${customer.id}`}
                                    className="inline-flex items-center px-3 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600"
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
                                                        className="text-slate-600 hover:text-slate-900 text-sm"
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
                                                className="text-slate-600 hover:text-slate-900 text-sm"
                                            >
                                                {t('serviceDetails.viewAll')}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <ScissorsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">{t('emptyState.noServices')}</p>
                                    <Link
                                        href={`/tailor-services/create?customer_id=${customer.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-slate-700 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-slate-600 mt-4"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        {t('emptyState.addFirstService')}
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