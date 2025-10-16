import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrintModal from '@/Components/PrintModal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { ServiceRecord, ServiceItem } from '@/types';
import { __ } from '@/utils/translations';
import { 
    WrenchScrewdriverIcon, 
    UserIcon,
    TruckIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    PencilIcon,
    TrashIcon,
    PrinterIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

interface Props {
    serviceRecord: ServiceRecord;
    serviceItems: ServiceItem[];
}

export default function Show({ serviceRecord, serviceItems }: Props) {
    const [showPrintModal, setShowPrintModal] = React.useState(false);
    const [showAddPayment, setShowAddPayment] = useState(false);

    const { data: paymentData, setData: setPaymentData, patch: patchPayment, processing: paymentProcessing, errors: paymentErrors, reset: resetPayment } = useForm({
        amount: '',
        description: '',
        method: 'nağd',
    });

    const handleDelete = () => {
        if (confirm('Bu servis qeydini silmək istədiyinizə əminsiniz?')) {
            router.delete(`/service-records/${serviceRecord.id}`);
        }
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        patchPayment(route('service-records.pay-credit', serviceRecord.id), {
            onSuccess: () => {
                resetPayment();
                setShowAddPayment(false);
            }
        });
    };

    const formatCurrency = (amount: number | null | undefined) => {
        return `${(Number(amount) || 0).toFixed(2)} AZN`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ');
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'in_progress': return '🔧';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '❓';
        }
    };

    const totalItemsCost = serviceItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Servis qeydi: {serviceRecord.service_number}
                    </h2>
                    <div className="flex space-x-4">
                        <Link
                            href={`/service-records/${serviceRecord.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Düzəliş et
                        </Link>
                        <Link
                            href="/service-records"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            ← Servis qeydlərinə qayıt
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Servis qeydi: ${serviceRecord.service_number}`} />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Service Record Information */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center">
                                    <WrenchScrewdriverIcon className="w-12 h-12 text-gray-400 mr-4" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{serviceRecord.service_number}</h3>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(serviceRecord.status)}`}>
                                                {getStatusIcon(serviceRecord.status)} {serviceRecord.status_text}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowPrintModal(true)}
                                        className="text-gray-600 hover:text-gray-900"
                                        title="Çap et"
                                    >
                                        <PrinterIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="text-red-600 hover:text-red-900"
                                        title="Sil"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Service Details */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Servis təfərrüatları</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-900">{serviceRecord.description}</p>
                                    </div>
                                </div>

                                {/* Customer and Vehicle Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {serviceRecord.customer && (
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center mb-3">
                                                <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                                                <h4 className="text-sm font-medium text-gray-900">Müştəri məlumatları</h4>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <Link
                                                        href={`/customers/${serviceRecord.customer.id}`}
                                                        className="font-medium text-blue-600 hover:text-blue-900"
                                                    >
                                                        {serviceRecord.customer.name}
                                                    </Link>
                                                </div>
                                                <div className="text-gray-500">
                                                    {serviceRecord.customer.customer_type_text}
                                                </div>
                                                {serviceRecord.customer.phone && (
                                                    <div className="text-gray-600">
                                                        📞 {serviceRecord.customer.formatted_phone}
                                                    </div>
                                                )}
                                                {serviceRecord.customer.email && (
                                                    <div className="text-gray-600">
                                                        ✉️ {serviceRecord.customer.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {serviceRecord.vehicle && (
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center mb-3">
                                                <TruckIcon className="w-5 h-5 text-gray-400 mr-2" />
                                                <h4 className="text-sm font-medium text-gray-900">Nəqliyyat vasitəsi</h4>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <Link
                                                        href={`/vehicles/${serviceRecord.vehicle.id}`}
                                                        className="font-medium text-blue-600 hover:text-blue-900"
                                                    >
                                                        {serviceRecord.vehicle.full_name}
                                                    </Link>
                                                </div>
                                                <div className="text-gray-600">
                                                    🚗 {serviceRecord.vehicle.formatted_plate}
                                                </div>
                                                <div className="text-gray-500">
                                                    {serviceRecord.vehicle.engine_type_text}
                                                </div>
                                                {serviceRecord.vehicle.mileage && (
                                                    <div className="text-gray-500">
                                                        📊 {serviceRecord.vehicle.mileage.toLocaleString('az-AZ')} km
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Service Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                                        <CalendarIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                        <div className="text-sm text-gray-500">Servis tarixi</div>
                                        <div className="font-medium">
                                            {new Date(serviceRecord.service_date).toLocaleDateString('az-AZ')}
                                        </div>
                                    </div>
                                    
                                    {serviceRecord.vehicle_mileage && (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center">
                                            <svg className="w-6 h-6 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <div className="text-sm text-gray-500">Kilometraj</div>
                                            <div className="font-medium">
                                                {serviceRecord.vehicle_mileage.toLocaleString('az-AZ')} km
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                                        <CurrencyDollarIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                        <div className="text-sm text-gray-500">Əmək haqqı</div>
                                        <div className="font-medium text-green-600">
                                            {serviceRecord.formatted_labor_cost}
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                                        <CurrencyDollarIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                        <div className="text-sm text-gray-500">Məhsul və xidmətlər</div>
                                        <div className="font-medium text-blue-600">
                                            {totalItemsCost.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AZN
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                                        <CurrencyDollarIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                        <div className="text-sm text-gray-500">Ümumi məbləğ</div>
                                        <div className="font-medium text-lg text-green-600">
                                            {serviceRecord.formatted_total_cost}
                                        </div>
                                    </div>
                                </div>

                                 {/* Employee Info */}
                                {serviceRecord.user && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <UserCircleIcon className="w-5 h-5 text-gray-400 mr-2" />
                                            <h4 className="text-sm font-medium text-gray-900">Məsul işçi</h4>
                                        </div>
                                        <div className="mt-2">
                                            <div className="font-medium">{serviceRecord.user.name}</div>
                                            <div className="text-sm text-gray-500">{serviceRecord.user?.position || ''}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Branch Info */}
                                {serviceRecord.branch && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <h4 className="text-sm font-medium text-gray-900">Filial</h4>
                                        </div>
                                        <div className="mt-2">
                                            <div className="font-medium">{serviceRecord.branch.name}</div>
                                            {serviceRecord.branch.address && (
                                                <div className="text-sm text-gray-500">{serviceRecord.branch.address}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {serviceRecord.notes && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Qeydlər</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700">{serviceRecord.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Service Items */}
                    {serviceItems.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">İstifadə olunan məhsul və xidmətlər</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Məhsul/Xidmət
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    SKU/Kod
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Miqdar
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Vahid qiyməti
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Məbləğ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {serviceItems.map((item) => (
                                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.item_type === 'product' && item.product ? (
                                                <Link
                                                    href={`/products/${item.product.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    {item.product.name}
                                                </Link>
                                            ) : item.item_type === 'service' && item.service ? (
                                                <span className="text-green-600">
                                                    {item.service.name}
                                                </span>
                                            ) : item.item_name ? (
                                                <span className="text-gray-600 italic">
                                                    {item.item_name}
                                                </span>
                                            ) : (
                                                <span className="text-red-600">
                                                    Məhsul/xidmət silinib
                                                </span>
                                            )}
                                            {item.item_type === 'service' && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Xidmət
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.item_type === 'product' && item.product ? item.product.sku || '-' : 
                                         item.item_type === 'service' && item.service ? item.service.code || '-' : '-'}
                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div>
                                                            {item.quantity.toLocaleString('az-AZ', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                                            {item.item_type === 'product' && item.product && (
                                                                <span className="ml-1 text-gray-500">
                                                                    {item.product.base_unit || item.product.unit || 'ədəd'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.base_quantity && item.base_quantity !== item.quantity && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Stokdan: {item.base_quantity.toLocaleString('az-AZ', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                                                {item.item_type === 'product' && item.product && (
                                                                    <span className="ml-1">
                                                                        {item.product.unit || 'ədəd'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.unit_price.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} AZN
                                                        {item.item_type === 'product' && item.product && (
                                                            <span className="text-gray-500">
                                                                /{item.product.base_unit || item.product.unit || 'ədəd'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {(item.quantity * item.unit_price).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AZN
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    Məhsul və xidmətlər üzrə cəmi:
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    {totalItemsCost.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AZN
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cost Summary */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Məbləğ xülasəsi</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Əmək haqqı:</span>
                                    <span className="font-medium">{serviceRecord.formatted_labor_cost}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Məhsul və xidmətlər:</span>
                                    <span className="font-medium">{totalItemsCost.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AZN</span>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg">
                                        <span className="font-medium text-gray-900">Ümumi məbləğ:</span>
                                        <span className="font-bold text-green-600">{serviceRecord.formatted_total_cost}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Ödəniş statusu</h3>
                            {serviceRecord.payment_status === 'credit' || serviceRecord.payment_status === 'partial' ? (
                                <PrimaryButton 
                                    onClick={() => setShowAddPayment(!showAddPayment)}
                                    disabled={paymentProcessing}
                                >
                                    {showAddPayment ? 'Ləğv et' : 'Ödəniş əlavə et'}
                                </PrimaryButton>
                            ) : null}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Ödəniş statusu</h4>
                                <div>
                                    {serviceRecord.payment_status === 'paid' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✅ Tam ödənilmiş
                                        </span>
                                    ) : serviceRecord.payment_status === 'credit' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            ❌ Borc
                                        </span>
                                    ) : serviceRecord.payment_status === 'partial' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            ⏳ Qismən ödənilmiş
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            ⏸️ Ödənilməmiş
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Ödənilmiş</h4>
                                <p className="text-lg font-semibold text-green-600">
                                    {formatCurrency(serviceRecord.paid_amount || 0)}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Qalan borc</h4>
                                <p className={`text-lg font-semibold ${(serviceRecord.credit_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(serviceRecord.credit_amount || 0)}
                                </p>
                            </div>
                        </div>

                        {/* Add Payment Form */}
                        {showAddPayment && (
                            <div className="border-t pt-6">
                                <form onSubmit={handleAddPayment} className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Yeni ödəniş əlavə et</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <InputLabel htmlFor="payment_method" value="Ödəniş üsulu" />
                                            <select
                                                id="payment_method"
                                                value={paymentData.method}
                                                onChange={(e) => setPaymentData('method', e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="nağd">Nağd</option>
                                                <option value="kart">Kart</option>
                                                <option value="köçürmə">Bank köçürməsi</option>
                                            </select>
                                            <InputError message={paymentErrors.method} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="amount" value="Ödəniş məbləği" />
                                            <TextInput
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                max={serviceRecord.credit_amount || 0}
                                                value={paymentData.amount}
                                                onChange={(e) => setPaymentData('amount', e.target.value)}
                                                placeholder={`Maksimum: ${formatCurrency(serviceRecord.credit_amount || 0)}`}
                                                className="mt-1 block w-full"
                                                required
                                            />
                                            <InputError message={paymentErrors.amount} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="description" value="Qeyd" />
                                            <TextInput
                                                id="description"
                                                value={paymentData.description}
                                                onChange={(e) => setPaymentData('description', e.target.value)}
                                                placeholder="Ödəniş haqqında qeyd..."
                                                className="mt-1 block w-full"
                                            />
                                            <InputError message={paymentErrors.description} className="mt-2" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <PrimaryButton type="submit" disabled={paymentProcessing}>
                                            {paymentProcessing ? 'Əlavə edilir...' : 'Ödəniş əlavə et'}
                                        </PrimaryButton>
                                        <SecondaryButton type="button" onClick={() => setShowAddPayment(false)}>
                                            Ləğv et
                                        </SecondaryButton>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Audit Information */}
                    <div className="bg-gray-50 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <span className="font-medium">Yaradılma tarixi:</span>
                                    <span className="ml-2">
                                        {serviceRecord.created_at ? new Date(serviceRecord.created_at).toLocaleString('az-AZ') : '-'}
                                    </span>
                                </div>
                                {serviceRecord.updated_at && (
                                    <div>
                                        <span className="font-medium">Son yeniləmə:</span>
                                        <span className="ml-2">
                                            {new Date(serviceRecord.updated_at).toLocaleString('az-AZ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PrintModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                resourceType="service-record"
                resourceId={serviceRecord.id}
                title={`Servis qeydi: ${serviceRecord.service_number}`}
            />
        </AuthenticatedLayout>
    );
}