import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrintModal from '@/Components/PrintModal';
import { Customer, CustomerItem, TailorService } from '@/types';
import {
    ShoppingBagIcon,
    ScissorsIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowLeftIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';

interface Props {
    item: CustomerItem & {
        customer: Customer;
        full_description: string;
        display_name: string;
        status_text: string;
        status_color: string;
    };
    tailorServices: TailorService[];
}

export default function Show({ item, tailorServices }: Props) {
    const [showPrintModal, setShowPrintModal] = useState(false);

    const handleDelete = () => {
        if (confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
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
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {item.display_name}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {item.reference_number} • {item.customer.name}
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowPrintModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                        >
                            <PrinterIcon className="w-4 h-4 mr-2" />
                            Çap et
                        </button>
                        <Link
                            href={`/customer-items/${item.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Düzəliş et
                        </Link>
                        <Link
                            href="/customer-items"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="w-5 h-5 inline mr-1" />
                            Geyimlərə qayıt
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Məhsul: ${item.display_name}`} />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Item Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center">
                                    <ShoppingBagIcon className="w-12 h-12 text-gray-400 mr-4" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{item.full_description}</h3>
                                        <p className="text-sm text-gray-500">{item.reference_number}</p>
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 bg-${item.status_color}-100 text-${item.status_color}-800`}>
                                            {item.status_text}
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
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Müştəri</h4>
                                        <Link
                                            href={`/customers/${item.customer.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            {item.customer.name}
                                        </Link>
                                        {item.customer.phone && (
                                            <p className="text-sm text-gray-600">{item.customer.phone}</p>
                                        )}
                                    </div>

                                    {item.item_type && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Məhsul növü</h4>
                                            <p className="text-gray-900">{item.item_type}</p>
                                        </div>
                                    )}

                                    {item.description && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Təsvir</h4>
                                            <p className="text-gray-900">{item.description}</p>
                                        </div>
                                    )}

                                    {item.fabric_type && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Parça növü</h4>
                                            <p className="text-gray-900">{item.fabric_type}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {item.color && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Rəng</h4>
                                            <p className="text-gray-900">{item.color}</p>
                                        </div>
                                    )}

                                    {item.size && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Ölçü</h4>
                                            <p className="text-gray-900">{item.size}</p>
                                        </div>
                                    )}

                                    {item.received_date && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Qəbul tarixi</h4>
                                            <p className="text-gray-900">
                                                {new Date(item.received_date).toLocaleDateString('az-AZ')}
                                            </p>
                                        </div>
                                    )}

                                    {item.created_at && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Yaradılma tarixi</h4>
                                            <p className="text-gray-900">
                                                {new Date(item.created_at).toLocaleDateString('az-AZ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Measurements */}
                            {item.measurements && Object.keys(item.measurements).length > 0 && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Ölçülər</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(item.measurements).map(([key, value]) => (
                                            <div key={key} className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500">{key}</p>
                                                <p className="text-sm font-medium text-gray-900">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {item.notes && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Qeydlər</h4>
                                    <p className="text-gray-700">{item.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tailor Services History */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Xidmət Tarixçəsi</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Bu geyim üçün görülmüş bütün xidmətlər
                                    </p>
                                </div>
                                <Link
                                    href={`/tailor-services/create?customer_id=${item.customer.id}&customer_item_id=${item.id}`}
                                    className="inline-flex items-center px-3 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Yeni xidmət əlavə et
                                </Link>
                            </div>

                            {tailorServices && tailorServices.length > 0 ? (
                                <div className="space-y-4">
                                    {tailorServices.map((service) => (
                                        <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <ScissorsIcon className="w-5 h-5 text-gray-400" />
                                                        <span className="font-medium text-gray-900">
                                                            {service.service_number}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                                                            {service.status_text}
                                                        </span>
                                                    </div>
                                                    {service.description && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {service.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/tailor-services/${service.id}`}
                                                    className="text-blue-600 hover:text-blue-900 text-sm"
                                                >
                                                    Bax
                                                </Link>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                                                {service.received_date && (
                                                    <div>
                                                        <span className="block">Qəbul tarixi:</span>
                                                        <span className="text-gray-900">
                                                            {new Date(service.received_date).toLocaleDateString('az-AZ')}
                                                        </span>
                                                    </div>
                                                )}
                                                {service.promised_date && (
                                                    <div>
                                                        <span className="block">Təhvil tarixi:</span>
                                                        <span className="text-gray-900">
                                                            {new Date(service.promised_date).toLocaleDateString('az-AZ')}
                                                        </span>
                                                    </div>
                                                )}
                                                {service.total_cost !== undefined && service.total_cost !== null && (
                                                    <div>
                                                        <span className="block">Məbləğ:</span>
                                                        <span className="text-gray-900">
                                                            {parseFloat(service.total_cost as any).toFixed(2)} ₼
                                                        </span>
                                                    </div>
                                                )}
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
                                    ))}

                                    {tailorServices.length >= 10 && (
                                        <div className="text-center">
                                            <Link
                                                href={`/tailor-services?customer_item_id=${item.id}`}
                                                className="text-blue-600 hover:text-blue-900 text-sm"
                                            >
                                                Bütün xidmət qeydlərini gör →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ScissorsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                                        Hələ heç bir xidmət yoxdur
                                    </h4>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                        Bu geyim üçün hələ dərzi xidməti əlavə edilməyib. İlk təmir və ya dəyişiklik xidmətini əlavə edin.
                                    </p>
                                    <Link
                                        href={`/tailor-services/create?customer_id=${item.customer.id}&customer_item_id=${item.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
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

            <PrintModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                resourceType="customer-item"
                resourceId={item.id}
                title={`Məhsul ${item.reference_number}`}
            />
        </AuthenticatedLayout>
    );
}
