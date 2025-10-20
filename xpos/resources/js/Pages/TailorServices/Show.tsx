import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { PageProps } from '@/types';
import { getServiceConfig, getCurrentServiceType, routeParamToServiceType, serviceTypeToRouteParam } from '@/config/serviceTypes';

interface TailorService {
    id: number;
    service_number: string;
    customer: {
        id: number;
        name: string;
        phone?: string;
    };
    customer_item?: {
        id: number;
        display_name: string;
    };
    employee?: {
        id: number;
        name: string;
    };
    branch: {
        id: number;
        name: string;
    };
    description: string;
    item_condition?: string;
    labor_cost: number;
    materials_cost: number;
    total_cost: number;
    received_date: string;
    promised_date?: string;
    completed_date?: string;
    delivered_date?: string;
    status: string;
    status_text: string;
    status_color: string;
    payment_status: string;
    payment_status_text: string;
    payment_status_color: string;
    paid_amount: number;
    credit_amount: number;
    credit_due_date?: string;
    notes?: string;
    items: Array<{
        id: number;
        item_type: string;
        item_name: string;
        display_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
    }>;
    creator: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface Props extends PageProps {
    service: TailorService;
    serviceType?: string;
}

export default function Show({ service, serviceType }: Props) {
    // Get service type from props or determine from URL/localStorage
    const currentServiceType = serviceType
        ? routeParamToServiceType(serviceType)
        : getCurrentServiceType();
    const serviceConfig = getServiceConfig(currentServiceType);
    const routeParam = serviceTypeToRouteParam(currentServiceType);

    const handleDelete = () => {
        if (confirm('Bu xidməti silmək istədiyinizə əminsiniz?')) {
            router.delete(route('services.destroy', { serviceType: routeParam, tailorService: service.id }));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Xidmət {service.service_number}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Yaradılıb: {new Date(service.created_at).toLocaleString('az-AZ')}
                            {service.creator && ` - ${service.creator.name}`}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            href={route('services.edit', { serviceType: routeParam, tailorService: service.id })}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                        >
                            Düzəliş et
                        </Link>
                        <Link
                            href={route('services.index', { serviceType: routeParam })}
                            className="text-gray-600 hover:text-gray-900 inline-flex items-center"
                        >
                            Geri
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Xidmət ${service.service_number}`} />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Status Card */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Status</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">İş statusu:</span>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                                    ${service.status_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                    ${service.status_color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                                                    ${service.status_color === 'green' ? 'bg-green-100 text-green-800' : ''}
                                                    ${service.status_color === 'purple' ? 'bg-purple-100 text-purple-800' : ''}
                                                    ${service.status_color === 'red' ? 'bg-red-100 text-red-800' : ''}
                                                `}>
                                                    {service.status_text}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Ödəniş statusu:</span>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                                    ${service.payment_status_color === 'green' ? 'bg-green-100 text-green-800' : ''}
                                                    ${service.payment_status_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                    ${service.payment_status_color === 'red' ? 'bg-red-100 text-red-800' : ''}
                                                    ${service.payment_status_color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                                                `}>
                                                    {service.payment_status_text}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Ödəniş Məlumatları</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Ödənən məbləğ:</span>
                                                <span className="font-medium text-green-600">
                                                    {parseFloat(service.paid_amount as any).toFixed(2)} ₼
                                                </span>
                                            </div>
                                            {(service.payment_status === 'credit' || service.payment_status === 'partial') && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Borc məbləği:</span>
                                                        <span className="font-medium text-orange-600">
                                                            {parseFloat(service.credit_amount as any).toFixed(2)} ₼
                                                        </span>
                                                    </div>
                                                    {service.credit_due_date && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Borc ödəmə tarixi:</span>
                                                            <span className="font-medium">
                                                                {new Date(service.credit_due_date).toLocaleDateString('az-AZ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div className="flex justify-between pt-2 border-t">
                                                <span className="text-gray-600 font-semibold">Ümumi məbləğ:</span>
                                                <span className="font-bold text-lg">
                                                    {parseFloat(service.total_cost as any).toFixed(2)} ₼
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Müştəri məlumatı</h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-gray-600">Ad:</span>
                                                <p className="font-medium">{service.customer.name}</p>
                                            </div>
                                            {service.customer.phone && (
                                                <div>
                                                    <span className="text-gray-600">Telefon:</span>
                                                    <p className="font-medium">{service.customer.phone}</p>
                                                </div>
                                            )}
                                            {service.customer_item && (
                                                <div>
                                                    <span className="text-gray-600">Məhsul:</span>
                                                    <p className="font-medium">{service.customer_item.display_name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Service Details */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Xidmət təsviri</h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
                                        {service.item_condition && (
                                            <div className="mt-3 pt-3 border-t">
                                                <span className="text-sm text-gray-600">Məhsulun vəziyyəti:</span>
                                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                                    {service.item_condition}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {service.notes && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h3 className="font-semibold mb-3">Qeydlər</h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">{service.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Dates */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Tarixlər</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Qəbul tarixi:</span>
                                                <span className="font-medium">
                                                    {new Date(service.received_date).toLocaleDateString('az-AZ')}
                                                </span>
                                            </div>
                                            {service.promised_date && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Vəd olunan tarix:</span>
                                                    <span className="font-medium">
                                                        {new Date(service.promised_date).toLocaleDateString('az-AZ')}
                                                    </span>
                                                </div>
                                            )}
                                            {service.completed_date && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Tamamlanma tarixi:</span>
                                                    <span className="font-medium">
                                                        {new Date(service.completed_date).toLocaleDateString('az-AZ')}
                                                    </span>
                                                </div>
                                            )}
                                            {service.delivered_date && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Təhvil tarixi:</span>
                                                    <span className="font-medium">
                                                        {new Date(service.delivered_date).toLocaleDateString('az-AZ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Other Info */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Digər məlumatlar</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Filial:</span>
                                                <span className="font-medium">{service.branch.name}</span>
                                            </div>
                                            {service.employee && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Məsul işçi:</span>
                                                    <span className="font-medium">{service.employee.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Services */}
                                    {service.items.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h3 className="font-semibold mb-3">Əlavə xidmətlər</h3>
                                            <div className="space-y-2">
                                                {service.items.map(item => (
                                                    <div key={item.id} className="flex justify-between text-sm">
                                                        <div className="flex-1">
                                                            <span className="font-medium">{item.display_name}</span>
                                                            <span className="text-gray-500 ml-2">
                                                                {item.quantity} × {parseFloat(item.unit_price as any).toFixed(2)} ₼
                                                            </span>
                                                        </div>
                                                        <span className="font-medium">{parseFloat(item.total_price as any).toFixed(2)} ₼</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cost Summary */}
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Xərc məlumatı</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>İşçilik xərci:</span>
                                                <span className="font-medium">{parseFloat(service.labor_cost as any).toFixed(2)} ₼</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Əlavə xidmət xərci:</span>
                                                <span className="font-medium">{parseFloat(service.materials_cost as any).toFixed(2)} ₼</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                                <span>Ümumi:</span>
                                                <span>{parseFloat(service.total_cost as any).toFixed(2)} ₼</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
