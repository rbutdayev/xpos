import { memo, useEffect, useCallback, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Customer, Vehicle, Product, Service, Branch, ServiceRecordFormData } from '@/types';
import { useServiceItems } from '../Hooks/useServiceItems';
import { useServiceCalculations } from '../Hooks/useServiceCalculations';
import { useSectionToggle } from '../Hooks/useSectionToggle';
import { validateServiceRecord, calculatePaymentAmounts } from '../Utils/serviceValidation';
import { SectionHeader } from './SectionHeader';
import { BasicInformationSection } from './BasicInformationSection';
import { ServiceItemsSection } from './ServiceItemsSection';
import { LaborSection } from './LaborSection';
import { PaymentSection } from './PaymentSection';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Link } from '@inertiajs/react';

interface ServiceFormProps {
    mode: 'create' | 'edit';
    initialData?: Partial<ServiceRecordFormData>;
    customers: Customer[];
    vehicles: Vehicle[];
    products: Product[];
    services: Service[];
    branches: Branch[];
    onSubmit: (data: ServiceRecordFormData) => void;
    submitUrl: string;
    cancelUrl: string;
}

export const ServiceForm = memo(({
    mode,
    initialData,
    customers,
    vehicles,
    products,
    services,
    branches,
    onSubmit,
    submitUrl,
    cancelUrl
}: ServiceFormProps) => {
    const { data, setData, errors, processing, reset } = useForm<ServiceRecordFormData>({
        customer_id: initialData?.customer_id || '',
        vehicle_id: initialData?.vehicle_id || '',
        vehicle_mileage: initialData?.vehicle_mileage || undefined,
        branch_id: initialData?.branch_id || '',
        service_date: initialData?.service_date || new Date().toISOString().split('T')[0],
        description: initialData?.description || '',
        status: initialData?.status || 'pending',
        labor_cost: initialData?.labor_cost || 0,
        payment_status: initialData?.payment_status || 'unpaid',
        paid_amount: initialData?.paid_amount || 0,
        credit_amount: initialData?.credit_amount || 0,
        notes: initialData?.notes || '',
        service_items: initialData?.service_items || []
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const {
        serviceItems,
        setServiceItems,
        selectedProducts,
        addServiceItem,
        removeServiceItem,
        updateServiceItem,
        addProductToServiceItems,
        isProductSelected
    } = useServiceItems(data.service_items);

    const totals = useServiceCalculations(serviceItems, data.labor_cost);

    const { toggleSection, isSectionExpanded } = useSectionToggle([
        'basic_info',
        'service_items',
        'labor_cost',
        'payment'
    ]);

    // Update form data when service items change
    useEffect(() => {
        setData('service_items', serviceItems);
    }, [serviceItems, setData]);

    // Auto-update payment amounts when payment status or total changes
    useEffect(() => {
        if (data.payment_status === 'paid') {
            const amounts = calculatePaymentAmounts(totals.totalCost, data.payment_status);
            setData(prev => ({
                ...prev,
                paid_amount: amounts.paid_amount,
                credit_amount: amounts.credit_amount
            }));
        } else if (data.payment_status === 'credit') {
            const amounts = calculatePaymentAmounts(totals.totalCost, data.payment_status);
            setData(prev => ({
                ...prev,
                paid_amount: amounts.paid_amount,
                credit_amount: amounts.credit_amount
            }));
        } else if (data.payment_status === 'unpaid') {
            setData(prev => ({
                ...prev,
                paid_amount: 0,
                credit_amount: 0
            }));
        }
        // For 'partial' status, don't auto-update - let user manually input amounts
    }, [data.payment_status, totals.totalCost, setData]);

    const handleFieldChange = useCallback((field: string, value: string | number) => {
        (setData as any)(field, value);
    }, [setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form data
        const validationErrors = validateServiceRecord({
            customer_id: data.customer_id,
            description: data.description,
            vehicle_id: data.vehicle_id,
            vehicle_mileage: data.vehicle_mileage
        });

        if (Object.keys(validationErrors).length > 0) {
            // Display validation errors in UI
            setClientErrors(validationErrors);

            // Scroll to the first error (basic info section)
            const basicInfoSection = document.querySelector('[data-section="basic_info"]');
            if (basicInfoSection) {
                basicInfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            return; // Prevent form submission
        }

        // Clear client errors if validation passes
        setClientErrors({});
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden" data-section="basic_info">
                <SectionHeader
                    title="Əsas Məlumatlar"
                    isExpanded={isSectionExpanded('basic_info')}
                    onToggle={() => toggleSection('basic_info')}
                />
                {isSectionExpanded('basic_info') && (
                    <div className="p-6 border-t border-gray-200">
                        <BasicInformationSection
                            data={data}
                            errors={{ ...errors, ...clientErrors }}
                            onDataChange={handleFieldChange}
                            customers={customers}
                            vehicles={vehicles}
                            branches={branches}
                            processing={processing}
                        />
                    </div>
                )}
            </div>

            {/* Service Items Section */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <SectionHeader
                    title="Məhsul və Xidmətlər"
                    subtitle={`${serviceItems.length} element`}
                    isExpanded={isSectionExpanded('service_items')}
                    onToggle={() => toggleSection('service_items')}
                />
                {isSectionExpanded('service_items') && (
                    <div className="p-6 border-t border-gray-200">
                        <ServiceItemsSection
                            serviceItems={serviceItems}
                            onAddItem={addServiceItem}
                            onRemoveItem={removeServiceItem}
                            onUpdateItem={updateServiceItem}
                            onAddProduct={addProductToServiceItems}
                            products={products}
                            services={services}
                            selectedProducts={selectedProducts}
                            branchId={data.branch_id}
                            processing={processing}
                        />
                    </div>
                )}
            </div>

            {/* Labor Cost Section */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <SectionHeader
                    title="İş Xərcləri və Hesabat"
                    subtitle={totals.formattedTotalCost}
                    isExpanded={isSectionExpanded('labor_cost')}
                    onToggle={() => toggleSection('labor_cost')}
                />
                {isSectionExpanded('labor_cost') && (
                    <div className="p-6 border-t border-gray-200">
                        <LaborSection
                            laborCost={data.labor_cost}
                            onLaborCostChange={(cost) => setData('labor_cost', cost)}
                            totals={totals}
                            errors={errors}
                            processing={processing}
                        />
                    </div>
                )}
            </div>

            {/* Payment Section */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <SectionHeader
                    title="Ödəniş Məlumatları"
                    subtitle={data.payment_status === 'paid' ? 'Ödənilib' : 
                              data.payment_status === 'credit' ? 'Borc' : 
                              data.payment_status === 'partial' ? 'Qismən' : 'Ödənilməyib'}
                    isExpanded={isSectionExpanded('payment')}
                    onToggle={() => toggleSection('payment')}
                />
                {isSectionExpanded('payment') && (
                    <div className="p-6 border-t border-gray-200">
                        <PaymentSection
                            paymentStatus={data.payment_status || 'unpaid'}
                            paidAmount={data.paid_amount || 0}
                            creditAmount={data.credit_amount || 0}
                            totals={totals}
                            onPaymentStatusChange={(status) => setData('payment_status', status as any)}
                            onPaidAmountChange={(amount) => setData('paid_amount', amount)}
                            onCreditAmountChange={(amount) => setData('credit_amount', amount)}
                            errors={errors}
                            processing={processing}
                        />
                    </div>
                )}
            </div>

            {/* Additional Notes */}
            <div className="bg-white shadow-sm rounded-lg p-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Əlavə Qeydlər
                </label>
                <textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    disabled={processing}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Əlavə qeydlər və ya xüsusi təlimatlar..."
                />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link href={cancelUrl}>
                    <SecondaryButton type="button" disabled={processing}>
                        Ləğv et
                    </SecondaryButton>
                </Link>
                
                <PrimaryButton type="submit" disabled={processing}>
                    {processing ? 'Yadda saxlanılır...' : mode === 'create' ? 'Xidmət qeydini yarat' : 'Dəyişiklikləri saxla'}
                </PrimaryButton>
            </div>
        </form>
    );
});