import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ServiceRecord, Customer, Vehicle, Product, Service, Branch, ServiceItem, ServiceRecordFormData } from '@/types';
import { ServiceForm } from './Components/ServiceForm';

interface Props {
    serviceRecord: ServiceRecord;
    serviceItems: ServiceItem[];
    customers: Customer[];
    vehicles: Vehicle[];
    products: Product[];
    services: Service[];
    branches: Branch[];
}

export default function Edit({ 
    serviceRecord, 
    serviceItems = [], 
    customers = [], 
    vehicles = [], 
 
    products = [], 
    services = [], 
    branches = [] 
}: Props) {
    const handleSubmit = (formData: ServiceRecordFormData) => {
        router.put(`/service-records/${serviceRecord.id}`, formData);
    };

    const initialData = {
        customer_id: serviceRecord?.customer_id?.toString() || '',
        vehicle_id: serviceRecord?.vehicle_id?.toString() || '',
        branch_id: serviceRecord?.branch_id?.toString() || '',
        description: serviceRecord?.description || '',
        labor_cost: parseFloat(serviceRecord?.labor_cost?.toString() || '0') || 0,
        service_date: serviceRecord?.service_date || new Date().toISOString().split('T')[0],
        status: serviceRecord?.status || 'pending',
        notes: serviceRecord?.notes || '',
        vehicle_mileage: serviceRecord?.vehicle_mileage ? parseInt(serviceRecord.vehicle_mileage.toString()) : undefined,
        payment_status: serviceRecord?.payment_status || 'paid',
        paid_amount: parseFloat(serviceRecord?.paid_amount?.toString() || '0') || 0,
        credit_amount: parseFloat(serviceRecord?.credit_amount?.toString() || '0') || 0,
        credit_due_date: serviceRecord?.credit_due_date || '',
        credit_description: serviceRecord?.credit_description || '',
        service_items: (serviceItems || []).map(item => ({
            id: item.id,
            item_type: item.item_type || 'product',
            product_id: item.product_id?.toString() || '',
            service_id_ref: item.service_id_ref?.toString() || '',
            item_name: item.item_name || '',
            quantity: parseFloat(item.quantity?.toString() || '1') || 1,
            base_quantity: item.base_quantity || undefined,
            unit_price: parseFloat(item.unit_price?.toString() || '0') || 0,
            selling_unit: item.selling_unit || '',
            notes: item.notes || '',
        })),
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Xidmət Qeydini Redaktə Et
                </h2>
            }
        >
            <Head title="Xidmət Qeydini Redaktə Et" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <ServiceForm
                        mode="edit"
                        initialData={initialData}
                        customers={customers}
                        vehicles={vehicles}
                        products={products}
                        services={services}
                        branches={branches}
                        onSubmit={handleSubmit}
                        submitUrl={`/service-records/${serviceRecord.id}`}
                        cancelUrl="/service-records"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}