import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CurrencyDollarIcon, CalendarIcon, BuildingOfficeIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '@/Hooks/useTranslations';

interface SupplierPayment {
    id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number: string | null;
    invoice_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    supplier: {
        id: number;
        name: string;
        company: string | null;
        phone: string | null;
        email: string | null;
    };
}

interface Props {
    payment: SupplierPayment;
}

export default function Show({ payment: supplier_payment }: Props) {
    const { t } = useTranslation(['suppliers', 'common']);
    const { translatePaymentMethod } = useTranslations();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('az-AZ');
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'nağd':
                return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
            case 'köçürmə':
                return <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />;
            case 'kart':
                return <CreditCardIcon className="h-5 w-5 text-purple-500" />;
            default:
                return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <AuthenticatedLayout
        >
            <Head title={`${t('payments.paymentDetails')} - ${supplier_payment.supplier.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {supplier_payment.supplier.name}
                                    {supplier_payment.supplier.company && (
                                        <span className="text-lg text-gray-600 font-normal">
                                            {' '}- {supplier_payment.supplier.company}
                                        </span>
                                    )}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                        <span className="font-semibold text-2xl text-green-600">
                                            {formatCurrency(supplier_payment.amount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        <span>{formatDate(supplier_payment.payment_date)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        {getPaymentMethodIcon(supplier_payment.payment_method)}
                                        <span className="ml-1">
                                            {translatePaymentMethod(supplier_payment.payment_method)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Payment Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        {t('payments.paymentInfo')}
                                    </h4>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('payments.fields.amount')}</dt>
                                        <dd className="mt-1 text-2xl font-bold text-green-600">
                                            {formatCurrency(supplier_payment.amount)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('payments.fields.paymentDate')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatDate(supplier_payment.payment_date)}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('payments.fields.paymentMethod')}</dt>
                                        <dd className="mt-1 flex items-center">
                                            {getPaymentMethodIcon(supplier_payment.payment_method)}
                                            <span className="ml-2 text-sm text-gray-900">
                                                {translatePaymentMethod(supplier_payment.payment_method)}
                                            </span>
                                        </dd>
                                    </div>

                                    {supplier_payment.reference_number && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('payments.fields.referenceNumber')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-mono">
                                                {supplier_payment.reference_number}
                                            </dd>
                                        </div>
                                    )}

                                    {supplier_payment.invoice_number && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('payments.fields.invoiceNumber')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-mono">
                                                {supplier_payment.invoice_number}
                                            </dd>
                                        </div>
                                    )}
                                </div>

                                {/* Supplier Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        {t('sections.contactInfo')}
                                    </h4>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">{t('fields.supplierName')}</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{supplier_payment.supplier.name}</dd>
                                    </div>

                                    {supplier_payment.supplier.company && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('fields.companyName')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{supplier_payment.supplier.company}</dd>
                                        </div>
                                    )}

                                    {supplier_payment.supplier.phone && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('fields.phone')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{supplier_payment.supplier.phone}</dd>
                                        </div>
                                    )}

                                    {supplier_payment.supplier.email && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('fields.email')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{supplier_payment.supplier.email}</dd>
                                        </div>
                                    )}

                                    {supplier_payment.notes && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">{t('payments.fields.notes')}</dt>
                                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                                {supplier_payment.notes}
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Information */}
                            <div className="border-t pt-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('sections.systemInfo')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <dt className="font-medium">{t('labels.createdAt')}</dt>
                                        <dd>{formatDateTime(supplier_payment.created_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium">{t('labels.lastModified')}</dt>
                                        <dd>{formatDateTime(supplier_payment.updated_at)}</dd>
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