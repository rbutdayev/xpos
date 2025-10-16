import { Link } from '@inertiajs/react';
import { WrenchScrewdriverIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface RecentService {
    id: number;
    service_number: string;
    customer: { name: string };
    vehicle: { formatted_plate_number: string };
    total_cost: number;
    service_date: string;
}

interface RecentCustomer {
    id: number;
    name: string;
    phone: string;
    created_at: string;
}

interface RecentActivityProps {
    recentServices?: RecentService[];
    recentCustomers?: RecentCustomer[];
}

export default function RecentActivity({ recentServices = [], recentCustomers = [] }: RecentActivityProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Recent Services */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Son Servislər</h3>
                </div>
                <div className="p-6">
                    {recentServices.length > 0 ? (
                        <div className="space-y-4">
                            {recentServices.map((service) => (
                                <div key={service.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {service.service_number}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {service.customer.name} - {service.vehicle.formatted_plate_number}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                            {service.total_cost ? `${service.total_cost.toLocaleString('az-AZ')} ₼` : '-'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(service.service_date).toLocaleDateString('az-AZ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <WrenchScrewdriverIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Hələ servis qeydi yoxdur</p>
                        </div>
                    )}
                    {recentServices.length > 0 && (
                        <div className="mt-4 text-center">
                            <Link href="/service-records" className="text-sm text-blue-600 hover:text-blue-800">
                                Hamısını gör →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Customers */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Yeni Müştərilər</h3>
                </div>
                <div className="p-6">
                    {recentCustomers.length > 0 ? (
                        <div className="space-y-4">
                            {recentCustomers.map((customer) => (
                                <div key={customer.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {customer.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {customer.phone}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">
                                            {new Date(customer.created_at).toLocaleDateString('az-AZ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Hələ müştəri qeydi yoxdur</p>
                        </div>
                    )}
                    {recentCustomers.length > 0 && (
                        <div className="mt-4 text-center">
                            <Link href="/customers" className="text-sm text-blue-600 hover:text-blue-800">
                                Hamısını gör →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}